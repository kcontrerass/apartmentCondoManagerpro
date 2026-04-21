/**
 * Prueba POST/GET contra Recurrente con las mismas claves que la suscripción a la plataforma:
 * PlatformRecurrenteSettings (BD) → PLATFORM_* → RECURRENTE_* (.env)
 *
 * Sandbox (llaves TEST): checkouts con aviso PRUEBA, live_mode false, sin webhooks; pago simulado
 * p. ej. 4242 4242 4242 4242. En local no confíes solo en el webhook para marcar PAID.
 *
 * Uso: npx ts-node scripts/verify-platform-recurrente-keys.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resolvePlatformKeys(): Promise<{
    publicKey: string;
    secretKey: string;
    source: "database" | "env_platform" | "env_recurrente" | "missing";
}> {
    let row: { publicKey: string | null; secretKey: string | null } | null = null;
    try {
        row = await prisma.platformRecurrenteSettings.findUnique({
            where: { id: "default" },
            select: { publicKey: true, secretKey: true },
        });
    } catch {
        row = null;
    }

    const fromDbPub = row?.publicKey?.trim() || "";
    const fromDbSec = row?.secretKey?.trim() || "";
    if (fromDbPub && fromDbSec) {
        return { publicKey: fromDbPub, secretKey: fromDbSec, source: "database" };
    }

    const platPub = process.env.PLATFORM_RECURRENTE_PUBLIC_KEY?.trim() || "";
    const platSec = process.env.PLATFORM_RECURRENTE_SECRET_KEY?.trim() || "";
    if (platPub && platSec) {
        return { publicKey: platPub, secretKey: platSec, source: "env_platform" };
    }

    const envPub = process.env.RECURRENTE_PUBLIC_KEY?.trim() || "";
    const envSec = process.env.RECURRENTE_SECRET_KEY?.trim() || "";
    if (envPub && envSec) {
        return { publicKey: envPub, secretKey: envSec, source: "env_recurrente" };
    }

    return { publicKey: "", secretKey: "", source: "missing" };
}

async function main() {
    const keys = await resolvePlatformKeys();
    console.log("Origen de claves (mismo orden que getPlatformRecurrenteKeys):", keys.source);

    if (!keys.publicKey || !keys.secretKey) {
        console.error("❌ No hay par público/secreto configurado para la plataforma.");
        process.exit(1);
    }

    console.log(
        `✅ Claves cargadas (pub ${keys.publicKey.length} chars, empieza ${keys.publicKey.slice(0, 4)}…)`,
    );

    const body = JSON.stringify({
        items: [
            {
                name: "Verificación ADESSO (plataforma)",
                amount_in_cents: 600,
                currency: "GTQ",
                quantity: 1,
            },
        ],
        success_url: "http://localhost:3000/es/dashboard/payments/success",
        cancel_url: "http://localhost:3000/es/dashboard/payments/cancel",
    });

    const createRes = await fetch("https://app.recurrente.com/api/checkouts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-PUBLIC-KEY": keys.publicKey,
            "X-SECRET-KEY": keys.secretKey,
        },
        body,
    });

    const createText = await createRes.text();
    console.log("\nPOST /api/checkouts →", createRes.status);
    if (!createRes.ok) {
        console.error(createText);
        process.exit(1);
    }

    let created: { id?: string };
    try {
        created = JSON.parse(createText) as { id?: string };
    } catch {
        console.error("Respuesta no JSON:", createText.slice(0, 400));
        process.exit(1);
    }

    const id = created.id;
    if (!id) {
        console.error("Sin id en respuesta:", createText);
        process.exit(1);
    }

    console.log("Checkout creado:", id);

    const getRes = await fetch(`https://app.recurrente.com/api/checkouts/${id}`, {
        headers: {
            "X-PUBLIC-KEY": keys.publicKey,
            "X-SECRET-KEY": keys.secretKey,
        },
    });

    const getText = await getRes.text();
    console.log("GET /api/checkouts/:id →", getRes.status);
    if (!getRes.ok) {
        console.error(getText);
        process.exit(1);
    }

    console.log("Primeros caracteres del checkout:", getText.slice(0, 200) + "…");
    console.log("\n✅ Misma fuente de claves que suscripción: crear y consultar checkout OK.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
