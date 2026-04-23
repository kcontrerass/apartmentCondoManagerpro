/**
 * Borra un registro de `platform_fee_payments` (pago del administrador del complejo → operador / plataforma),
 * anula la factura vinculada si existe y recalcula `complexes.platform_paid_until` con los pagos PAID restantes.
 *
 * Uso (con .env o DATABASE_URL en el entorno):
 *   npx ts-node scripts/delete-platform-subscription-payment.ts --invoice=SEED-INV-PLAT
 *   npx ts-node scripts/delete-platform-subscription-payment.ts --id=cuid_del_pago
 *
 * Para listar los últimos pagos de un complejo (opcional):
 *   npx ts-node scripts/delete-platform-subscription-payment.ts --list-complex=Sunset
 */

import "dotenv/config";
import { PrismaClient, PlatformFeeStatus, InvoiceStatus } from "@prisma/client";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
    const p = process.argv.find((a) => a.startsWith(`--${name}=`));
    return p?.split("=")[1]?.trim();
}

function recomputePlatformPaidUntil(
    paid: { paidAt: Date | null; createdAt: Date; periodMonths: number }[]
): Date | null {
    if (paid.length === 0) return null;
    const ordered = [...paid].sort(
        (a, b) => (a.paidAt ?? a.createdAt).getTime() - (b.paidAt ?? b.createdAt).getTime()
    );
    let end: Date | null = null;
    for (const p of ordered) {
        const anchor: Date = p.paidAt ?? p.createdAt;
        const base: Date = end !== null && end.getTime() > anchor.getTime() ? end : anchor;
        const next: Date = new Date(base);
        next.setMonth(next.getMonth() + Math.max(1, p.periodMonths));
        end = next;
    }
    return end;
}

async function listRecentByComplexName(needle: string) {
    const complexes = await prisma.complex.findMany({
        where: { name: { contains: needle } },
        select: { id: true, name: true },
    });
    for (const c of complexes) {
        const rows = await prisma.platformFeePayment.findMany({
            where: { complexId: c.id },
            orderBy: { createdAt: "desc" },
            take: 20,
            select: {
                id: true,
                status: true,
                amountCents: true,
                createdAt: true,
                paidAt: true,
                invoiceId: true,
                invoice: { select: { number: true } },
            },
        });
        console.log(`\n--- ${c.name} (${c.id}) ---`);
        for (const r of rows) {
            console.log(
                `  id=${r.id}  status=${r.status}  invoice=${r.invoice?.number ?? "—"}  creado=${r.createdAt.toISOString()}`
            );
        }
    }
}

async function main() {
    const listComplex = arg("list-complex");
    if (listComplex) {
        await listRecentByComplexName(listComplex);
        return;
    }

    const id = arg("id");
    const invoiceNumber = arg("invoice");

    if (!id && !invoiceNumber) {
        console.error("Indica --id=<platform_fee_payment_id> o --invoice=<número de factura>, o --list-complex=<texto>");
        process.exit(1);
    }

    const payment = id
        ? await prisma.platformFeePayment.findUnique({ where: { id } })
        : await prisma.platformFeePayment.findFirst({
              where: { invoice: { number: invoiceNumber! } },
          });

    if (!payment) {
        console.error("No se encontró el pago.");
        process.exit(1);
    }

    console.log("Eliminando pago:", payment.id, "complexId:", payment.complexId, "status:", payment.status);

    await prisma.$transaction(async (tx) => {
        if (payment.invoiceId) {
            await tx.invoice.update({
                where: { id: payment.invoiceId },
                data: { status: InvoiceStatus.CANCELLED },
            });
            console.log("Factura anulada:", payment.invoiceId);
        }
        await tx.platformFeePayment.delete({ where: { id: payment.id } });
        const remaining = await tx.platformFeePayment.findMany({
            where: { complexId: payment.complexId, status: PlatformFeeStatus.PAID },
            select: { paidAt: true, createdAt: true, periodMonths: true },
        });
        const until = recomputePlatformPaidUntil(remaining);
        await tx.complex.update({
            where: { id: payment.complexId },
            data: { platformPaidUntil: until },
        });
        console.log("platform_paid_until recalculado:", until?.toISOString() ?? "null (sin pagos PAID restantes)");
    });

    console.log("Listo.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
