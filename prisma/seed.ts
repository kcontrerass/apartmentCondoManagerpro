import 'dotenv/config';
import { PrismaClient, Role, UserStatus, ComplexType, UnitStatus, AmenityType, ResidentType } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create Super Admin
    const commonPassword = await hash('admin123', 12);

    await prisma.user.upsert({
        where: { email: 'admin@condomanager.com' },
        update: {},
        create: {
            email: 'admin@condomanager.com',
            name: 'Super Admin',
            password: commonPassword,
            role: Role.SUPER_ADMIN,
            status: UserStatus.ACTIVE,
        },
    });

    // 2. Create Admin Test
    await prisma.user.upsert({
        where: { email: 'manager@condomanager.com' },
        update: {},
        create: {
            email: 'manager@condomanager.com',
            name: 'Complex Manager',
            password: commonPassword,
            role: Role.ADMIN,
            status: UserStatus.ACTIVE,
        },
    });

    // 3. Create Operator Test
    await prisma.user.upsert({
        where: { email: 'operator@condomanager.com' },
        update: {},
        create: {
            email: 'operator@condomanager.com',
            name: 'Staff Operator',
            password: commonPassword,
            role: Role.OPERATOR,
            status: UserStatus.ACTIVE,
        },
    });

    // 4. Create Guard Test
    await prisma.user.upsert({
        where: { email: 'guard@condomanager.com' },
        update: {},
        create: {
            email: 'guard@condomanager.com',
            name: 'Security Guard',
            password: commonPassword,
            role: Role.GUARD,
            status: UserStatus.ACTIVE,
        },
    });

    console.log('👤 Test users created (password: admin123)');

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

    // 5. Create Resident User and Profile
    const resident = await prisma.user.upsert({
        where: { email: 'resident@example.com' },
        update: {},
        create: {
            email: 'resident@example.com',
            name: 'Juan Pérez',
            password: commonPassword,
            role: Role.RESIDENT,
            status: UserStatus.ACTIVE,
        },
    });

    const unit101 = await prisma.unit.findFirst({
        where: { number: '101', complexId: complex.id }
    });

    if (unit101) {
        await prisma.resident.create({
            data: {
                userId: resident.id,
                unitId: unit101.id,
                type: ResidentType.OWNER,
                startDate: new Date(),
            }
        });
    }

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
