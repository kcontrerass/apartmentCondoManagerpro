import 'dotenv/config';
import {
    PrismaClient,
    Role,
    UserStatus,
    ComplexType,
    UnitStatus,
    AmenityType,
    ResidentType,
    ReservationStatus,
    InvoiceStatus
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

    const admin = await prisma.user.upsert({
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

    const boardMember = await prisma.user.upsert({
        where: { email: 'board@condomanager.com' },
        update: {},
        create: {
            email: 'board@condomanager.com',
            name: 'Junta Directiva Test',
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

    const residentUser = await prisma.user.upsert({
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

    console.log('👤 Users created/verified.');

    // 2. Create Complex linked to Admin
    // First check if complex exists to avoid unique constraint on adminId if run multiple times
    let complex: any = await prisma.complex.findFirst({ where: { name: 'Sunset Towers' } });

    if (!complex) {
        complex = await prisma.complex.create({
            data: {
                name: 'Sunset Towers',
                address: '123 Ocean Drive, Miami, FL',
                type: ComplexType.BUILDING,
                adminId: admin.id,
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
                        { name: 'Main Pool', type: 'POOL', description: 'Large outdoor pool', capacity: 20 },
                        { name: 'Fitness Center', type: 'GYM', description: '24/7 Gym access', capacity: 10 },
                    ],
                },
                services: {
                    create: [
                        { name: 'Maintenance Fee', description: 'Monthly maintenance', basePrice: 150.00, frequency: 'MONTHLY' },
                        { name: 'Water', description: 'Base water consumption', basePrice: 30.00, frequency: 'MONTHLY' }
                    ]
                }
            },
            include: {
                units: true,
                amenities: true,
                services: true
            }
        });
        console.log(`🏢 Complex created: ${complex.name}`);
    } else {
        // Ensure admin is linked (if seed ran before without linking)
        if (complex.adminId !== admin.id) {
            await prisma.complex.update({
                where: { id: complex.id },
                data: { adminId: admin.id }
            });
        }
        console.log(`🏢 Complex exists: ${complex.name}`);
        // Refresh complex with relations
        complex = await prisma.complex.findUniqueOrThrow({
            where: { id: complex.id },
            include: { units: true, amenities: true, services: true }
        });
    }

    // 4. Assign Staff to Complex
    await prisma.user.update({ where: { id: boardMember.id }, data: { complexId: complex.id } as any });
    await prisma.user.update({ where: { id: guard.id }, data: { complexId: complex.id } as any });
    console.log('👮 Staff assigned to complex.');

    // 5. Assign Resident to Unit 101
    const unit101 = complex.units.find((u: any) => u.number === '101');
    if (unit101) {
        const existingResident = await prisma.resident.findUnique({
            where: { userId: residentUser.id }
        });

        if (!existingResident) {
            await prisma.resident.create({
                data: {
                    userId: residentUser.id,
                    unitId: unit101.id,
                    type: ResidentType.OWNER,
                    startDate: new Date(),
                }
            });
            console.log('🏠 Resident assigned to Unit 101.');
        }
    }

    // 6. Create Test Reservation
    const pool = complex.amenities.find((a: any) => a.type === 'POOL');
    if (pool && unit101) {
        const existingRes = await prisma.reservation.findFirst({ where: { userId: residentUser.id } });
        if (!existingRes) {
            await prisma.reservation.create({
                data: {
                    amenityId: pool.id,
                    userId: residentUser.id,
                    startTime: new Date(Date.now() + 86400000), // Tomorrow
                    endTime: new Date(Date.now() + 86400000 + 7200000), // +2 hours
                    status: ReservationStatus.APPROVED,
                    notes: 'Pool party test'
                }
            });
            console.log('📅 Test reservation created.');
        }
    }

    // 6. Create Test Invoice
    if (unit101) {
        const existingInv = await prisma.invoice.findFirst({ where: { unitId: unit101.id } });
        if (!existingInv) {
            await prisma.invoice.create({
                data: {
                    number: 'INV-TEST-001',
                    unitId: unit101.id,
                    complexId: complex.id,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                    totalAmount: 180.00,
                    status: InvoiceStatus.PENDING,
                    dueDate: new Date(Date.now() + 604800000), // +7 days
                    items: {
                        create: [
                            { description: 'Maintenance Fee', amount: 150.00 },
                            { description: 'Water Bill', amount: 30.00 }
                        ]
                    }
                }
            });
            console.log('🧾 Test invoice created.');
        }
    }

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
