"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { toast } from "sonner";
import { InvoiceGenerationModal } from "@/components/invoices/InvoiceGenerationModal";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";
import { GenerateInvoicesSchema } from "@/lib/validations/invoice";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Role } from "@/types/roles";

export function InvoicesClient() {
    const t = useTranslations('Invoices');
    const tReservations = useTranslations('Reservations');
    const tCommon = useTranslations('Common');
    const tMethods = useTranslations('Payments.methods');

    const [invoices, setInvoices] = useState<any[]>([]);
    const [complexes, setComplexes] = useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
    const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null);
    const [selectedMethod, setSelectedMethod] = useState<'CARD' | 'CASH' | 'TRANSFER'>('CARD');
    const [showInstructions, setShowInstructions] = useState(false);
    const { data: session } = useSession();

    const isResident = session?.user?.role === Role.RESIDENT;
    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN;

    console.log('InvoicesClient Debug:', {
        role: session?.user?.role,
        isResident,
        isAdmin,
        expectedResident: Role.RESIDENT
    });

    useEffect(() => {
        const fetchComplexes = async () => {
            try {
                const response = await fetch("/api/complexes");
                const data = await response.json();
                if (response.ok) setComplexes(data);
            } catch (error) {
                console.error("Error fetching complexes:", error);
            }
        };
        fetchComplexes();
    }, []);

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/invoices");
            const data = await response.json();
            if (response.ok) {
                setInvoices(data);
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleGenerate = async (data: GenerateInvoicesSchema) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/invoices/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (response.ok) {
                toast.success(t('successGenerate', { count: result.generated, skipped: result.skipped }));
                setIsGenerateModalOpen(false);
                fetchInvoices();
            } else {
                toast.error(result.error || "Error al generar facturas");
            }
        } catch (error) {
            console.error("Error generating invoices:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const response = await fetch(`/api/invoices/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                fetchInvoices();
            }
        } catch (error) {
            console.error("Error updating invoice status:", error);
        }
    };

    const handlePay = (invoice: any) => {
        setPaymentInvoice(invoice);
        setIsPaymentMethodModalOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!paymentInvoice) return;

        setIsSubmitting(true);
        try {
            const response = await fetch("/api/payments/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoiceId: paymentInvoice.id,
                    method: selectedMethod
                }),
            });

            const data = await response.json();
            if (response.ok) {
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    setShowInstructions(true);
                    fetchInvoices();
                }
            } else {
                toast.error(data.error || "Error al iniciar el pago");
            }
        } catch (error) {
            console.error("Error initiating payment:", error);
            toast.error("Ocurrió un error al procesar el pago");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewDetail = async (invoice: any) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/invoices/${invoice.id}`);
            const data = await response.json();
            if (response.ok) {
                setSelectedInvoice(data);
                setIsDetailModalOpen(true);
            }
        } catch (error) {
            console.error("Error fetching invoice detail:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={
                    isAdmin && (
                        <Button
                            variant="primary"
                            icon="receipt_long"
                            onClick={() => setIsGenerateModalOpen(true)}
                        >
                            {t('generate')}
                        </Button>
                    )
                }
            />

            <Card>
                {isLoading && invoices.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <Spinner />
                    </div>
                ) : (
                    <InvoiceTable
                        invoices={invoices}
                        onViewDetail={handleViewDetail}
                        onUpdateStatus={handleUpdateStatus}
                        onPay={isResident ? handlePay : undefined}
                    />
                )}
            </Card>

            <Modal
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                title={t('modal.generateTitle')}
            >
                <InvoiceGenerationModal
                    onSubmit={handleGenerate}
                    isLoading={isSubmitting}
                    complexes={complexes}
                />
            </Modal>

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedInvoice(null);
                }}
                title={t('detail.title')}
            >
                <InvoiceDetailModal invoice={selectedInvoice} />
            </Modal>

            <Modal
                isOpen={isPaymentMethodModalOpen}
                onClose={() => {
                    setIsPaymentMethodModalOpen(false);
                    setShowInstructions(false);
                }}
                title={showInstructions ? t('form.success' as any) : tMethods('select')}
            >
                <div className="p-6 space-y-6">
                    {showInstructions ? (
                        <div className="space-y-6 text-center">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-success-600">check_circle</span>
                                </div>
                            </div>

                            {selectedMethod === 'TRANSFER' && (
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-left space-y-3">
                                    <h4 className="font-medium text-slate-900 dark:text-white border-b pb-2">
                                        {tReservations('paymentInstructions.transfer.title')}
                                    </h4>
                                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                        <p><span className="font-semibold">{tReservations('paymentInstructions.transfer.bankName')}</span></p>
                                        <p>{tReservations('paymentInstructions.transfer.accountName')}</p>
                                        <p className="font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded inline-block">
                                            {tReservations('paymentInstructions.transfer.accountNumber')}
                                        </p>
                                    </div>
                                    <p className="text-sm italic text-slate-500">
                                        {tReservations('paymentInstructions.transfer.instructions')}
                                    </p>
                                    <Button
                                        variant="secondary"
                                        className="w-full mt-2"
                                        onClick={() => {
                                            const waNumber = tReservations('paymentInstructions.transfer.whatsappNumber');
                                            const message = `Hola, envío comprobante de pago para factura (ID: ${paymentInvoice?.id})`;
                                            window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
                                        }}
                                    >
                                        <span className="material-symbols-outlined mr-2 text-lg">chat</span>
                                        {tReservations('paymentInstructions.transfer.whatsapp')}
                                    </Button>
                                </div>
                            )}

                            {selectedMethod === 'CASH' && (
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-left space-y-3">
                                    <h4 className="font-medium text-slate-900 dark:text-white border-b pb-2">
                                        {tReservations('paymentInstructions.cash.title')}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                        {tReservations('paymentInstructions.cash.instructions')}
                                    </p>
                                    <p className="text-xs text-slate-500 italic border-t pt-2 mt-2">
                                        {tReservations('paymentInstructions.cash.note')}
                                    </p>
                                </div>
                            )}

                            <Button
                                variant="primary"
                                className="w-full"
                                onClick={() => {
                                    setIsPaymentMethodModalOpen(false);
                                    setShowInstructions(false);
                                }}
                            >
                                {tCommon('close')}
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div
                                onClick={() => setSelectedMethod('CARD')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedMethod === 'CARD' ? 'border-primary bg-primary text-white' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900 shadow-sm'}`}
                            >
                                <span className={`material-symbols-outlined ${selectedMethod === 'CARD' ? 'text-white' : 'text-primary'}`}>credit_card</span>
                                <div>
                                    <p className={`font-semibold ${selectedMethod === 'CARD' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Tarjeta de Crédito/Débito</p>
                                    <p className={`text-xs ${selectedMethod === 'CARD' ? 'text-white/80' : 'text-slate-500'}`}>Pago instantáneo seguro vía Recurrente</p>
                                </div>
                            </div>

                            <div
                                onClick={() => setSelectedMethod('CASH')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedMethod === 'CASH' ? 'border-primary bg-primary text-white' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900 shadow-sm'}`}
                            >
                                <span className={`material-symbols-outlined ${selectedMethod === 'CASH' ? 'text-white' : 'text-primary'}`}>payments</span>
                                <div>
                                    <p className={`font-semibold ${selectedMethod === 'CASH' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Efectivo</p>
                                    <p className={`text-xs ${selectedMethod === 'CASH' ? 'text-white/80' : 'text-slate-500'}`}>Paga en la administración del complejo</p>
                                </div>
                            </div>

                            <div
                                onClick={() => setSelectedMethod('TRANSFER')}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedMethod === 'TRANSFER' ? 'border-primary bg-primary text-white' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900 shadow-sm'}`}
                            >
                                <span className={`material-symbols-outlined ${selectedMethod === 'TRANSFER' ? 'text-white' : 'text-primary'}`}>account_balance</span>
                                <div>
                                    <p className={`font-semibold ${selectedMethod === 'TRANSFER' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Transferencia Bancaria</p>
                                    <p className={`text-xs ${selectedMethod === 'TRANSFER' ? 'text-white/80' : 'text-slate-500'}`}>Envía el comprobante a administración</p>
                                </div>
                            </div>

                            <Button
                                onClick={handleConfirmPayment}
                                isLoading={isSubmitting}
                                className="w-full"
                            >
                                Confirmar Selección
                            </Button>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
