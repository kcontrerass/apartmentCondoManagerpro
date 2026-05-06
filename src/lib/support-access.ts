import { Role } from '@/types/roles';

/** Quién puede ver el enlace de soporte en el pie y acceder a /support */
export function canAccessSupport(userRole: string | undefined): boolean {
    if (!userRole) return false;
    return (
        userRole === Role.SUPER_ADMIN ||
        userRole === Role.ADMIN ||
        userRole === Role.BOARD_OF_DIRECTORS
    );
}
