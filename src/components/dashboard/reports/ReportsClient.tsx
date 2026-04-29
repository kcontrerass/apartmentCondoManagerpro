"use client";

import { useRef } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { useTranslations } from 'next-intl';
import { RevenueChart } from './RevenueChart';
import { IncidentsChart } from './IncidentsChart';
import { IncidentTypesChart } from './IncidentTypesChart';
import { AmenitiesPopularityChart } from './AmenitiesPopularityChart';
import { VisitorTrendsChart } from './VisitorTrendsChart';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import { useRouter, usePathname } from '@/i18n/routing';
import { Role } from '@/types/roles';

export type ReportsDashboardData =
    | {
        variant: 'RESIDENTIAL';
        revenueData: { month: string; total: number }[];
        incidentsData: { statusKey: string; count: number; color: string }[];
        reservationsByAmenity: { name: string; count: number }[];
        visitorTrends: { date: string; count: number }[];
        stats: {
            totalRevenue: number;
            totalIncidents: number;
            resolvedRate: number;
            occupancyRate: number;
        };
    }
    | {
        variant: 'SHOPPING_CENTER';
        revenueData: { month: string; total: number }[];
        incidentsData: { statusKey: string; count: number; color: string }[];
        incidentsByType: { typeKey: string; count: number; color: string }[];
        servicesByContractCount: { name: string; count: number }[];
        stats: {
            totalRevenue: number;
            totalIncidents: number;
            resolvedRate: number;
            storeOccupancyRate: number;
            announcementsLast90Days: number;
            upcomingEventsCount: number;
        };
    };

interface ReportsClientProps {
    data: ReportsDashboardData;
    complexes: { id: string; name: string }[];
    selectedComplexId?: string;
    userRole: string;
}

