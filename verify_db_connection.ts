import { prisma } from './src/lib/prisma.ts';

async function main() {
    try {
        const complexCount = await prisma.complex.count();
        console.log(`✅ Success: Connected to database. Found ${complexCount} complexes.`);
    } catch (e) {
        console.error('❌ Error: Could not connect to database.', e);
        process.exit(1);
    }
}

main();
