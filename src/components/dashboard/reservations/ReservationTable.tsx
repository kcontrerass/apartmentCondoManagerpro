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
    COMPLETED: 'COMPLETED',
    PROCESSING: 'PROCESSING'
} as const;
type ReservationStatus = typeof ReservationStatus[keyof typeof ReservationStatus];

import { Role } from "@/types/roles";
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function ReservationTable({ userRole }: { userRole?: Role }) {
    const t = useTranslations('Reservations');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const [reservations, setReservations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [refundReservationId, setRefundReservationId] = useState<string | null>(null);
    const [isProcessingRefund, setIsProcessingRefund] = useState(false);

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
        setIsDeleting(true);
        try {
            await deleteReservation(id);
            await fetchData();
        } catch (e) {
            console.error(e);
        } finally {
            setIsDeleting(false);
            setConfirmDeleteId(null);
        }
    };

    const handleStatusChange = async (id: string, data: any) => {
        try {
            await updateReservation(id, data);
            await fetchData();
        } catch (e: any) {
            console.error(e);
            alert(`Error: ${e.message || t('errors.updateFailed')}`);
        }
    };

    const handleRefund = async () => {
        if (!refundReservationId) return;
        setIsProcessingRefund(true);
        try {
            await updateReservation(refundReservationId, {
                depositStatus: 'REFUNDED',
                refundMethod: 'CASH'
            } as any);
            await fetchData();
            setRefundReservationId(null);
        } catch (e: any) {
            console.error(e);
            alert(`${t('errors.refundFailed')}: ${e.message}`);
        } finally {
            setIsProcessingRefund(false);
        }
    };

    const getStatusVariant = (status: ReservationStatus) => {
        switch (status) {
            case ReservationStatus.APPROVED: return 'success';
            case ReservationStatus.PENDING: return 'warning';
            case ReservationStatus.CANCELLED: return 'error';
            case ReservationStatus.REJECTED: return 'error';
            case ReservationStatus.COMPLETED: return 'info';
            case ReservationStatus.PROCESSING: return 'info';
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
                <thead className="bg-slate-50 dark:bg-background-dark/50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('table.amenity')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('table.resident')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('table.unit')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('table.start')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('table.end')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('table.status')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('table.payment')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('table.deposit')}</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">{tCommon('actions')}</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-background-dark divide-y divide-slate-200 dark:divide-slate-800">
                    {reservations.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-slate-900 dark:text-white">{r.amenity?.name}</div>
                                <div className="text-xs text-slate-500">{r.amenity?.complex?.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                {r.user?.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 font-bold">
                                {r.user?.residentProfile?.unit?.number || '-'}
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
                            <td className="px-6 py-4 whitespace-nowrap">
                                {r.paymentMethod ? (
                                    (() => {
                                        const isPaid = r.status === 'APPROVED' || r.status === 'COMPLETED';
                                        if (r.paymentMethod === 'CARD' && !isPaid) {
                                            return <span className="text-sm text-slate-400 dark:text-slate-500">-</span>;
                                        }

                                        return (
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm text-slate-500">
                                                    {r.paymentMethod === 'CARD' ? 'credit_card' : r.paymentMethod === 'CASH' ? 'payments' : 'account_balance'}
                                                </span>
                                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                                    {t(`paymentMethod.${r.paymentMethod}` as any)}
                                                </span>
                                            </div>
                                        )
                                    })()
                                ) : (
                                    <span className="text-sm text-slate-400 dark:text-slate-500">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {r.depositAmount > 0 ? (
                                    <div className="flex flex-col gap-1">
                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            Q{Number(r.depositAmount).toFixed(2)}
                                        </div>
                                        <Badge variant={r.depositStatus === 'PAID' ? 'success' : r.depositStatus === 'REFUNDED' ? 'info' : r.depositStatus === 'PENDING' ? 'warning' : 'neutral'}>
                                            {t(`depositStatus.${r.depositStatus}` as any)}
                                        </Badge>
                                        {r.depositStatus === 'REFUNDED' && r.refundMethod && (
                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold mt-1">
                                                <span className="material-symbols-outlined text-[12px]">
                                                    {r.refundMethod === 'CASH' ? 'payments' : 'account_balance'}
                                                </span>
                                                {t(`paymentMethod.${r.refundMethod}` as any)}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-sm text-slate-400 dark:text-slate-500">-</span>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                {(userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN || userRole === Role.BOARD_OF_DIRECTORS) && (
                                    <div className="flex justify-end gap-2">
                                        {(r.status === ReservationStatus.PENDING || r.status === ReservationStatus.PROCESSING) && (
                                            <>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleStatusChange(r.id, { status: ReservationStatus.APPROVED })}
                                                >
                                                    {t('actions.approve')}
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleStatusChange(r.id, { status: ReservationStatus.REJECTED })}
                                                >
                                                    {t('actions.reject')}
                                                </Button>
                                            </>
                                        )}
                                        {r.depositAmount > 0 && r.depositStatus === 'PENDING' && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => handleStatusChange(r.id, { depositStatus: 'PAID' })}
                                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-none px-3"
                                            >
                                                {t('depositStatus.markPaid' as any) || "Marcar Pago Depósito"}
                                            </Button>
                                        )}
                                        {r.depositStatus === 'PAID' && (
                                            <>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setRefundReservationId(r.id)}
                                                    className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none px-3"
                                                >
                                                    {t('depositActions.refund')}
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleStatusChange(r.id, { depositStatus: 'RETAINED' } as any)}
                                                    className="bg-orange-50 text-orange-600 hover:bg-orange-100 border-none"
                                                >
                                                    {t('depositActions.retain')}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    {reservations.length === 0 && (
                        <tr>
                            <td colSpan={9} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                {t('noReservations' as any)}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                title={t('confirmDeleteTitle')}
                message={t('deleteConfirm')}
                isLoading={isDeleting}
                confirmText={tCommon('delete')}
                cancelText={tCommon('cancel')}
            />

            <ConfirmModal
                isOpen={!!refundReservationId}
                onClose={() => setRefundReservationId(null)}
                onConfirm={handleRefund}
                title={t('refundModal.title')}
                isLoading={isProcessingRefund}
                confirmText={t('refundModal.confirm')}
                cancelText={tCommon('cancel')}
                type="primary"
                message={t('refundModal.message')}
            />
        </div>
    );
}