export function ReportsClient({ data, complexes, selectedComplexId, userRole }: ReportsClientProps) {
    const t = useTranslations('Reports');
    const router = useRouter();
    const pathname = usePathname();

    const revenueChartRef = useRef<any>(null);
    const incidentsChartRef = useRef<any>(null);
    const incidentTypesChartRef = useRef<any>(null);
    const amenitiesChartRef = useRef<any>(null);
    const visitorTrendsChartRef = useRef<any>(null);

    const localizedRevenueData = data.revenueData.map(d => ({
        ...d,
        month: t(`months.${d.month}`)
    }));

    const localizedIncidentsData = data.incidentsData.map(d => ({
        status: t(`incidentsStatus.${d.statusKey}`),
        count: d.count,
        color: d.color
    }));

    const localizedIncidentTypesData =
        data.variant === 'SHOPPING_CENTER'
            ? data.incidentsByType.map((d) => ({
                label: t(`incidentTypes.${d.typeKey}`),
                count: d.count,
                color: d.color,
            }))
            : [];

    const handleComplexChange = (id: string) => {
        const params = new URLSearchParams();
        if (id !== 'all') {
            params.set('complexId', id);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Reporte de Gestión');

        // Styles
        const titleStyle = { font: { bold: true, size: 14 } };
        const headerStyle = { font: { bold: true }, fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE2E8F0' } } };

        let currentRow = 1;

        // 1. Revenue Section
        sheet.getCell(`A${currentRow}`).value = t('excelSections.monthlyRevenue');
        sheet.getCell(`A${currentRow}`).style = titleStyle;
        currentRow++;

        sheet.getRow(currentRow).values = [t('excelColumns.month'), t('excelColumns.amount')];
        sheet.getRow(currentRow).eachCell(cell => cell.style = headerStyle);
        currentRow++;

        localizedRevenueData.forEach(d => {
            sheet.getRow(currentRow).values = [d.month, d.total];
            currentRow++;
        });

        currentRow++;
        const revenueImg = revenueChartRef.current?.getChartImage();
        if (revenueImg) {
            const imageId = workbook.addImage({
                base64: revenueImg,
                extension: 'png',
            });
            sheet.addImage(imageId, {
                tl: { col: 0, row: currentRow - 1 },
                ext: { width: 300, height: 180 }
            });
            currentRow += 10;
        }

        currentRow += 2;

        // 2. Incidents Section
        sheet.getCell(`A${currentRow}`).value = t('excelSections.incidentsByStatus');
        sheet.getCell(`A${currentRow}`).style = titleStyle;
        currentRow++;

        sheet.getRow(currentRow).values = [t('excelColumns.status'), t('excelColumns.count')];
        sheet.getRow(currentRow).eachCell(cell => cell.style = headerStyle);
        currentRow++;

        localizedIncidentsData.forEach(d => {
            sheet.getRow(currentRow).values = [d.status, d.count];
            currentRow++;
        });

        currentRow++;
        const incidentsImg = incidentsChartRef.current?.getChartImage();
        if (incidentsImg) {
            const imageId = workbook.addImage({
                base64: incidentsImg,
                extension: 'png',
            });
            sheet.addImage(imageId, {
                tl: { col: 0, row: currentRow - 1 },
                ext: { width: 240, height: 180 }
            });
            currentRow += 10;
        }

        currentRow += 2;

        if (data.variant === 'SHOPPING_CENTER') {
            sheet.getCell(`A${currentRow}`).value = t('excelSections.incidentTypes');
            sheet.getCell(`A${currentRow}`).style = titleStyle;
            currentRow++;

            sheet.getRow(currentRow).values = [t('excelColumns.incidentCategory'), t('excelColumns.count')];
            sheet.getRow(currentRow).eachCell(cell => cell.style = headerStyle);
            currentRow++;

            localizedIncidentTypesData.forEach(d => {
                sheet.getRow(currentRow).values = [d.label, d.count];
                currentRow++;
            });

            currentRow++;
            const incidentTypesImg = incidentTypesChartRef.current?.getChartImage();
            if (incidentTypesImg) {
                const imageId = workbook.addImage({
                    base64: incidentTypesImg,
                    extension: 'png',
                });
                sheet.addImage(imageId, {
                    tl: { col: 0, row: currentRow - 1 },
                    ext: { width: 240, height: 180 }
                });
                currentRow += 10;
            }

            currentRow += 2;
        }

        // 3. Amenities vs services ranking
        sheet.getCell(`A${currentRow}`).value =
            data.variant === 'SHOPPING_CENTER'
                ? t('excelSections.servicesRanking')
                : t('excelSections.amenityPopularity');
        sheet.getCell(`A${currentRow}`).style = titleStyle;
        currentRow++;

        const rankingRows =
            data.variant === 'SHOPPING_CENTER'
                ? data.servicesByContractCount
                : data.reservationsByAmenity;
        const col2Header =
            data.variant === 'SHOPPING_CENTER'
                ? t('excelColumns.activeContracts')
                : t('excelColumns.reservations');

        sheet.getRow(currentRow).values = [t('excelColumns.name'), col2Header];
        sheet.getRow(currentRow).eachCell(cell => cell.style = headerStyle);
        currentRow++;

        rankingRows.forEach(d => {
            sheet.getRow(currentRow).values = [d.name, d.count];
            currentRow++;
        });

        currentRow++;
        const amenitiesImg = amenitiesChartRef.current?.getChartImage();
        if (amenitiesImg) {
            const imageId = workbook.addImage({
                base64: amenitiesImg,
                extension: 'png',
            });
            sheet.addImage(imageId, {
                tl: { col: 0, row: currentRow - 1 },
                ext: { width: 300, height: 180 }
            });
            currentRow += 10;
        }

        currentRow += 2;

        if (data.variant === 'RESIDENTIAL') {
            // Visitors (residential only)
            sheet.getCell(`A${currentRow}`).value = t('excelSections.visitorTrends');
            sheet.getCell(`A${currentRow}`).style = titleStyle;
            currentRow++;

            sheet.getRow(currentRow).values = [t('excelColumns.date'), t('excelColumns.visitors')];
            sheet.getRow(currentRow).eachCell(cell => cell.style = headerStyle);
            currentRow++;

            data.visitorTrends.forEach(d => {
                sheet.getRow(currentRow).values = [d.date, d.count];
                currentRow++;
            });

            currentRow++;
            const visitorsImg = visitorTrendsChartRef.current?.getChartImage();
            if (visitorsImg) {
                const imageId = workbook.addImage({
                    base64: visitorsImg,
                    extension: 'png',
                });
                sheet.addImage(imageId, {
                    tl: { col: 0, row: currentRow - 1 },
                    ext: { width: 300, height: 180 }
                });
                currentRow += 10;
            }
        }

        // Column Widths
        sheet.getColumn(1).width = 25;
        sheet.getColumn(2).width = 15;

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `reporte_general_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const isShoppingCenter = data.variant === 'SHOPPING_CENTER';

    const occupancyRate =
        data.variant === 'RESIDENTIAL' ? data.stats.occupancyRate : null;
    const storeOccupancyRate =
        data.variant === 'SHOPPING_CENTER' ? data.stats.storeOccupancyRate : null;

    return (
        <div className="space-y-8 pb-12">
            {/* Filter Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white dark:bg-background-dark/50 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-full md:w-auto">
                    <Button
                        variant="primary"
                        icon="download"
                        onClick={exportToExcel}
                        className="w-full md:w-auto shadow-lg shadow-primary/20"
                    >
                        {t('exportToExcel')}
                    </Button>
                </div>

                {(userRole === Role.SUPER_ADMIN || complexes.length > 1) && (
                    <div className="w-full md:w-80">
                        <label htmlFor="complex-select" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                            {t('filterByComplex')}
                        </label>
                        <div className="relative">
                            <select
                                id="complex-select"
                                className="w-full bg-white dark:bg-background-dark border-2 border-slate-100 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                                value={selectedComplexId || 'all'}
                                onChange={(e) => handleComplexChange(e.target.value)}
                            >
                                <option value="all">{t('allComplexes')}</option>
                                {complexes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <span className="material-symbols-outlined text-[20px]">expand_more</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-white dark:bg-background-dark border-slate-200 dark:border-slate-800 shadow-sm border group hover:border-indigo-500/50 transition-all overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-indigo-500/10 transition-colors" />
                    <div className="flex items-center gap-4 relative">
                        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <span className="material-symbols-outlined text-[24px]">payments</span>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">{t('stats.totalRevenue')}</p>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(data.stats.totalRevenue)}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-background-dark border-slate-200 dark:border-slate-800 shadow-sm border group hover:border-emerald-500/50 transition-all overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="flex items-center gap-4 relative">
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                            <span className="material-symbols-outlined text-[24px]">
                                {isShoppingCenter ? 'storefront' : 'pie_chart'}
                            </span>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
                                {isShoppingCenter ? t('stats.storeOccupancy') : t('stats.occupancy')}
                            </p>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {isShoppingCenter
                                    ? `${storeOccupancyRate ?? 0}%`
                                    : `${occupancyRate ?? 0}%`}
                            </h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-background-dark border-slate-200 dark:border-slate-800 shadow-sm border group hover:border-amber-500/50 transition-all overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-amber-500/10 transition-colors" />
                    <div className="flex items-center gap-4 relative">
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                            <span className="material-symbols-outlined text-[24px]">warning</span>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">{t('stats.incidents')}</p>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{data.stats.totalIncidents}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-background-dark border-slate-200 dark:border-slate-800 shadow-sm border group hover:border-rose-500/50 transition-all overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-8 -mt-8 group-hover:bg-rose-500/10 transition-colors" />
                    <div className="flex items-center gap-4 relative">
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                            <span className="material-symbols-outlined text-[24px]">task_alt</span>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">{t('stats.resolution')}</p>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{data.stats.resolvedRate}%</h3>
                        </div>
                    </div>
                </Card>
            </div>

            {data.variant === 'SHOPPING_CENTER' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 bg-white dark:bg-background-dark border-slate-200 dark:border-slate-800 shadow-sm border border-violet-200/60 dark:border-violet-900/40">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                                <span className="material-symbols-outlined text-[24px]">campaign</span>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
                                    {t('stats.announcements90d')}
                                </p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {data.stats.announcementsLast90Days}
                                </h3>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-6 bg-white dark:bg-background-dark border-slate-200 dark:border-slate-800 shadow-sm border border-sky-200/60 dark:border-sky-900/40">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                                <span className="material-symbols-outlined text-[24px]">event</span>
                            </div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-0.5">
                                    {t('stats.upcomingEvents90d')}
                                </p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {data.stats.upcomingEventsCount}
                                </h3>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Charts Grid - High Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RevenueChart ref={revenueChartRef} data={localizedRevenueData} />
                {data.variant === 'SHOPPING_CENTER' ? (
                    <IncidentTypesChart ref={incidentTypesChartRef} data={localizedIncidentTypesData} />
                ) : (
                    <VisitorTrendsChart ref={visitorTrendsChartRef} data={data.visitorTrends} />
                )}
            </div>

            {/* Charts Grid - Secondary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <AmenitiesPopularityChart
                        ref={amenitiesChartRef}
                        data={
                            isShoppingCenter
                                ? data.servicesByContractCount
                                : data.reservationsByAmenity
                        }
                        rankingChart={isShoppingCenter ? 'services' : 'amenities'}
                    />
                </div>
                <div className="lg:col-span-1">
                    <IncidentsChart ref={incidentsChartRef} data={localizedIncidentsData} />
                </div>
            </div>
        </div>
    );
}
