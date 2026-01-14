import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['query'] });

async function main() {
    try {
        await prisma.$connect();
        console.log('Successfully connected to Prisma!');
        await prisma.$disconnect();
    } catch (error) {
        console.error('Failed to connect:', error);
        process.exit(1);
    }
}

main();
