import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";

export type UserScope = {
    role: Role;
    complexId: string | null;
    unitId: string | null;
};

export async function resolveUserScope(userId: string): Promise<UserScope | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            complexId: true,
            /** Complejo que administra como titular (complexes.admin_id); mismo criterio que en auth `getUser`. */
            managedComplexes: { select: { id: true } },
            residentProfile: {
                select: {
                    unitId: true,
                    unit: { select: { complexId: true } },
                },
            },
        },
    });

    if (!user) return null;

    if (user.role === Role.RESIDENT) {
        return {
            role: user.role as Role,
            complexId: user.residentProfile?.unit?.complexId ?? null,
            unitId: user.residentProfile?.unitId ?? null,
        };
    }

    const staffComplexId = user.complexId ?? user.managedComplexes?.id ?? null;

    return {
        role: user.role as Role,
        complexId: staffComplexId,
        unitId: null,
    };
}

export function isComplexStaff(role: Role): boolean {
    return role === Role.ADMIN || role === Role.BOARD_OF_DIRECTORS || role === Role.GUARD;
}
