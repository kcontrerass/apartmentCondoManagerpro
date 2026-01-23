"use client";

import { useEffect, useState } from 'react';
import { getReservations, deleteReservation, updateReservation } from '@/lib/api/reservations';
import { useTranslations } from 'next-intl';
// Local constants for enums to avoid prisma client import issues in some environments
const ReservationStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED',
    COMPLETED: 'COMPLETED'
} as const;
type ReservationStatus = typeof ReservationStatus[keyof typeof ReservationStatus];

const Role = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    OPERATOR: 'OPERATOR',
    RESIDENT: 'RESIDENT'
} as const;
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function ReservationTable() {
    const t = useTranslations('Reservations');
    const tCommon = useTranslations('Common');
    const { data: session } = useSession();
    const locale = useLocale();
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const dateLocale = locale === 'es' ? es : enUS;

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getReservations();
            setReservations(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return;
        try {
            await deleteReservation(id);
            await fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleStatusChange = async (id: string, status: ReservationStatus) => {
        try {
            await updateReservation(id, { status });
            await fetchData();
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message || 'No se pudo actualizar la reserva'}`);
        }
    };

    const getStatusVariant = (status: ReservationStatus) => {
        switch (status) {
            case ReservationStatus.APPROVED: return 'success';
            case ReservationStatus.PENDING: return 'warning';
            case ReservationStatus.CANCELLED: return 'error';
            case ReservationStatus.REJECTED: return 'error';
            case ReservationStatus.COMPLETED: return 'info';
            default: return 'neutral';
        }
    };

    if (loading) return (
        <div className="flex justify-center py-12">
            <Spinner />
        </div>
    );

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('table.amenity')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('table.resident')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('table.start')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('table.end')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('table.status')}</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{tCommon('actions')}</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                    {reservations.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-slate-900 dark:text-white">{r.amenity?.name}</div>
                                <div className="text-xs text-slate-500">{r.amenity?.complex?.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                {r.user?.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                {format(new Date(r.startTime), 'PPp', { locale: dateLocale })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                {format(new Date(r.endTime), 'PPp', { locale: dateLocale })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={getStatusVariant(r.status)}>
                                    {t(`status.${r.status}` as any)}
                                </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                {session?.user?.role !== Role.RESIDENT && r.status === ReservationStatus.PENDING && (
                                    <>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleStatusChange(r.id, ReservationStatus.APPROVED)}
                                        >
                                            {t('actions.approve')}
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleStatusChange(r.id, ReservationStatus.REJECTED)}
                                        >
                                            {t('actions.reject')}
                                        </Button>
                                    </>
                                )}
                                {r.status !== ReservationStatus.CANCELLED && r.status !== ReservationStatus.REJECTED && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleStatusChange(r.id, ReservationStatus.CANCELLED)}
                                    >
                                        {t('actions.cancel')}
                                    </Button>
                                )}
                                {session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(r.id)}
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </Button>
                                ) : null}
                            </td>
                        </tr>
                    ))}
                    {reservations.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                {t('noReservations' as any)}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
