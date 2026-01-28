"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { InvoiceGenerationModal } from "@/components/invoices/InvoiceGenerationModal";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";
import { GenerateInvoicesSchema } from "@/lib/validations/invoice";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

export function InvoicesClient() {
    const t = useTranslations('Invoices');

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
                alert(t('successGenerate', { count: result.generated, skipped: result.skipped }));
                setIsGenerateModalOpen(false);
                fetchInvoices();
            } else {
                alert(result.error || "Error al generar facturas");
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
                    alert(t('successPaymentSelected') || "Solicitud de pago registrada. Por favor procede con el pago en efectivo o transferencia.");
                    setIsPaymentMethodModalOpen(false);
                    fetchInvoices();
                }
            } else {
                alert(data.error || "Error al iniciar el pago");
            }
        } catch (error) {
            console.error("Error initiating payment:", error);
            alert("Ocurrió un error al procesar el pago");
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
                onClose={() => setIsPaymentMethodModalOpen(false)}
                title={useTranslations('Payments.methods')('select')}
            >
                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div
                            onClick={() => setSelectedMethod('CARD')}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedMethod === 'CARD' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                            <span className="material-symbols-outlined text-primary">credit_card</span>
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">Tarjeta de Crédito/Débito</p>
                                <p className="text-xs text-slate-500">Pago instantáneo seguro vía Recurrente</p>
                            </div>
                        </div>

                        <div
                            onClick={() => setSelectedMethod('CASH')}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedMethod === 'CASH' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                            <span className="material-symbols-outlined text-primary">payments</span>
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">Efectivo</p>
                                <p className="text-xs text-slate-500">Paga en la administración del complejo</p>
                            </div>
                        </div>

                        <div
                            onClick={() => setSelectedMethod('TRANSFER')}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedMethod === 'TRANSFER' ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                        >
                            <span className="material-symbols-outlined text-primary">account_balance</span>
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">Transferencia Bancaria</p>
                                <p className="text-xs text-slate-500">Envía el comprobante a administración</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleConfirmPayment}
                        isLoading={isSubmitting}
                        className="w-full"
                    >
                        Confirmar Selección
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
