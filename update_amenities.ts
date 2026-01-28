import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Update Pool to have cost per hour
    await prisma.amenity.updateMany({
        where: { type: 'POOL' },
        data: {
            costPerHour: 50.00,
            requiresPayment: true
        }
    });

    // Update Gym to have cost per day
    await prisma.amenity.updateMany({
        where: { type: 'GYM' },
        data: {
            costPerDay: 25.00,
            requiresPayment: true
        }
    });

    console.log('✅ Amenidades actualizadas con costos');

    const amenities = await prisma.amenity.findMany();
    console.log('Amenidades:', amenities);
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
