import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { DashboardClient as AdminDashboard } from "@/components/dashboard/DashboardClient";
import { ResidentDashboard } from "@/components/dashboard/ResidentDashboard";
import { OperatorDashboard } from "@/components/dashboard/OperatorDashboard";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getTranslations } from 'next-intl/server';
import Link from "next/link";

async function getStats(userId: string, role: string) {
    if (role === Role.RESIDENT) {
        const resident = await prisma.resident.findUnique({
            where: { userId },
            include: {
                unit: {
                    include: {
                        complex: true
                    }
                }
            }
        });

        if (!resident) return { residentData: null };

        const [pendingInvoicesRaw, upcomingReservationsRaw] = await Promise.all([
            (prisma as any).invoice.findMany({
                where: {
                    unitId: resident.unitId,
                    status: 'PENDING'
                },
                take: 3,
                orderBy: { createdAt: 'desc' }
            }),
            (prisma as any).reservation.findMany({
                where: {
                    userId: userId,
                    startTime: { gte: new Date() },
                    status: { in: ['APPROVED', 'PENDING'] }
                },
                include: { amenity: true },
                take: 3,
                orderBy: { startTime: 'asc' }
            })
        ]);

        const pendingInvoices = pendingInvoicesRaw.map((inv: any) => ({
            ...inv,
            totalAmount: Number(inv.totalAmount)
        }));

        const upcomingReservations = upcomingReservationsRaw.map((res: any) => ({
            ...res,
            totalCost: res.totalCost ? Number(res.totalCost) : null,
            amenity: res.amenity ? {
                ...res.amenity,
                costPerDay: res.amenity.costPerDay ? Number(res.amenity.costPerDay) : null,
                costPerHour: res.amenity.costPerHour ? Number(res.amenity.costPerHour) : null,
            } : null
        }));

        return {
            residentData: {
                resident,
                pendingInvoices,
                upcomingReservations
            }
        };
    }

    if (role === Role.OPERATOR || role === Role.GUARD) {
        const user = await (prisma as any).user.findUnique({
            where: { id: userId },
            select: { complexId: true }
        });

        if (!user?.complexId) {
            return {
                operatorData: {
                    totalUnits: 0,
                    totalResidents: 0,
                    occupiedUnits: 0,
                    pendingReservations: 0
                }
            };
        }

        const [totalUnits, totalResidents, occupiedUnits, pendingReservations] = await Promise.all([
            prisma.unit.count({ where: { complexId: user.complexId } }),
            prisma.resident.count({ where: { unit: { complexId: user.complexId } } }),
            prisma.unit.count({ where: { complexId: user.complexId, status: 'OCCUPIED' } }),
            (prisma as any).reservation.count({
                where: {
                    status: 'PENDING',
                    amenity: { complexId: user.complexId }
                }
            })
        ]);

        return {
            operatorData: {
                totalUnits,
                totalResidents,
                occupiedUnits,
                pendingReservations
            }
        };
    }

    // ADMIN and SUPER_ADMIN stats (Existing logic)
    const stats: any = {
        totalComplexes: 0,
        totalUnits: 0,
        totalResidents: 0,
        occupancyRate: 0,
        occupiedByOwner: 0,
        occupiedByTenant: 0,
        vacantUnits: 0,
    };

    let managedComplexIds: string[] = [];
    if (role === Role.SUPER_ADMIN) {
        const [totalComplexes, totalUnits, totalResidents, complexes] = await Promise.all([
            prisma.complex.count(),
            prisma.unit.count(),
            prisma.resident.count(),
            prisma.complex.findMany({ select: { id: true } })
        ]);
        stats.totalComplexes = totalComplexes;
        stats.totalUnits = totalUnits;
        stats.totalResidents = totalResidents;
        managedComplexIds = complexes.map(c => c.id);
    } else {
        const managedComplexes = await prisma.complex.findMany({
            where: { adminId: userId },
            select: { id: true },
        });
        managedComplexIds = managedComplexes.map((c) => c.id);
        stats.totalComplexes = managedComplexIds.length;

        const [totalUnits, totalResidents] = await Promise.all([
            prisma.unit.count({
                where: { complexId: { in: managedComplexIds } },
            }),
            prisma.resident.count({
                where: { unit: { complexId: { in: managedComplexIds } } },
            })
        ]);
        stats.totalUnits = totalUnits;
        stats.totalResidents = totalResidents;
    }

    const [unitStats, residentsRaw, totalUnitsWithOccupiedStatus] = await Promise.all([
        prisma.unit.groupBy({
            by: ['status'],
            _count: true,
            where: { complexId: { in: managedComplexIds } }
        }),
        prisma.resident.groupBy({
            by: ['type'],
            _count: true,
            where: { unit: { complexId: { in: managedComplexIds } } }
        }),
        prisma.unit.count({
            where: {
                status: 'OCCUPIED',
                complexId: { in: managedComplexIds }
            }
        })
    ]);

    unitStats.forEach(stat => {
        if (stat.status === 'VACANT' || stat.status === 'MAINTENANCE') {
            stats.vacantUnits += stat._count;
        }
    });

    residentsRaw.forEach(res => {
        if (res.type === 'OWNER') stats.occupiedByOwner = res._count;
        if (res.type === 'TENANT') stats.occupiedByTenant = res._count;
    });

    if (stats.totalUnits > 0) {
        stats.occupancyRate = (totalUnitsWithOccupiedStatus / stats.totalUnits) * 100;
    }

    return { adminData: stats };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();
    if (!session?.user) return null;

    const t = await getTranslations({ locale, namespace: 'Dashboard' });
    const statsResult: any = await getStats(session.user.id as string, session.user.role as string);

    const isResident = session.user.role === Role.RESIDENT;
    const isOperator = session.user.role === Role.OPERATOR || session.user.role === Role.GUARD;

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title={t('title')}
                    subtitle={t('overview')}
                    actions={
                        !isResident && (
                            <>
                                <Button variant="secondary" icon="mail">Enviar Aviso</Button>
                                <Link href="/dashboard/access-control">
                                    <Button variant="secondary" icon="person_add">Registrar Visitante</Button>
                                </Link>
                            </>
                        )
                    }
                />

                {isResident && statsResult.residentData && (
                    <ResidentDashboard data={statsResult.residentData} />
                )}

                {isOperator && statsResult.operatorData && (
                    <OperatorDashboard data={statsResult.operatorData} />
                )}

                {!isResident && !isOperator && statsResult.adminData && (
                    <AdminDashboard stats={statsResult.adminData} />
                )}
            </div>
        </MainLayout>
    );
}
