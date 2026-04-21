import type { RecurrenteKeys } from "@/lib/recurrente";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

/**
 * Claves Recurrente de la plataforma (suscripción / cuenta del operador).
 * Orden: registro en BD (`PlatformRecurrenteSettings`) → variables PLATFORM_* → RECURRENTE_* del .env
 */
export async function getPlatformRecurrenteKeys(): Promise<RecurrenteKeys | null> {
    let row: { publicKey: string | null; secretKey: string | null; webhookSecret: string | null } | null =
        null;
    try {
        row = await prisma.platformRecurrenteSettings.findUnique({
            where: { id: "default" },
            select: { publicKey: true, secretKey: true, webhookSecret: true },
        });
    } catch {
        row = null;
    }

    const publicKey =
        row?.publicKey?.trim() ||
        process.env.PLATFORM_RECURRENTE_PUBLIC_KEY ||
        process.env.RECURRENTE_PUBLIC_KEY ||
        "";
    const secretKey =
        row?.secretKey?.trim() ||
        process.env.PLATFORM_RECURRENTE_SECRET_KEY ||
        process.env.RECURRENTE_SECRET_KEY ||
        "";
    const webhookSecret =
        row?.webhookSecret?.trim() ||
        process.env.PLATFORM_RECURRENTE_WEBHOOK_SECRET ||
        process.env.RECURRENTE_WEBHOOK_SECRET ||
        undefined;

    if (!publicKey || !secretKey) return null;
    return { publicKey, secretKey, webhookSecret: webhookSecret || undefined };
}

/** Indica si hay algún valor de Recurrente plataforma persistido en BD (public, secret o webhook). */
export async function hasPlatformRecurrenteKeysInDb(): Promise<boolean> {
    try {
        const row = await prisma.platformRecurrenteSettings.findUnique({
            where: { id: "default" },
            select: { publicKey: true, secretKey: true, webhookSecret: true },
        });
        return !!(
            row?.publicKey?.trim() ||
            row?.secretKey?.trim() ||
            row?.webhookSecret?.trim()
        );
    } catch {
        return false;
    }
}

/** Precio en quetzales (GTQ) por periodo. Orden: BD → PLATFORM_SUBSCRIPTION_PRICE_GTQ → 199 */
export async function getPlatformSubscriptionPriceGtq(): Promise<number> {
    try {
        const row = await prisma.platformRecurrenteSettings.findUnique({
            where: { id: "default" },
            select: { subscriptionPriceGtq: true },
        });
        if (row?.subscriptionPriceGtq != null) {
            const n = Number(row.subscriptionPriceGtq);
            if (Number.isFinite(n) && n > 0) return n;
        }
    } catch {
        /* columna o tabla ausente */
    }
    const raw = process.env.PLATFORM_SUBSCRIPTION_PRICE_GTQ;
    const n = raw ? parseFloat(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 199;
}

/** Meses que cubre cada pago. Orden: BD → PLATFORM_SUBSCRIPTION_PERIOD_MONTHS → 1 */
export async function getPlatformSubscriptionPeriodMonths(): Promise<number> {
    try {
        const row = await prisma.platformRecurrenteSettings.findUnique({
            where: { id: "default" },
            select: { subscriptionPeriodMonths: true },
        });
        if (row?.subscriptionPeriodMonths != null) {
            const m = row.subscriptionPeriodMonths;
            if (Number.isFinite(m) && m > 0) return m;
        }
    } catch {
        /* columna o tabla ausente */
    }
    const raw = process.env.PLATFORM_SUBSCRIPTION_PERIOD_MONTHS;
    const n = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Instrucciones para pagar la suscripción por transferencia (cuenta del operador).
 * Orden: BD (`PlatformRecurrenteSettings`) → PLATFORM_SUBSCRIPTION_BANK_INSTRUCTIONS
 */
export async function getPlatformSubscriptionBankInstructions(): Promise<string | null> {
    let fromDb: string | null = null;
    try {
        const row = await prisma.platformRecurrenteSettings.findUnique({
            where: { id: "default" },
            select: { bankTransferInstructions: true },
        });
        fromDb = row?.bankTransferInstructions?.trim() || null;
    } catch {
        fromDb = null;
    }
    const fromEnv = process.env.PLATFORM_SUBSCRIPTION_BANK_INSTRUCTIONS?.trim() || null;
    return fromDb || fromEnv || null;
}

/**
 * Teléfono del súper administrador para enviar el comprobante de suscripción por transferencia.
 * Orden: primer usuario SUPER_ADMIN con `phone` en BD → PLATFORM_SUBSCRIPTION_PROOF_PHONE (.env).
 */
export async function getPlatformSubscriptionProofPhone(): Promise<string | null> {
    try {
        const superAdmins = await prisma.user.findMany({
            where: { role: Role.SUPER_ADMIN, phone: { not: null } },
            select: { phone: true },
            orderBy: { updatedAt: "desc" },
            take: 20,
        });
        const fromProfile =
            superAdmins
                .map((u) => u.phone?.trim().replace(/\s+/g, "") || "")
                .find((p) => p.length > 0) || null;
        if (fromProfile) return fromProfile;
    } catch {
        /* BD */
    }
    return process.env.PLATFORM_SUBSCRIPTION_PROOF_PHONE?.trim().replace(/\s+/g, "") || null;
}
