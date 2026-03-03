const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

function log(msg) {
    fs.appendFileSync('test-results.txt', msg + '\n');
}

async function main() {
    fs.writeFileSync('test-results.txt', '--- Test Start ---\n');
    log('Testing Amenity model fields...');
    try {
        const amenity = await prisma.amenity.findFirst();
        log('Successfully connected to DB');
        log('Amenity sample: ' + JSON.stringify(amenity, null, 2));

        if (amenity) {
            log('Testing update with securityDeposit...');
            try {
                // We use a dummy update to see if the property is accepted
                // Note: Prisma 5+ validates keys even if we use any casting in TS, 
                // but in JS we are just passing an object.
                const updated = await prisma.amenity.update({
                    where: { id: amenity.id },
                    data: { name: amenity.name + ' (test)' }
                });
                log('Basic update success!');

                log('Trying to update securityDeposit explicitly...');
                try {
                    const updated2 = await prisma.amenity.update({
                        where: { id: amenity.id },
                        data: { securityDeposit: 100 }
                    });
                    log('Update with securityDeposit success!');
                } catch (e2) {
                    log('Update with securityDeposit failed: ' + e2.message);
                }
            } catch (e) {
                log('Update failed: ' + e.message);
            }
        }
    } catch (e) {
        log('Error in test: ' + e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
