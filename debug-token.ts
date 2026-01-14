import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking users...');
    const users = await prisma.user.findMany({
        select: {
            email: true,
            resetPasswordToken: true,
            resetPasswordExpires: true,
        }
    });
    console.log('Users found:', users);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
