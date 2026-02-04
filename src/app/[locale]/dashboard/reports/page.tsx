import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ReportsClient } from "@/components/dashboard/reports/ReportsClient";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

async function getReportsData(userId: string, role: string) {
    let managedComplexIds: string[] = [];

    if (role === Role.SUPER_ADMIN) {
        const complexes = await prisma.complex.findMany({ select: { id: true } });
        managedComplexIds = complexes.map(c => c.id);
    } else {
        const managedComplexes = await prisma.complex.findMany({
            where: { adminId: userId },
            select: { id: true },
        });
        managedComplexIds = managedComplexes.map((c) => c.id);
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

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
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

    const statusMap: Record<string, { label: string, color: string }> = {
        'REPORTED': { label: 'Reportados', color: '#f59e0b' },
        'IN_PROGRESS': { label: 'En Proceso', color: '#3b82f6' },
        'RESOLVED': { label: 'Resueltos', color: '#10b981' },
        'CANCELLED': { label: 'Cancelados', color: '#94a3b8' }
    };

    const incidentsData = incidents.map(inc => ({
        status: statusMap[inc.status]?.label || inc.status,
        count: inc._count,
        color: statusMap[inc.status]?.color || '#cbd5e1'
    }));

    // 3. Stats Summary
    const totalRevenue = revenueData.reduce((acc, curr) => acc + curr.total, 0);
    const totalIncidents = incidents.reduce((acc, curr) => acc + curr._count, 0);
    const resolvedIncidents = incidents.find(i => i.status === 'RESOLVED')?._count || 0;
    const resolvedRate = totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0;

    const [totalUnits, occupiedUnits] = await Promise.all([
        prisma.unit.count({ where: { complexId: { in: managedComplexIds } } }),
        prisma.unit.count({ where: { complexId: { in: managedComplexIds }, status: 'OCCUPIED' } })
    ]);
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    return {
        revenueData,
        incidentsData,
        stats: {
            totalRevenue,
            totalIncidents,
            resolvedRate,
            occupancyRate
        }
    };
}

export default async function ReportsPage({ params }: { params: Promise<{ locale: string }> }) {
    const session = await auth();
    if (!session?.user) redirect('/auth/login');

    if (session.user.role === Role.RESIDENT || session.user.role === Role.GUARD) {
        redirect('/dashboard');
    }

    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Dashboard' });
    const data = await getReportsData(session.user.id, session.user.role);

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title="Reportes y Gráficas"
                    subtitle="Visualiza el desempeño de tus complejos en tiempo real"
                />

                {!data ? (
                    <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-slate-500">No hay datos suficientes para generar reportes.</p>
                    </div>
                ) : (
                    <ReportsClient data={data} />
                )}
            </div>
        </MainLayout>
    );
}
