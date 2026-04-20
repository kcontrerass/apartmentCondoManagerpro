import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
import { apiError, apiOk } from "@/lib/api-response";
import { getPlatformRecurrenteKeys, hasPlatformRecurrenteKeysInDb } from "@/lib/platform-billing";
import { Prisma } from "@prisma/client";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
            return apiError({ code: "FORBIDDEN", message: "Solo súper administrador" }, 403);
        }

        let row: {
            publicKey: string | null;
            secretKey: string | null;
            webhookSecret: string | null;
            bankTransferInstructions: string | null;
            subscriptionPriceGtq: Prisma.Decimal | null;
            subscriptionPeriodMonths: number | null;
        } | null = null;
        try {
            row = await prisma.platformRecurrenteSettings.findUnique({
                where: { id: "default" },
            });
        } catch {
            row = null;
        }

        const keys = await getPlatformRecurrenteKeys();
        const inDb = await hasPlatformRecurrenteKeysInDb();

        return apiOk({
            publicKey: row?.publicKey?.trim() ?? "",
            bankTransferInstructions: row?.bankTransferInstructions?.trim() ?? "",
            subscriptionPriceGtq: row?.subscriptionPriceGtq != null ? String(row.subscriptionPriceGtq) : "",
            subscriptionPeriodMonths: row?.subscriptionPeriodMonths ?? null,
            secretKeyConfigured: !!(row?.secretKey && row.secretKey.length > 0),
            webhookSecretConfigured: !!(row?.webhookSecret && row.webhookSecret.length > 0),
            keysActive: !!keys,
            usingDatabaseKeys: inDb,
        });
    } catch (error: unknown) {
        console.error("[PLATFORM_RECURRENTE_CONFIG_GET]", error);
        return apiError({ code: "INTERNAL_ERROR", message: "Error al leer configuración" }, 500);
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
            return apiError({ code: "FORBIDDEN", message: "Solo súper administrador" }, 403);
        }

        const body = (await request.json()) as {
            publicKey?: string;
            secretKey?: string;
            webhookSecret?: string;
            bankTransferInstructions?: string;
            subscriptionPriceGtq?: number | string | null;
            subscriptionPeriodMonths?: number | string | null;
        };

        const existing = await prisma.platformRecurrenteSettings.findUnique({
            where: { id: "default" },
        });

        const publicKeyNext =
            typeof body.publicKey === "string" ? body.publicKey.trim() || null : existing?.publicKey ?? null;

        let secretKeyNext = existing?.secretKey ?? null;
        if (typeof body.secretKey === "string" && body.secretKey.trim() !== "") {
            secretKeyNext = body.secretKey.trim();
        }

        let webhookSecretNext = existing?.webhookSecret ?? null;
        if (typeof body.webhookSecret === "string" && body.webhookSecret.trim() !== "") {
            webhookSecretNext = body.webhookSecret.trim();
        }

        let bankInstructionsNext = existing?.bankTransferInstructions ?? null;
        if (typeof body.bankTransferInstructions === "string") {
            bankInstructionsNext = body.bankTransferInstructions.trim() || null;
        }

        let subscriptionPriceNext: Prisma.Decimal | null = existing?.subscriptionPriceGtq ?? null;
        if (body.subscriptionPriceGtq !== undefined) {
            if (body.subscriptionPriceGtq === null || body.subscriptionPriceGtq === "") {
                subscriptionPriceNext = null;
            } else {
                const p =
                    typeof body.subscriptionPriceGtq === "number"
                        ? body.subscriptionPriceGtq
                        : parseFloat(String(body.subscriptionPriceGtq).replace(",", "."));
                if (!Number.isFinite(p) || p <= 0 || p > 1_000_000) {
                    return apiError(
                        { code: "VALIDATION", message: "Precio inválido (número positivo, máx. 1 000 000 GTQ)" },
                        400
                    );
                }
                subscriptionPriceNext = new Prisma.Decimal(p.toFixed(2));
            }
        }

        let subscriptionPeriodNext = existing?.subscriptionPeriodMonths ?? null;
        if (body.subscriptionPeriodMonths !== undefined) {
            if (body.subscriptionPeriodMonths === null || body.subscriptionPeriodMonths === "") {
                subscriptionPeriodNext = null;
            } else {
                const m =
                    typeof body.subscriptionPeriodMonths === "number"
                        ? body.subscriptionPeriodMonths
                        : parseInt(String(body.subscriptionPeriodMonths), 10);
                if (!Number.isInteger(m) || m < 1 || m > 120) {
                    return apiError({ code: "VALIDATION", message: "Meses inválidos (entero entre 1 y 120)" }, 400);
                }
                subscriptionPeriodNext = m;
            }
        }

        await prisma.platformRecurrenteSettings.upsert({
            where: { id: "default" },
            create: {
                id: "default",
                publicKey: publicKeyNext,
                secretKey: secretKeyNext,
                webhookSecret: webhookSecretNext,
                bankTransferInstructions: bankInstructionsNext,
                subscriptionPriceGtq: subscriptionPriceNext,
                subscriptionPeriodMonths: subscriptionPeriodNext,
            },
            update: {
                publicKey: publicKeyNext,
                secretKey: secretKeyNext,
                webhookSecret: webhookSecretNext,
                bankTransferInstructions: bankInstructionsNext,
                subscriptionPriceGtq: subscriptionPriceNext,
                subscriptionPeriodMonths: subscriptionPeriodNext,
            },
        });

        const keys = await getPlatformRecurrenteKeys();
        return apiOk({
            saved: true,
            keysActive: !!keys,
        });
    } catch (error: unknown) {
        console.error("[PLATFORM_RECURRENTE_CONFIG_PUT]", error);
        const msg = error instanceof Error ? error.message : "Error al guardar";
        return apiError({ code: "INTERNAL_ERROR", message: msg }, 500);
    }
}
