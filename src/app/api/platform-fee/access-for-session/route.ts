import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
import { evaluatePlatformSubscriptionAccess } from "@/lib/platform-subscription-rules";
import { getPlatformSubscriptionGraceDays } from "@/lib/platform-subscription-access";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return apiOk({ allowed: true });
        }
        if (session.user.role === Role.SUPER_ADMIN) {
            return apiOk({ allowed: true });
        }
        const complexId = (session.user as { complexId?: string | null }).complexId;
        if (!complexId) {
            return apiOk({ allowed: true });
        }

        const complex = await prisma.complex.findUnique({
            where: { id: complexId },
            select: { platformPaidUntil: true, createdAt: true },
        });
        if (!complex) {
            return apiOk({ allowed: true });
        }

        const graceDays = await getPlatformSubscriptionGraceDays();
        const { allowed } = evaluatePlatformSubscriptionAccess({
            platformPaidUntil: complex.platformPaidUntil,
            complexCreatedAt: complex.createdAt,
            graceDays,
        });

        if (allowed) {
            return apiOk({ allowed: true });
        }

        return apiError(
            {
                code: "PLATFORM_SUBSCRIPTION_PAST_DUE",
                message:
                    "La suscripción a la plataforma está vencida. Renueva el pago para continuar usando la aplicación.",
            },
            403
        );
    } catch (e) {
        console.error("[PLATFORM_FEE_ACCESS_FOR_SESSION]", e);
        return apiOk({ allowed: true });
    }
}
