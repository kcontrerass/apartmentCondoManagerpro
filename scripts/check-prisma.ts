import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- DIANOSTIC START ---");
    // @ts-ignore
    const model = (prisma as any)._runtimeDataModel.models.Service;
    console.log("Service Model Fields:", model.fields.map((f: any) => f.name));

    if (model.fields.find((f: any) => f.name === 'isRequired')) {
        console.log("SUCCESS: 'isRequired' exists in Prisma Client.");
    } else {
        console.log("FAILURE: 'isRequired' is MISSING in Prisma Client.");
    }
    console.log("--- DIANOSTIC END ---");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
