// Temporary script to test updating complex type to SHOPPING_CENTER
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    const id = "cmm9y7gbm00189gyp43cm296z"; // example complex id from logs
    try {
        const updated = await prisma.complex.update({
            where: { id },
            data: { type: "SHOPPING_CENTER" as any },
        });
        console.log("Updated complex:", updated);
    } catch (e) {
        console.error("Error updating complex:", e);
    }
}
main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
