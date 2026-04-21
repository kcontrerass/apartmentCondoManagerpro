import { prisma } from "@/lib/db";
import {
    evaluatePlatformSubscriptionAccess,
    type PlatformSubscriptionAccessResult,
} from "@/lib/platform-subscription-rules";

export { evaluatePlatformSubscriptionAccess } from "@/lib/platform-subscription-rules";
export type { PlatformSubscriptionAccessInput, PlatformSubscriptionAccessResult } from "@/lib/platform-subscription-rules";
export {
    isApiPathExemptFromPlatformSubscription,
    isDashboardPathExemptWhenPlatformDelinquent,
} from "@/lib/platform-subscription-rules";

export async function getPlatformSubscriptionGraceDays(): Promise<number> {
    try {
        const row = await prisma.platformRecurrenteSettings.findUnique({
            where: { id: "default" },
            select: { subscriptionGraceDays: true },
        });
        if (row?.subscriptionGraceDays != null && row.subscriptionGraceDays >= 0) {
            return Math.min(365, row.subscriptionGraceDays);
        }
    } catch {
        /* columna o tabla ausente */
    }
    const env = process.env.PLATFORM_SUBSCRIPTION_GRACE_DAYS;
    if (env != null && env !== "") {
        const n = parseInt(env, 10);
        if (Number.isFinite(n) && n >= 0) {
            return Math.min(365, n);
        }
    }
    return 0;
}

export async function getPlatformSubscriptionAccessForComplex(
    complexId: string
): Promise<PlatformSubscriptionAccessResult & { platformPaidUntil: Date | null }> {
    const complex = await prisma.complex.findUnique({
        where: { id: complexId },
        select: { platformPaidUntil: true, createdAt: true },
    });
    if (!complex) {
        const now = new Date();
        return {
            allowed: true,
            graceDays: 0,
            accessDeadline: now,
            platformPaidUntil: null,
        };
    }
    const graceDays = await getPlatformSubscriptionGraceDays();
    const evaluated = evaluatePlatformSubscriptionAccess({
        platformPaidUntil: complex.platformPaidUntil,
        complexCreatedAt: complex.createdAt,
        graceDays,
    });
    return { ...evaluated, platformPaidUntil: complex.platformPaidUntil };
}
