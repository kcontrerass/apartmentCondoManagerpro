import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const result = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'railway' 
      AND TABLE_NAME = 'invoices';
    `
        console.log('Columns in invoices table:', result)
    } catch (error) {
        console.error('Error:', error)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
