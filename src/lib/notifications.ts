import webpush from 'web-push';
import { InvoiceCategory } from '@prisma/client';
import { prisma } from './db';
import { routing } from '@/i18n/routing';
import { pushDashboardUrl } from '@/lib/push-dashboard-paths';
import { Role } from '@/types/roles';

// Configure web-push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@condomanager.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

interface NotificationPayload {
    title: string;
    body: string;
    url?: string;
    icon?: string;
}

/** Prefix dashboard (and app) paths with default locale so next-intl opens the right route. */
function withLocalePath(path: string): string {
    if (!path || path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    if (/^\/(en|es)(\/|$)/.test(path)) {
        return path;
    }
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `/${routing.defaultLocale}${normalized}`;
}

function normalizePayload(payload: NotificationPayload): NotificationPayload {
    if (!payload.url) {
        return payload;
    }
    return { ...payload, url: withLocalePath(payload.url) };
}

/** Cuerpo JSON para `web-push` (misma normalización de `url` que en envíos internos). */
export function pushPayloadJson(payload: NotificationPayload): string {
    return JSON.stringify(normalizePayload(payload));
}

export type SendUserNotificationOptions = {
    /**
     * Por defecto los súper administradores no reciben push (solo pagos de suscripción plataforma).
     */
    allowSuperAdmin?: boolean;
};

/**
 * Send a push notification to a specific user
 */
export async function sendUserNotification(
    userId: string,
    payload: NotificationPayload,
    options?: SendUserNotificationOptions
) {
    try {
        const user = await (prisma as any).user.findUnique({
            where: { id: userId },
            select: { settings: true, role: true },
        });

        if (!user) return;
        if (user.role === Role.SUPER_ADMIN && !options?.allowSuperAdmin) {
            return;
        }

        const settings = (user.settings as Record<string, unknown> | null) || {};
        const subscription = settings.pushSubscription as any;

        if (!subscription) return;

        const body = normalizePayload(payload);
        await webpush.sendNotification(subscription, JSON.stringify(body));
        console.log(`Push notification sent to user ${userId}`);
    } catch (error) {
        console.error(`Error sending push to user ${userId}:`, error);
    }
}

/**
 * Push solo para súper administradores: un condominio pagó la suscripción a la plataforma.
 */
export async function notifySuperAdminsPlatformCondoPayment(opts: {
    complexName: string;
    amountCents: number;
    currency: string;
    paymentMethod: string;
}) {
    try {
        const amount = (opts.amountCents / 100).toFixed(2);
        const methodLabel =
            opts.paymentMethod === "CARD"
                ? "tarjeta"
                : opts.paymentMethod === "BANK_TRANSFER"
                  ? "transferencia"
                  : opts.paymentMethod;
        const superAdmins = await (prisma as any).user.findMany({
            where: { role: Role.SUPER_ADMIN },
            select: { id: true },
        });
        const payload: NotificationPayload = {
            title: "Pago de suscripción (condominio)",
            body: `${opts.complexName} · ${amount} ${opts.currency} (${methodLabel}).`,
            url: pushDashboardUrl.platformPayments,
        };
        for (const u of superAdmins) {
            await sendUserNotification(u.id, payload, { allowSuperAdmin: true });
        }
    } catch (e) {
        console.error("[notifySuperAdminsPlatformCondoPayment]", e);
    }
}

/**
 * Notificación al usuario marcado como administrador del complejo (`Complex.adminId`).
 * Si no hay `adminId`, hace fallback a usuarios con rol ADMIN en ese complejo.
 * `exceptUserId`: no envía si el administrador es ese usuario (p. ej. quien creó el incidente).
 */
export async function notifyComplexPrimaryAdmin(
    complexId: string,
    payload: NotificationPayload,
    opts?: { exceptUserId?: string }
) {
    try {
        const cx = await prisma.complex.findUnique({
            where: { id: complexId },
            select: { adminId: true },
        });
        if (cx?.adminId && cx.adminId !== opts?.exceptUserId) {
            await sendUserNotification(cx.adminId, payload);
            return;
        }
        if (!cx?.adminId) {
            await sendComplexNotification(complexId, [Role.ADMIN], payload);
        }
    } catch (e) {
        console.error("[notifyComplexPrimaryAdmin]", e);
    }
}

/**
 * Envía push a usuarios del **mismo complejo** con los roles indicados.
 * No incluye SUPER_ADMIN salvo que tenga vínculo con el complejo (misma regla de filtro).
 */
export async function sendComplexNotification(complexId: string, roles: string[], payload: NotificationPayload) {
    try {
        const rolesFiltered = roles.filter((r) => r !== Role.SUPER_ADMIN);
        if (rolesFiltered.length === 0) {
            return;
        }

        console.log(`📣 Searching for users in complex ${complexId} with roles: ${rolesFiltered.join(", ")}`);

        const users = await (prisma as any).user.findMany({
            where: {
                AND: [
                    { role: { in: rolesFiltered as any } },
                    {
                        OR: [
                            { complexId: complexId },
                            { managedComplexes: { id: complexId } },
                            { residentProfile: { unit: { complexId: complexId } } },
                        ],
                    },
                ],
            },
            select: { id: true, settings: true, role: true, name: true },
        });

        console.log(`👥 Found ${users.length} potential users (push only if subscribed).`);

        const body = normalizePayload(payload);

        const sendPromises = users.map((user: any) => {
            const settings = (user.settings as Record<string, unknown> | null) || {};
            const subscription = settings.pushSubscription as any;

            if (subscription) {
                console.log(`📤 Sending push to ${user.name} (${user.role})`);
                return webpush
                    .sendNotification(subscription, JSON.stringify(body))
                    .then(() => console.log(`✅ Push delivered to ${user.name}`))
                    .catch((err) => {
                        console.error(`❌ Error sending notification to ${user.id}:`, err.message);
                    });
            }
            return Promise.resolve();
        });

        await Promise.all(sendPromises);
        console.log(`🏁 Broadcast notification process finished for ${users.length} users in complex ${complexId}`);
    } catch (error) {
        console.error(`🚨 Error in broadcast notification for complex ${complexId}:`, error);
    }
}

/** Push to administradores del complejo, guardias y junta cuando un residente registra o actualiza datos de huésped Airbnb. */
export async function notifyStaffOfAirbnbGuestRegistration(opts: {
    complexId: string;
    unitNumber: string;
    residentName: string;
    guestName: string;
    guestIdentification: string;
}) {
    const { complexId, unitNumber, residentName, guestName, guestIdentification } = opts;
    await sendComplexNotification(complexId, [Role.ADMIN, Role.GUARD, Role.BOARD_OF_DIRECTORS], {
        title: 'Huésped Airbnb registrado',
        body: `${residentName} · Unidad ${unitNumber}: ${guestName} (ID: ${guestIdentification}).`,
        url: pushDashboardUrl.residents,
    });
}

/** Notify all residents on the unit linked to an invoice when it is marked paid (manual or webhook). */
export async function notifyInvoicePaidToUnitResidents(invoiceId: string) {
    try {
        const invoice = await (prisma as any).invoice.findUnique({
            where: { id: invoiceId },
            include: {
                unit: {
                    include: {
                        residents: { select: { userId: true } },
                    },
                },
            },
        });
        if (!invoice?.unit?.residents?.length) return;
        if (invoice.category === InvoiceCategory.PLATFORM_SUBSCRIPTION) return;

        for (const r of invoice.unit.residents) {
            await sendUserNotification(r.userId, {
                title: 'Factura pagada',
                body: `Se registró el pago de la factura ${invoice.number}.`,
                url: pushDashboardUrl.invoices,
            });
        }
    } catch (e) {
        console.error('[notifyInvoicePaidToUnitResidents]', e);
    }
}
