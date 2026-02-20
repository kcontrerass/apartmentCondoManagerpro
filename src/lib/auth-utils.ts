import { auth } from '@/auth';

import { Role } from '@/types/roles';
export { Role };

export async function getCurrentUser() {
    const session = await auth();
    return session?.user;
}

export async function hasRole(role: Role | Role[]) {
    const user = await getCurrentUser();
    if (!user || !user.role) return false;

    if (Array.isArray(role)) {
        return role.includes(user.role as Role);
    }
    return user.role === role;
}

export async function can(action: string, resource: string) {
    // Simple example: mapping actions to roles
    // Ideally this would be a more robust permission mapping
    // For now, let's say:
    // - SUPER_ADMIN can do anything
    // - ADMIN can manage their complex

    const user = await getCurrentUser();
    if (!user) return false;

    if (user.role === Role.SUPER_ADMIN) return true;

    // Add more logic here as needed
    return false;
}
