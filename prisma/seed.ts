import 'dotenv/config';
import {
    PrismaClient,
    Role,
    UserStatus,
    ComplexType,
    UnitStatus,
    ResidentType
} from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
    console.log('🌱 Starting seed...');

    const commonPassword = await hash('admin123', 12);

    // 1. Create Users
    const superAdmin = await prisma.user.upsert({
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

    const adminSunset = await prisma.user.upsert({
        where: { email: 'manager@condomanager.com' },
        update: {},
        create: {
            email: 'manager@condomanager.com',
            name: 'Admin Sunset',
            password: commonPassword,
            role: Role.ADMIN,
            status: UserStatus.ACTIVE,
        },
    });

    const adminGreenValley = await prisma.user.upsert({
        where: { email: 'admin2@condomanager.com' },
        update: {},
        create: {
            email: 'admin2@condomanager.com',
            name: 'Admin Green Valley',
            password: commonPassword,
            role: Role.ADMIN,
            status: UserStatus.ACTIVE,
        },
    });

    const boardMember = await prisma.user.upsert({
        where: { email: 'board@condomanager.com' },
        update: {},
        create: {
            email: 'board@condomanager.com',
            name: 'Miembro Junta',
            password: commonPassword,
            role: Role.BOARD_OF_DIRECTORS,
            status: UserStatus.ACTIVE,
        },
    });

    const guard = await prisma.user.upsert({
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

    const res1 = await prisma.user.upsert({
        where: { email: 'resident1@example.com' },
        update: {},
        create: {
            email: 'resident1@example.com',
            name: 'Resident One',
            password: commonPassword,
            role: Role.RESIDENT,
            status: UserStatus.ACTIVE,
        },
    });

    const res2 = await prisma.user.upsert({
        where: { email: 'resident2@example.com' },
        update: {},
        create: {
            email: 'resident2@example.com',
            name: 'Resident Two',
            password: commonPassword,
            role: Role.RESIDENT,
            status: UserStatus.ACTIVE,
        },
    });

    const res3 = await prisma.user.upsert({
        where: { email: 'resident3@example.com' },
        update: {},
        create: {
            email: 'resident3@example.com',
            name: 'Resident Three',
            password: commonPassword,
            role: Role.RESIDENT,
            status: UserStatus.ACTIVE,
        },
    });

    const res4 = await prisma.user.upsert({
        where: { email: 'resident4@example.com' },
        update: {},
        create: {
            email: 'resident4@example.com',
            name: 'Resident Four',
            password: commonPassword,
            role: Role.RESIDENT,
            status: UserStatus.ACTIVE,
        },
    });

    console.log('👤 Users created/verified.');

    // 2. Create Complex Sunset
    let sunset: any = await prisma.complex.findFirst({ where: { name: 'Sunset' } });
    if (!sunset) {
        sunset = await prisma.complex.create({
            data: {
                name: 'Sunset',
                address: '123 Sunset Blvd',
                type: ComplexType.RESIDENTIAL,
                adminId: adminSunset.id,
                units: {
                    createMany: {
                        data: [
                            { number: '101', bedrooms: 2, bathrooms: 2, status: UnitStatus.OCCUPIED },
                            { number: '102', bedrooms: 1, bathrooms: 1, status: UnitStatus.OCCUPIED },
                        ],
                    },
                },
            },
            include: { units: true }
        });
        console.log(`🏢 Complex created: ${sunset.name}`);
    } else {
        sunset = await prisma.complex.findUniqueOrThrow({
            where: { id: sunset.id },
            include: { units: true }
        });
    }

    // 3. Create Complex Green Valley
    let greenValley: any = await prisma.complex.findFirst({ where: { name: 'Green Valley' } });
    if (!greenValley) {
        greenValley = await prisma.complex.create({
            data: {
                name: 'Green Valley',
                address: '456 Green Valley Rd',
                type: ComplexType.RESIDENTIAL,
                adminId: adminGreenValley.id,
                units: {
                    createMany: {
                        data: [
                            { number: '101', bedrooms: 3, bathrooms: 2, status: UnitStatus.OCCUPIED },
                            { number: '102', bedrooms: 2, bathrooms: 1, status: UnitStatus.OCCUPIED },
                        ],
                    },
                },
            },
            include: { units: true }
        });
        console.log(`🏢 Complex created: ${greenValley.name}`);
    } else {
        greenValley = await prisma.complex.findUniqueOrThrow({
            where: { id: greenValley.id },
            include: { units: true }
        });
    }

    // 4. Assign Staff to Sunset
    await prisma.user.update({ where: { id: boardMember.id }, data: { complexId: sunset.id } as any });
    await prisma.user.update({ where: { id: guard.id }, data: { complexId: sunset.id } as any });
    console.log('👮 Staff assigned to Sunset complex.');

    // 5. Assign Residents to Sunset Units
    const sUnit101 = sunset.units.find((u: any) => u.number === '101');
    const sUnit102 = sunset.units.find((u: any) => u.number === '102');
    
    if (sUnit101 && !(await prisma.resident.findUnique({ where: { userId: res1.id } }))) {
        await prisma.resident.create({ data: { userId: res1.id, unitId: sUnit101.id, type: ResidentType.OWNER, startDate: new Date() } });
    }
    if (sUnit102 && !(await prisma.resident.findUnique({ where: { userId: res2.id } }))) {
        await prisma.resident.create({ data: { userId: res2.id, unitId: sUnit102.id, type: ResidentType.TENANT, startDate: new Date() } });
    }

    // 6. Assign Residents to Green Valley Units
    const gUnit101 = greenValley.units.find((u: any) => u.number === '101');
    const gUnit102 = greenValley.units.find((u: any) => u.number === '102');

    if (gUnit101 && !(await prisma.resident.findUnique({ where: { userId: res3.id } }))) {
        await prisma.resident.create({ data: { userId: res3.id, unitId: gUnit101.id, type: ResidentType.OWNER, startDate: new Date() } });
    }
    if (gUnit102 && !(await prisma.resident.findUnique({ where: { userId: res4.id } }))) {
        await prisma.resident.create({ data: { userId: res4.id, unitId: gUnit102.id, type: ResidentType.TENANT, startDate: new Date() } });
    }

    console.log('🏠 Residents assigned to units.');
    console.log('✅ Seed finished successfully.');
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
