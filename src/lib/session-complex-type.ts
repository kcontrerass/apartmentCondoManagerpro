import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";

/** Tipo de complejo asociado al usuario staff (admin / junta / guardia); null si no hay alcance o SUPER_ADMIN. */
export async function getStaffUserComplexType(userId: string, role: Role): Promise<string | null> {
    if (role === Role.SUPER_ADMIN) return null;

    if (role === Role.ADMIN) {
        const c = await prisma.complex.findFirst({
            where: { adminId: userId },
            select: { type: true },
        });
        return c?.type ?? null;
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { complexId: true },
    });
    if (!user?.complexId) return null;

    const c = await prisma.complex.findUnique({
        where: { id: user.complexId },
        select: { type: true },
    });
    return c?.type ?? null;
}
