import { PrismaClient, InvoiceCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const name = "Torre Sol";
    const c = await prisma.complex.findFirst({ where: { name } });
    if (!c) {
        console.error(`No se encontró complejo con nombre exacto "${name}"`);
        process.exit(1);
    }
    const payBefore = await prisma.platformFeePayment.count({ where: { complexId: c.id } });
    const invBefore = await prisma.invoice.count({
        where: { complexId: c.id, category: InvoiceCategory.PLATFORM_SUBSCRIPTION },
    });

    await prisma.$transaction(async (tx) => {
        await tx.platformFeePayment.deleteMany({ where: { complexId: c.id } });
        await tx.invoice.deleteMany({
            where: { complexId: c.id, category: InvoiceCategory.PLATFORM_SUBSCRIPTION },
        });
        await tx.complex.update({
            where: { id: c.id },
            data: { platformPaidUntil: null },
        });
    });

    console.log(
        JSON.stringify(
            {
                complexId: c.id,
                complexName: c.name,
                platformFeePaymentsRemoved: payBefore,
                platformInvoicesRemoved: invBefore,
                platformPaidUntil: null,
            },
            null,
            2
        )
    );
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
