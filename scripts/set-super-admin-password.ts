import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const password = process.argv[2] || process.env.NEW_PASSWORD;
    const email = process.argv[3] || process.env.TARGET_EMAIL || "admin@condomanager.com";

    if (!password || password.length < 6) {
        console.error("Uso: npx ts-node scripts/set-super-admin-password.ts <nueva_contraseña> [email]");
        console.error("O bien: NEW_PASSWORD=... [TARGET_EMAIL=...] npx ts-node scripts/set-super-admin-password.ts");
        process.exit(1);
    }

    const hashed = await hash(password, 12);

    const byEmail = await prisma.user.updateMany({
        where: { email, role: "SUPER_ADMIN" },
        data: { password: hashed },
    });

    if (byEmail.count > 0) {
        console.log(`OK: contraseña actualizada para SUPER_ADMIN (${email}).`);
        return;
    }

    const fallback = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
        select: { id: true, email: true },
    });

    if (!fallback) {
        console.error("No se encontró ningún usuario con rol SUPER_ADMIN.");
        process.exit(1);
    }

    await prisma.user.update({
        where: { id: fallback.id },
        data: { password: hashed },
    });
    console.log(`OK: contraseña actualizada para SUPER_ADMIN (${fallback.email}).`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
