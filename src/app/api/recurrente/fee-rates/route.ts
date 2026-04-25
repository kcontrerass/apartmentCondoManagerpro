import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getRecurrenteKeysForComplexOrEnv, getRecurrenteKeysFromEnv } from "@/lib/recurrente";
import { getPlatformRecurrenteKeys } from "@/lib/platform-billing";
import { resolveRecurrenteFeeConfig } from "@/lib/recurrente-fee-config";
import { getDefaultRecurrenteFeeConfigFromEnv } from "@/lib/recurrente-fee-config-env";
import { apiError, apiOk } from "@/lib/api-response";

/**
 * Devuelve la configuración de comisión (PCT + Q fijos) usada al crear checkouts.
 * Origen: `RECURRENTE_FEE_RATES_URL` → campos en `/api/account` (cuando existan) → .env → default.
 * Query:
 *  - `complexId` — claves del complejo (o env)
 *  - `platform=1` — claves de suscripción a la plataforma
 *  - sin parámetros — solo `RECURRENTE_*` en entorno
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const complexId = searchParams.get("complexId")?.trim() || null;
        const platform = searchParams.get("platform") === "1" || searchParams.get("scope") === "platform";

        let keys = getRecurrenteKeysFromEnv();

        if (platform) {
            keys = (await getPlatformRecurrenteKeys()) ?? getRecurrenteKeysFromEnv();
        } else if (complexId) {
            const complex = await prisma.complex.findUnique({
                where: { id: complexId },
                select: { settings: true },
            });
            keys = getRecurrenteKeysForComplexOrEnv(complex?.settings) ?? getRecurrenteKeysFromEnv();
        } else {
            const session = await auth();
            if (session?.user) {
                const user = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    select: { complexId: true },
                });
                if (user?.complexId) {
                    const complex = await prisma.complex.findUnique({
                        where: { id: user.complexId },
                        select: { settings: true },
                    });
                    keys = getRecurrenteKeysForComplexOrEnv(complex?.settings) ?? getRecurrenteKeysFromEnv();
                }
            }
        }

        const config = keys
            ? await resolveRecurrenteFeeConfig(keys)
            : getDefaultRecurrenteFeeConfigFromEnv();
        return apiOk({ config });
    } catch (e) {
        console.error("[RECURRENTE_FEE_RATES_GET]", e);
        return apiError({ code: "INTERNAL", message: "Error al resolver tarifas" }, 500);
    }
}
