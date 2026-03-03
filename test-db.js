const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing connection to polls table...');
        const result = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM polls');
        console.log('Success! Count result:', result);
    } catch (error) {
        console.error('Error querying polls table:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
