"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createReservation } from '@/lib/api/reservations';
import { getAmenities } from '@/lib/api/amenities';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ReservationForm({
    amenityId: initialAmenityId,
    onSuccess
}: {
    amenityId?: string;
    onSuccess?: () => void;
}) {
    const t = useTranslations('Reservations');
    const [amenityId, setAmenityId] = useState(initialAmenityId || '');
    const [amenities, setAmenities] = useState<any[]>([]);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!initialAmenityId) {
            const fetchAmenities = async () => {
                try {
                    const data = await getAmenities();
                    setAmenities(data);
                } catch (err) {
                    console.error('Error fetching amenities:', err);
                }
            };
            fetchAmenities();
        }
    }, [initialAmenityId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (!amenityId) {
                throw new Error(t('form.errorAmenityRequired') || 'Debe seleccionar una amenidad');
            }

            await createReservation({
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                notes: notes || undefined,
                amenityId,
            } as any);

            // Reset form
            setStartTime('');
            setEndTime('');
            setNotes('');

            if (onSuccess) {
                onSuccess();
            } else {
                router.refresh();
                alert(t('form.success'));
            }
        } catch (err: any) {
            setError(err.message || t('form.errorGeneral'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-md mx-auto shadow-none border-0">
            <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t('new')}
                </h3>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30">
                        {error}
                    </div>
                )}

                {!initialAmenityId && (
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {t('table.amenity')}
                        </label>
                        <select
                            value={amenityId}
                            onChange={(e) => setAmenityId(e.target.value)}
                            required
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        >
                            <option value="">Seleccionar amenidad...</option>
                            {amenities.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name} ({a.complex?.name})
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('form.startTime')}
                    </label>
                    <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('form.endTime')}
                    </label>
                    <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('form.notes')}
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    isLoading={isLoading}
                >
                    {t('form.submit')}
                </Button>
            </form>
        </Card>
    );
}
