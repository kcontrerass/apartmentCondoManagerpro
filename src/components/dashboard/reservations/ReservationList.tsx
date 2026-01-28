"use client";

const ReservationStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED',
    COMPLETED: 'COMPLETED',
    PROCESSING: 'PROCESSING'
} as const;
type ReservationStatus = typeof ReservationStatus[keyof typeof ReservationStatus];
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ReservationListProps {
    reservations: any[];
    onCancel: (id: string) => void;
}

export default function ReservationList({ reservations, onCancel }: ReservationListProps) {
    const t = useTranslations('Reservations');
    const locale = useLocale();
    const dateLocale = locale === 'es' ? es : enUS;

    const getStatusVariant = (status: ReservationStatus) => {
        switch (status) {
            case ReservationStatus.APPROVED: return 'success';
            case ReservationStatus.PENDING: return 'warning';
            case ReservationStatus.CANCELLED: return 'error';
            case ReservationStatus.REJECTED: return 'error';
            case ReservationStatus.COMPLETED: return 'info';
            case ReservationStatus.PROCESSING: return 'warning';
            default: return 'neutral';
        }
    };

    if (reservations.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                {t('noReservations' as any)}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reservations.map((r) => (
                <Card key={r.id} className="p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{r.amenity?.name}</h4>
                                <p className="text-xs text-slate-500">{r.amenity?.complex?.name}</p>
                            </div>
                            <Badge variant={getStatusVariant(r.status)}>
                                {t(`status.${r.status}` as any)}
                            </Badge>
                        </div>

                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">calendar_month</span>
                                <span>{format(new Date(r.startTime), 'PP', { locale: dateLocale })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                <span>
                                    {format(new Date(r.startTime), 'p', { locale: dateLocale })} - {format(new Date(r.endTime), 'p', { locale: dateLocale })}
                                </span>
                            </div>
                            {r.paymentMethod && (
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <span className="material-symbols-outlined text-sm">
                                        {r.paymentMethod === 'CARD' ? 'credit_card' : r.paymentMethod === 'CASH' ? 'payments' : 'account_balance'}
                                    </span>
                                    <span>{t(`paymentMethod.${r.paymentMethod}` as any)}</span>
                                </div>
                            )}
                            {r.notes && (
                                <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded italic text-xs">
                                    "{r.notes}"
                                </div>
                            )}
                        </div>
                    </div>

                    {r.status === ReservationStatus.PENDING && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => onCancel(r.id)}
                        >
                            {t('actions.cancel')}
                        </Button>
                    )}
                </Card>
            ))}
        </div>
    );
}
