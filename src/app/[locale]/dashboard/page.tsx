import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { DashboardClient as AdminDashboard } from "@/components/dashboard/DashboardClient";
import { ResidentDashboard } from "@/components/dashboard/ResidentDashboard";
import { OperatorDashboard } from "@/components/dashboard/OperatorDashboard";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
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

        if (!resident) return null;

        const startDate = new Date(resident.startDate);
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth() + 1;

        const [invoicesRaw, reservationsRaw, incidentsRaw] = await Promise.all([
            prisma.invoice.findMany({
                where: {
                    unitId: resident.unitId,
                    OR: [
                        { year: { gt: startYear } },
                        {
                            AND: [
                                { year: startYear },
                                { month: { gte: startMonth } }
                            ]
                        }
                    ]
                },
                orderBy: { dueDate: 'asc' },
                take: 10
            }),
            prisma.reservation.findMany({
                where: { userId },
                include: { amenity: true },
                orderBy: { startTime: 'asc' },
                take: 10
            }),
            prisma.incident.findMany({
                where: { reporterId: userId },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { complex: true }
            })
        ]);

        const recentInvoicesRaw = [...invoicesRaw].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

        const pendingInvoices = invoicesRaw
            .filter((inv: any) => inv.status === 'PENDING')
            .slice(0, 3)
            .map((inv: any) => ({
                ...inv,
                totalAmount: Number(inv.totalAmount)
            }));

        const now = new Date();
        const upcomingReservations = reservationsRaw
            .filter((res: any) => res.startTime >= now && ['APPROVED', 'PENDING'].includes(res.status))
            .slice(0, 3)
            .map((res: any) => ({
                ...res,
                totalCost: res.totalCost ? Number(res.totalCost) : null,
                amenity: res.amenity ? {
                    ...res.amenity,
                    costPerDay: res.amenity.costPerDay ? Number(res.amenity.costPerDay) : null,
                    costPerHour: res.amenity.costPerHour ? Number(res.amenity.costPerHour) : null,
                } : null
            }));

        const activities = [
            ...incidentsRaw.map((inc: any) => ({
                reference: resident.unit.number,
                type: 'Incidente',
                status: { label: inc.status, variant: inc.status === 'RESOLVED' ? 'success' : 'warning' },
                datetime: inc.createdAt,
                details: inc.title,
                href: `/dashboard/incidents/${inc.id}`
            })),
            ...recentInvoicesRaw.map((inv: any) => ({
                reference: inv.number,
                type: 'Factura',
                status: { label: inv.status, variant: inv.status === 'PAID' ? 'success' : 'warning' },
                datetime: inv.createdAt,
                details: `Monto: ${inv.totalAmount}`,
                href: `/dashboard/invoices`
            })),
            ...reservationsRaw.map((res: any) => ({
                reference: res.amenity.name,
                type: 'Reservación',
                status: { label: res.status, variant: res.status === 'APPROVED' ? 'success' : 'warning' },
                datetime: res.createdAt,
                details: res.amenity.name,
                href: `/dashboard/reservations`
            }))
        ].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()).slice(0, 5);

        return {
            residentData: {
                resident,
                pendingInvoices,
                upcomingReservations,
                recentIncidents: incidentsRaw.slice(0, 3),
                activities
            }
        };
    }

    if (role === Role.BOARD_OF_DIRECTORS || role === Role.GUARD) {
        const user = await prisma.user.findUnique({
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

        const [unitStats, totalResidents, pendingReservations, recentIncidents, recentInvoicesRaw, recentReservationsRaw] = await Promise.all([
            prisma.unit.groupBy({
                by: ['status'],
                _count: true,
                where: { complexId: user.complexId }
            }),
            prisma.resident.count({ where: { unit: { complexId: user.complexId } } }),
            prisma.reservation.count({
                where: {
                    status: 'PENDING',
                    amenity: { complexId: user.complexId }
                }
            }),
            prisma.incident.findMany({
                where: { complexId: user.complexId },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { reporter: true, unit: true }
            }),
            prisma.invoice.findMany({
                where: { complexId: user.complexId },
                take: 3,
                orderBy: { createdAt: 'desc' },
                include: { unit: { select: { number: true } } }
            }),
            prisma.reservation.findMany({
                where: { amenity: { complexId: user.complexId } },
                take: 3,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } }, amenity: { select: { name: true } } }
            })
        ]);

        const totalUnits = unitStats.reduce((acc: number, curr: any) => acc + curr._count, 0);
        const occupiedUnits = unitStats.find((s: any) => s.status === 'OCCUPIED' || s.status === 'RENTED')?._count || 0;

        const activities = [
            ...recentIncidents.map((inc: any) => ({
                reference: `Unidad ${inc.unit?.number || 'N/A'}`,
                type: 'Incidente',
                status: { label: inc.status, variant: inc.status === 'RESOLVED' ? 'success' : 'warning' },
                datetime: inc.createdAt,
                details: inc.title,
                href: `/dashboard/incidents/${inc.id}`
            })),
            ...recentInvoicesRaw.map((inv: any) => ({
                reference: `Unidad ${inv.unit?.number || 'N/A'}`,
                type: 'Factura',
                status: { label: inv.status, variant: inv.status === 'PAID' ? 'success' : 'warning' },
                datetime: inv.createdAt,
                details: `Monto: ${inv.totalAmount}`,
                href: `/dashboard/invoices`
            })),
            ...recentReservationsRaw.map((res: any) => ({
                reference: res.user.name,
                type: 'Reservación',
                status: { label: res.status, variant: res.status === 'APPROVED' ? 'success' : 'warning' },
                datetime: res.createdAt,
                details: res.amenity.name,
                href: `/dashboard/reservations`
            }))
        ].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()).slice(0, 5);

        return {
            operatorData: {
                totalUnits,
                totalResidents,
                occupiedUnits,
                pendingReservations,
                recentIncidents,
                activities
            }
        };
    }

    // ADMIN and SUPER_ADMIN stats (Existing logic)
    const stats: any = {
        totalComplexes: 0,
        totalUnits: 0,
        totalResidents: 0,
        occupancyRate: 0,
        occupiedUnits: 0,
        vacantUnits: 0,
        pendingIncidents: 0,
        recentActivities: [] as any[],
    };

    let managedComplexIds: string[] = [];
    if (role === Role.SUPER_ADMIN) {
        const complexes = await prisma.complex.findMany({ select: { id: true } });
        managedComplexIds = complexes.map(c => c.id);
        stats.totalComplexes = managedComplexIds.length;
    } else {
        const managedComplexes = await prisma.complex.findMany({
            where: { adminId: userId },
            select: { id: true },
        });
        managedComplexIds = managedComplexes.map((c) => c.id);
        stats.totalComplexes = managedComplexIds.length;
    }

    const [unitStats, residentsRaw, pendingIncidents, recentIncidentsRaw, recentInvoicesRaw, recentReservationsRaw] = await Promise.all([
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
        prisma.incident.count({
            where: {
                complexId: { in: managedComplexIds },
                status: { in: ['REPORTED', 'IN_PROGRESS'] }
            }
        }),
        prisma.incident.findMany({
            where: { complexId: { in: managedComplexIds } },
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { reporter: { select: { name: true } }, unit: { select: { number: true } } }
        }),
        prisma.invoice.findMany({
            where: { complexId: { in: managedComplexIds } },
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { unit: { select: { number: true } } }
        }),
        prisma.reservation.findMany({
            where: { amenity: { complexId: { in: managedComplexIds } } },
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { name: true } }, amenity: { select: { name: true } } }
        })
    ]);

    // Derived stats and Activity formatting
    stats.totalUnits = unitStats.reduce((acc: number, curr: any) => acc + curr._count, 0);
    stats.totalResidents = residentsRaw.reduce((acc: number, curr: any) => acc + curr._count, 0);

    stats.occupiedUnits = unitStats.find((s: any) => s.status === 'OCCUPIED' || s.status === 'RENTED')?._count || 0;
    stats.vacantUnits = unitStats.find((s: any) => s.status === 'VACANT' || s.status === 'MAINTENANCE')?._count || 0;

    if (stats.totalUnits > 0) {
        stats.occupancyRate = Math.round((stats.occupiedUnits / stats.totalUnits) * 100);
    }

    stats.pendingIncidents = pendingIncidents;
    stats.recentActivities = [
        ...recentIncidentsRaw.map((inc: any) => ({
            reference: `Unidad ${inc.unit?.number || 'N/A'}`,
            type: 'Incidente',
            status: { label: inc.status, variant: inc.status === 'RESOLVED' ? 'success' : 'warning' },
            datetime: inc.createdAt,
            details: inc.title,
            href: `/dashboard/incidents/${inc.id}`
        })),
        ...recentInvoicesRaw.map((inv: any) => ({
            reference: `Unidad ${inv.unit?.number || 'N/A'}`,
            type: 'Factura',
            status: { label: inv.status, variant: inv.status === 'PAID' ? 'success' : 'warning' },
            datetime: inv.createdAt,
            details: `Monto: ${inv.totalAmount}`,
            href: `/dashboard/invoices`
        })),
        ...recentReservationsRaw.map((res: any) => ({
            reference: res.user.name,
            type: 'Reservación',
            status: { label: res.status, variant: res.status === 'APPROVED' ? 'success' : 'warning' },
            datetime: res.createdAt,
            details: res.amenity.name,
            href: `/dashboard/reservations`
        }))
    ].sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()).slice(0, 5);

    return { adminData: stats };
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();
    if (!session?.user) return null;

    const t = await getTranslations({ locale, namespace: 'Dashboard' });
    const statsResult: any = await getStats(session.user.id as string, session.user.role as string);

    const isResident = session.user.role === Role.RESIDENT;
    const isOperator = session.user.role === Role.BOARD_OF_DIRECTORS || session.user.role === Role.GUARD;

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title={t('title')}
                    subtitle={t('overview')}
                    actions={
                        !isResident && (
                            <>
                                <Link href="/dashboard/announcements/new">
                                    <Button variant="secondary" icon="mail">Enviar Aviso</Button>
                                </Link>
                                <Link href="/dashboard/access-control">
                                    <Button variant="secondary" icon="person_add">Registrar Visitante</Button>
                                </Link>
                            </>
                        )
                    }
                />

                {isResident && statsResult?.residentData && (
                    <ResidentDashboard data={statsResult.residentData} />
                )}

                {isOperator && statsResult?.operatorData && (
                    <OperatorDashboard data={statsResult.operatorData} />
                )}

                {!isResident && !isOperator && statsResult?.adminData && (
                    <AdminDashboard stats={statsResult.adminData} />
                )}
            </div>
        </MainLayout>
    );
}
