import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

async function getStats(userId: string, role: string) {
    const stats = {
        totalComplexes: 0,
        totalUnits: 0,
        totalResidents: 0,
        occupancyRate: 0,
        occupiedByOwner: 0,
        occupiedByTenant: 0,
        vacantUnits: 0,
    };

    if (role === Role.SUPER_ADMIN) {
        stats.totalComplexes = await prisma.complex.count();
        stats.totalUnits = await prisma.unit.count();
        stats.totalResidents = await prisma.resident.count();
    } else {
        const managedComplexes = await prisma.complex.findMany({
            where: { adminId: userId },
            select: { id: true },
        });
        const complexIds = managedComplexes.map((c) => c.id);

        stats.totalComplexes = complexIds.length;
        stats.totalUnits = await prisma.unit.count({
            where: { complexId: { in: complexIds } },
        });
        stats.totalResidents = await prisma.resident.count({
            where: { unit: { complexId: { in: complexIds } } },
        });
    }

    // Calculate detailed occupancy (mirroring API logic)
    const unitStats = await prisma.unit.groupBy({
        by: ['status'],
        _count: true,
        where: {
            ...(role !== Role.SUPER_ADMIN ? {
                complexId: {
                    in: (await prisma.complex.findMany({
                        where: { adminId: userId },
                        select: { id: true }
                    })).map(c => c.id)
                }
            } : {}),
        }
    });

    unitStats.forEach(stat => {
        if (stat.status === 'VACANT' || stat.status === 'MAINTENANCE') {
            stats.vacantUnits += stat._count;
        }
    });

    const residents = await prisma.resident.groupBy({
        by: ['type'],
        _count: true,
        where: {
            unit: {
                ...(role !== Role.SUPER_ADMIN ? {
                    complexId: {
                        in: (await prisma.complex.findMany({
                            where: { adminId: userId },
                            select: { id: true }
                        })).map(c => c.id)
                    }
                } : {}),
            }
        }
    });

    residents.forEach(res => {
        if (res.type === 'OWNER') stats.occupiedByOwner = res._count;
        if (res.type === 'TENANT') stats.occupiedByTenant = res._count;
    });

    const totalUnitsWithOccupiedStatus = await prisma.unit.count({
        where: {
            status: 'OCCUPIED',
            ...(role !== Role.SUPER_ADMIN ? {
                complexId: {
                    in: (await prisma.complex.findMany({
                        where: { adminId: userId },
                        select: { id: true }
                    })).map(c => c.id)
                }
            } : {}),
        }
    });

    // Seed fallback: if units are occupied but no residents exist
    const totalOccupied = stats.occupiedByOwner + stats.occupiedByTenant;
    if (totalOccupied < totalUnitsWithOccupiedStatus) {
        stats.occupiedByTenant += (totalUnitsWithOccupiedStatus - totalOccupied);
    }

    if (stats.totalUnits > 0) {
        stats.occupancyRate = (totalUnitsWithOccupiedStatus / stats.totalUnits) * 100;
    }

    return stats;
}

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user) return null;

    const stats = await getStats(session.user.id as string, session.user.role as string);

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title="Resumen del Dashboard"
                    subtitle="Bienvenido, esto es lo que está sucediendo en tus complejos."
                    actions={
                        <>
                            <Button variant="secondary" icon="mail">Enviar Aviso</Button>
                            <Button variant="secondary" icon="person_add">Registrar Visitante</Button>
                        </>
                    }
                />

                <DashboardClient stats={stats} />
            </div>
        </MainLayout>
    );
}
