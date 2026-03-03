const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Listing all tables in the database...');
        const tables = await prisma.$queryRawUnsafe('SHOW TABLES');
        console.log('Tables found:', JSON.stringify(tables, null, 2));

        // Try to describe the polls table if possible
        try {
            const description = await prisma.$queryRawUnsafe('DESCRIBE polls');
            console.log('Polls table description:', JSON.stringify(description, null, 2));
        } catch (e) {
            console.log('Could not describe polls table:', e.message);
        }
    } catch (error) {
        console.error('Core error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
