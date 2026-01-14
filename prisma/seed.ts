import 'dotenv/config';
import { PrismaClient, Role, UserStatus, ComplexType, UnitStatus } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create Super Admin
    const adminPassword = await hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@condomanager.com' },
        update: {},
        create: {
            email: 'admin@condomanager.com',
            name: 'Super Admin',
            password: adminPassword,
            role: Role.SUPER_ADMIN,
            status: UserStatus.ACTIVE,
        },
    });
    console.log(`👤 Super Admin created: ${admin.email}`);

    // 2. Create Example Complex
    const complex = await prisma.complex.create({
        data: {
            name: 'Sunset Towers',
            address: '123 Ocean Drive, Miami, FL',
            type: ComplexType.BUILDING,
            units: {
                createMany: {
                    data: [
                        { number: '101', bedrooms: 2, bathrooms: 2, status: UnitStatus.OCCUPIED },
                        { number: '102', bedrooms: 1, bathrooms: 1, status: UnitStatus.VACANT },
                        { number: '201', bedrooms: 3, bathrooms: 2.5, status: UnitStatus.OCCUPIED },
                    ],
                },
            },
            amenities: {
                create: [
                    { name: 'Main Pool', type: 'POOL', description: 'Large outdoor pool' },
                    { name: 'Fitness Center', type: 'GYM', description: '24/7 Gym access' },
                ],
            },
        },
    });
    console.log(`🏢 Complex created: ${complex.name} with units and amenities`);

    console.log('✅ Seed finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
