import { StaffClient } from "./StaffClient";
import { MainLayout } from "@/components/layouts/MainLayout"; // Verify import path
import { auth } from "@/auth"; // Verify import path

import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";

export default async function StaffPage() {
    const session = await auth();
    const userRole = session?.user?.role as Role;

    let complexes: { id: string; name: string }[] = [];

    if (userRole === Role.SUPER_ADMIN) {
        complexes = await prisma.complex.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });
    }

    return (
        <MainLayout user={session?.user}>
            <StaffClient
                initialComplexes={complexes}
                currentUserRole={userRole}
            />
        </MainLayout>
    );
}
