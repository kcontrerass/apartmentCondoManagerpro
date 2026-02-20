import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ReportsClient } from "@/components/dashboard/reports/ReportsClient";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

async function getReportsData(userId: string, role: string, selectedComplexId?: string) {
    let managedComplexIds: string[] = [];

    if (role === Role.SUPER_ADMIN) {
        if (selectedComplexId) {
            managedComplexIds = [selectedComplexId];
        } else {
            const complexes = await prisma.complex.findMany({ select: { id: true } });
            managedComplexIds = complexes.map(c => c.id);
        }
    } else {
        const managedComplexes = await prisma.complex.findMany({
            where: { adminId: userId },
            select: { id: true },
        });
        const allManagedIds = managedComplexes.map((c) => c.id);

        if (selectedComplexId && allManagedIds.includes(selectedComplexId)) {
            managedComplexIds = [selectedComplexId];
        } else {
            managedComplexIds = allManagedIds;
        }
    }

    if (managedComplexIds.length === 0) {
        return null;
    }

    // 1. Revenue Data (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const invoices = await prisma.invoice.findMany({
        where: {
            complexId: { in: managedComplexIds },
            createdAt: { gte: sixMonthsAgo },
            status: 'PAID'
        },
        select: {
            totalAmount: true,
            createdAt: true
        }
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth: Record<string, number> = {};

    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = months[d.getMonth()];
        revenueByMonth[monthName] = 0;
    }

    invoices.forEach(inv => {
        const monthName = months[new Date(inv.createdAt).getMonth()];
        if (revenueByMonth[monthName] !== undefined) {
            revenueByMonth[monthName] += Number(inv.totalAmount);
        }
    });

    const revenueData = Object.entries(revenueByMonth)
        .map(([month, total]) => ({ month, total }))
        .reverse();

    // 2. Incidents Data
    const incidents = await prisma.incident.groupBy({
        by: ['status'],
        where: { complexId: { in: managedComplexIds } },
        _count: true
    });

    const statusMap: Record<string, { labelKey: string, color: string }> = {
        'REPORTED': { labelKey: 'REPORTED', color: '#f59e0b' },
        'IN_PROGRESS': { labelKey: 'IN_PROGRESS', color: '#3b82f6' },
        'RESOLVED': { labelKey: 'RESOLVED', color: '#10b981' },
        'CANCELLED': { labelKey: 'CANCELLED', color: '#94a3b8' }
    };

    const incidentsData = incidents.map(inc => ({
        statusKey: statusMap[inc.status]?.labelKey || inc.status,
        count: inc._count,
        color: statusMap[inc.status]?.color || '#cbd5e1'
    }));

    // 3. Reservations by Amenity
    const reservationsByAmenityRaw = await prisma.reservation.groupBy({
        by: ['amenityId'],
        where: {
            amenity: { complexId: { in: managedComplexIds } },
            status: 'APPROVED'
        },
        _count: true
    });

    const amenities = await prisma.amenity.findMany({
        where: { id: { in: reservationsByAmenityRaw.map(r => r.amenityId) } },
        select: { id: true, name: true }
    });

    const reservationsByAmenity = reservationsByAmenityRaw.map(r => ({
        name: amenities.find(a => a.id === r.amenityId)?.name || 'Unknown',
        count: r._count
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // 4. Visitor Trends (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const visitorsRaw = await prisma.visitorLog.groupBy({
        by: ['scheduledDate'],
        where: {
            complexId: { in: managedComplexIds },
            scheduledDate: { gte: sevenDaysAgo }
        },
        _count: true
    });

    const visitorTrends = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const count = visitorsRaw.find(v => v.scheduledDate.toISOString().split('T')[0] === dateStr)?._count || 0;
        return {
            date: dateStr,
            count
        };
    });

    // 5. Stats Summary
    const totalRevenue = revenueData.reduce((acc, curr) => acc + curr.total, 0);
    const totalIncidents = incidents.reduce((acc, curr) => acc + curr._count, 0);
    const resolvedIncidents = incidents.find(i => i.status === 'RESOLVED')?._count || 0;
    const resolvedRate = totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0;

    const [totalUnitsCount, occupiedUnitsCount] = await Promise.all([
        prisma.unit.count({ where: { complexId: { in: managedComplexIds } } }),
        prisma.unit.count({ where: { complexId: { in: managedComplexIds }, status: 'OCCUPIED' } })
    ]);
    const occupancyRate = totalUnitsCount > 0 ? Math.round((occupiedUnitsCount / totalUnitsCount) * 100) : 0;

    return {
        revenueData,
        incidentsData,
        reservationsByAmenity,
        visitorTrends,
        stats: {
            totalRevenue,
            totalIncidents,
            resolvedRate,
            occupancyRate
        }
    };
}

export default async function ReportsPage({
    params,
    searchParams
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ complexId?: string }>;
}) {
    const session = await auth();
    if (!session?.user) redirect('/auth/login');

    if (session.user.role === Role.RESIDENT || session.user.role === Role.GUARD) {
        redirect('/dashboard');
    }

    const { locale } = await params;
    const { complexId } = await searchParams;
    const tReports = await getTranslations({ locale, namespace: 'Reports' });

    // Fetch complexes for selector
    let complexes: { id: string, name: string }[] = [];
    if (session.user.role === Role.SUPER_ADMIN) {
        complexes = await prisma.complex.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });
    } else {
        complexes = await prisma.complex.findMany({
            where: { adminId: session.user.id },
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        });
    }

    const data = await getReportsData(session.user.id, session.user.role, complexId);

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader
                        title={tReports('title')}
                        subtitle={tReports('subtitle')}
                    />
                </div>

                {!data ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-slate-500">{tReports('noData')}</p>
                    </div>
                ) : (
                    <ReportsClient
                        data={data}
                        complexes={complexes}
                        selectedComplexId={complexId}
                        userRole={session.user.role}
                    />
                )}
            </div>
        </MainLayout>
    );
}
