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
    const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH' | 'TRANSFER'>('CARD');
    const [currentAmenity, setCurrentAmenity] = useState<any>(null);
    const [totalCost, setTotalCost] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchAmenities = async () => {
            try {
                const data = await getAmenities();
                setAmenities(data);
                if (initialAmenityId) {
                    const amenity = data.find((a: any) => a.id === initialAmenityId);
                    if (amenity) setCurrentAmenity(amenity);
                }
            } catch (err) {
                console.error('Error fetching amenities:', err);
            }
        };
        fetchAmenities();
    }, [initialAmenityId]);

    useEffect(() => {
        if (amenityId && amenities.length > 0) {
            const amenity = amenities.find((a) => a.id === amenityId);
            setCurrentAmenity(amenity);
        }
    }, [amenityId, amenities]);

    useEffect(() => {
        if (currentAmenity && startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            if (end > start) {
                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                const days = Math.ceil(hours / 24);

                let cost = 0;
                if (currentAmenity.costPerHour) {
                    cost = hours * Number(currentAmenity.costPerHour);
                } else if (currentAmenity.costPerDay) {
                    cost = days * Number(currentAmenity.costPerDay);
                }
                setTotalCost(Math.max(0, cost));
            } else {
                setTotalCost(0);
            }
        } else {
            setTotalCost(0);
        }
    }, [currentAmenity, startTime, endTime]);

    const [successType, setSuccessType] = useState<'TRANSFER' | 'CASH' | null>(null);
    const [invoiceIdForSuccess, setInvoiceIdForSuccess] = useState<string | null>(null);

    const isPaymentRequired = currentAmenity?.requiresPayment || totalCost > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (!amenityId) {
                throw new Error(t('form.errorAmenityRequired') || 'Debe seleccionar una amenidad');
            }

            // --- NEW FLOW FOR CARD PAYMENTS ---
            if (paymentMethod === 'CARD' && isPaymentRequired) {
                const checkoutRes = await fetch('/api/payments/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        method: 'CARD',
                        reservationData: {
                            startTime: new Date(startTime).toISOString(),
                            endTime: new Date(endTime).toISOString(),
                            notes: notes || undefined,
                            amenityId,
                            totalCost
                        }
                    })
                });

                const checkoutData = await checkoutRes.json();
                if (!checkoutRes.ok) {
                    throw new Error(checkoutData.error || 'Error al iniciar el pago');
                }

                if (checkoutData.url) {
                    window.location.href = checkoutData.url;
                    return;
                }
            }

            // --- LEGACY FLOW FOR CASH/TRANSFER OR NO PAYMENT ---
            const res = await createReservation({
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                notes: notes || undefined,
                amenityId,
                paymentMethod: isPaymentRequired ? paymentMethod : undefined,
                totalCost,
            } as any);

            // Handle Success Flows
            if (res.invoiceId && isPaymentRequired) {
                if (paymentMethod === 'TRANSFER') {
                    setSuccessType('TRANSFER');
                    setInvoiceIdForSuccess(res.invoiceId);
                } else if (paymentMethod === 'CASH') {
                    setSuccessType('CASH');
                    setInvoiceIdForSuccess(res.invoiceId);
                }
            } else {
                if (onSuccess) onSuccess();
                else {
                    router.refresh();
                    alert(t('form.success'));
                }
            }

            // Clear form
            if (!successType) {
                setStartTime('');
                setEndTime('');
                setNotes('');
            }

        } catch (err: any) {
            setError(err.message || t('form.errorGeneral'));
        } finally {
            setIsLoading(false);
        }
    };

    // Render Success View (Instructions)
    if (successType) {
        return (
            <Card className="max-w-md mx-auto shadow-none border-0 p-6 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-success-600">check_circle</span>
                    </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t('form.success')}
                </h3>

                {successType === 'TRANSFER' && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-left space-y-3">
                        <h4 className="font-medium text-slate-900 dark:text-white border-b pb-2">
                            {t('paymentInstructions.transfer.title')}
                        </h4>
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                            <p><span className="font-semibold">{t('paymentInstructions.transfer.bankName')}</span></p>
                            <p>{t('paymentInstructions.transfer.accountName')}</p>
                            <p className="font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded inline-block">
                                {t('paymentInstructions.transfer.accountNumber')}
                            </p>
                        </div>
                        <p className="text-sm italic text-slate-500">
                            {t('paymentInstructions.transfer.instructions')}
                        </p>
                        <Button
                            variant="secondary"
                            className="w-full mt-2"
                            onClick={() => {
                                const waNumber = t('paymentInstructions.transfer.whatsappNumber');
                                const message = `Hola, envío comprobante de pago para reserva de amenidad (Factura: ${invoiceIdForSuccess})`;
                                window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
                            }}
                        >
                            <span className="material-symbols-outlined mr-2 text-lg">chat</span>
                            {t('paymentInstructions.transfer.whatsapp')}
                        </Button>
                    </div>
                )}

                {successType === 'CASH' && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-left space-y-3">
                        <h4 className="font-medium text-slate-900 dark:text-white border-b pb-2">
                            {t('paymentInstructions.cash.title')}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            {t('paymentInstructions.cash.instructions')}
                        </p>
                        <p className="text-xs text-slate-500 italic border-t pt-2 mt-2">
                            {t('paymentInstructions.cash.note')}
                        </p>
                    </div>
                )}

                <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                        if (onSuccess) onSuccess();
                        else window.location.reload();
                    }}
                >
                    {t('form.close')}
                </Button>
            </Card>
        );
    }

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

                {isPaymentRequired && (
                    <div className="space-y-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total a pagar:</span>
                            <span className="text-lg font-bold text-primary">Q{totalCost.toFixed(2)}</span>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Método de Pago
                            </label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as any)}
                                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            >
                                <option value="CARD">Tarjeta de Crédito/Débito</option>
                                <option value="CASH">Efectivo</option>
                                <option value="TRANSFER">Transferencia Bancaria</option>
                            </select>
                        </div>
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full"
                    isLoading={isLoading}
                >
                    {t('form.submit')}
                </Button>
            </form>
        </Card >
    );
}
