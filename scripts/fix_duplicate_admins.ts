import { prisma } from "../src/lib/db";

async function main() {
    console.log("Checking for duplicate admin assignments...");

    const complexes = await prisma.complex.findMany({
        where: {
            adminId: {
                not: null
            }
        },
        select: {
            id: true,
            adminId: true,
            name: true
        }
    });

    const adminMap = new Map<string, string[]>();

    for (const complex of complexes) {
        if (complex.adminId) {
            const existing = adminMap.get(complex.adminId) || [];
            existing.push(complex.id);
            adminMap.set(complex.adminId, existing);
        }
    }

    for (const [adminId, complexIds] of adminMap.entries()) {
        if (complexIds.length > 1) {
            console.log(`Found duplicate admin ${adminId} in complexes: ${complexIds.join(", ")}`);
            // Keep the first one, clear others
            const [, ...toRemove] = complexIds;

            console.log(`Removing admin ${adminId} from complexes: ${toRemove.join(", ")}`);

            await prisma.complex.updateMany({
                where: {
                    id: {
                        in: toRemove
                    }
                },
                data: {
                    adminId: null
                }
            });
        }
    }

    console.log("Duplicate admin assignments resolved.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
