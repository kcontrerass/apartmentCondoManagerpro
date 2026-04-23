import { Role } from "@/types/roles";

function endOfUtcDay(d: Date): Date {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const day = d.getUTCDate();
    return new Date(Date.UTC(y, m, day, 23, 59, 59, 999));
}

function addUtcDays(d: Date, days: number): Date {
    return new Date(d.getTime() + days * 86_400_000);
}

export type PlatformSubscriptionAccessInput = {
    platformPaidUntil: Date | null;
    complexCreatedAt: Date;
    graceDays: number;
};

export type PlatformSubscriptionAccessResult = {
    allowed: boolean;
    graceDays: number;
    accessDeadline: Date;
};

/**
 * Vigencia = fin del día UTC de `platformPaidUntil` + `graceDays` días completos.
 * Sin pagos previos: se usa `complexCreatedAt` como inicio del período de gracia inicial.
 */
export function evaluatePlatformSubscriptionAccess(
    input: PlatformSubscriptionAccessInput
): PlatformSubscriptionAccessResult {
    const graceDays = Math.max(0, Math.min(365, Math.floor(input.graceDays)));

    let accessDeadline: Date;
    if (input.platformPaidUntil) {
        accessDeadline = addUtcDays(endOfUtcDay(input.platformPaidUntil), graceDays);
    } else {
        accessDeadline = addUtcDays(endOfUtcDay(input.complexCreatedAt), graceDays);
    }

    const allowed = Date.now() <= accessDeadline.getTime();
    return { allowed, graceDays, accessDeadline };
}

const EXEMPT_API_PATH_PREFIXES = [
    "/api/auth",
    "/api/cron",
    "/api/payments/webhook",
    "/api/platform-fee/access-for-session",
    "/api/platform-fee/status",
    "/api/platform-fee/checkout",
    "/api/platform-fee/my-payments",
    "/api/platform-fee/release-pending-card",
    "/api/platform-fee/sync-after-card-return",
    /// Config. Recurrente (súper admin); no depende de suscripción a la plataforma
    "/api/platform/recurrente-config",
    "/api/users/profile",
    "/api/users/change-password",
    "/api/notifications/subscribe",
    "/api/notifications/unsubscribe",
];

export function isApiPathExemptFromPlatformSubscription(pathname: string): boolean {
    return EXEMPT_API_PATH_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
}

export function canPayPlatformSubscriptionRole(role?: string): boolean {
    return role === Role.ADMIN || role === Role.BOARD_OF_DIRECTORS;
}

/** Solo suscripción y retorno de pago; únicamente para administrador y junta directiva. */
const PAYMENT_EXEMPT_PREFIXES = [
    "/dashboard/platform-subscription",
    "/dashboard/payments/success",
    "/dashboard/payments/cancel",
];

export function isDashboardPathExemptWhenPlatformDelinquent(
    pathname: string,
    userRole?: string
): boolean {
    if (!canPayPlatformSubscriptionRole(userRole)) {
        return false;
    }
    return PAYMENT_EXEMPT_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
    );
}
