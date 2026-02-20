import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Simulating Staff API query...");
    try {
        const staff = await prisma.user.findMany({
            where: {
                role: {
                    in: ['GUARD', 'BOARD_OF_DIRECTORS', 'ADMIN']
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                complexId: true,
                assignedComplex: {
                    select: { name: true }
                },
                managedComplexes: {
                    select: { name: true }
                },
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`Found ${staff.length} staff members.`);
        const mapped = staff.map(u => ({
            email: u.email,
            assigned: u.assignedComplex?.name,
            managed: (u as any).managedComplexes?.name
        }));
        console.log(JSON.stringify(mapped, null, 2));

    } catch (error) {
        console.error("SIMULATION ERROR:", error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
