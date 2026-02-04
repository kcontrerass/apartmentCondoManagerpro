import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import IncidentsClient from './IncidentsClient';
import { Role } from '@prisma/client';
import { MainLayout } from '@/components/layouts/MainLayout';

export default async function IncidentsPage() {
    const session = await auth();
    if (!session?.user) return null;

    let residentComplexId: string | undefined;
    let residentUnitId: string | undefined;

    if (session.user.role === 'RESIDENT') {
        const resident = await prisma.resident.findUnique({
            where: { userId: session.user.id },
            include: { unit: true }
        });
        residentComplexId = resident?.unit?.complexId;
        residentUnitId = resident?.unitId;
    }

    return (
        <MainLayout user={session.user}>
            <IncidentsClient
                userRole={session.user.role as Role}
                userComplexId={(session.user as any).complexId}
                residentComplexId={residentComplexId}
                residentUnitId={residentUnitId}
            />
        </MainLayout>
    );
}
