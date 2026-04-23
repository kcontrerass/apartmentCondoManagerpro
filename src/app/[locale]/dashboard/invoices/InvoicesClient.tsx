"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/Input";
import { SuperAdminBillingComplexSelector } from "@/components/invoices/SuperAdminBillingComplexSelector";

interface InvoicesClientProps {
    user: any;
    billingScopeComplexId?: string | null;
}

export function InvoicesClient({ user, billingScopeComplexId = null }: InvoicesClientProps) {
    const searchParams = useSearchParams();
    const openInvoiceHandled = useRef<string | null>(null);
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
    const [selectedMethod, setSelectedMethod] = useState<'CARD' | 'CASH' | 'TRANSFER' | null>(null);
    const [showInstructions, setShowInstructions] = useState(false);

    // Filters state
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [monthFilter, setMonthFilter] = useState("ALL");
    const [serviceFilter, setServiceFilter] = useState("ALL");

    const userRole = user?.role as Role;
    const isResident = userRole === Role.RESIDENT;
    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    /** Residente y administrador del complejo pueden iniciar cobro; súper admin y junta no. */
    const canOpenInvoicePay = isResident || userRole === Role.ADMIN;

    // Safety check for complexId if not Super Admin
    const [complexId, setComplexId] = useState<string | null>(user?.complexId || null);

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
                setInvoices(Array.isArray(data) ? data : []);
            } else {
                const msg =
                    typeof data?.error === "string"
                        ? data.error
                        : data?.error?.message || t("loadError");
                toast.error(msg);
                setInvoices([]);
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
                toast.error(t("loadError"));
            setInvoices([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    useEffect(() => {
        const oid = searchParams.get("openInvoice");
        if (!oid) {
            openInvoiceHandled.current = null;
            return;
        }
        if (openInvoiceHandled.current === oid) return;
        openInvoiceHandled.current = oid;
        let cancelled = false;
        (async () => {
            try {
                const response = await fetch(`/api/invoices/${oid}`);
                const data = await response.json();
                if (!cancelled && response.ok) {
                    setSelectedInvoice(data);
                    setIsDetailModalOpen(true);
                }
            } catch (e) {
                console.error("openInvoice:", e);
            } finally {
                if (!cancelled && typeof window !== "undefined") {
                    const url = new URL(window.location.href);
                    url.searchParams.delete("openInvoice");
                    const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : "");
                    window.history.replaceState({}, "", next);
                    openInvoiceHandled.current = null;
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [searchParams]);

    // Proactive complexId recovery for users with stale sessions
    useEffect(() => {
        const recoverComplexId = async () => {
            if (!complexId && userRole !== Role.SUPER_ADMIN && user?.id) {
                console.log(`[Invoices] 🔍 Attempting complexId recovery...`);
                try {
                    const response = await fetch('/api/users/profile');
                    if (response.ok) {
                        const profileData = await response.json();
                        const recoveredId = profileData.complexId ||
                            (profileData.managedComplexes?.[0]?.id) ||
                            (profileData.residentProfile?.unit?.complexId);

                        if (recoveredId) {
                            console.log(`[Invoices] ✅ Recovered complexId: ${recoveredId}`);
                            setComplexId(recoveredId);
                        }
                    }
                } catch (error) {
                    console.error('[Invoices] ❌ Failed to recover complexId:', error);
                }
            }
        };

        recoverComplexId();
    }, [complexId, userRole, user?.id]);

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
        setSelectedMethod(invoice.paymentMethodIntent ?? null);
        setShowInstructions(false);
        setIsPaymentMethodModalOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!paymentInvoice || !selectedMethod) return;

        setIsSubmitting(true);
        try {
            if (
                isResident &&
                selectedMethod !== paymentInvoice.paymentMethodIntent
            ) {
                const syncRes = await fetch(
                    `/api/invoices/${paymentInvoice.id}/payment-intent`,
                    {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ method: selectedMethod }),
                    }
                );
                const syncData = await syncRes.json();
                if (!syncRes.ok) {
                    const msg =
                        typeof syncData?.error === "string"
                            ? syncData.error
                            : t("paymentIntentSaveError");
                    toast.error(msg);
                    return;
                }
                setPaymentInvoice((prev: any) =>
                    prev ? { ...prev, ...syncData } : prev
                );
                setInvoices((prev) =>
                    prev.map((i) =>
                        i.id === paymentInvoice.id ? { ...i, ...syncData } : i
                    )
                );
            }

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
                const checkoutUrl = data?.data?.url || data?.url;
                if (checkoutUrl) {
                    window.location.href = checkoutUrl;
                } else {
                    setShowInstructions(true);
                    fetchInvoices();
                }
            } else {
                toast.error(data?.error?.message || data?.error || "Error al iniciar el pago");
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

    // Extract unique services from all invoices for the filter dropdown
    const availableServices = Array.from(new Set(
        invoices.flatMap(invoice => invoice.items?.map((item: any) => item.description) || [])
    )).filter(Boolean);

    const filteredInvoices = invoices.filter(invoice => {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesSearch =
            invoice.number?.toLowerCase().includes(lowerSearch) ||
            invoice.unit?.number?.toLowerCase().includes(lowerSearch) ||
            invoice.unit?.residents?.some((r: any) => 
                r.user?.name?.toLowerCase().includes(lowerSearch)
            );

        const matchesStatus = statusFilter === "ALL" || invoice.status === statusFilter;

        const matchesMonth = monthFilter === "ALL" || invoice.month?.toString() === monthFilter;

        const matchesService = serviceFilter === "ALL" ||
            (invoice.items && invoice.items.some((item: any) =>
                item.description === serviceFilter
            ));

        return matchesSearch && matchesStatus && matchesMonth && matchesService;
    });

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('title')}
                subtitle={
                    isResident ? t("subtitleResident") : t("subtitleAdmin")
                }
                actions={
                    isAdmin && (
                        <div className="flex gap-2">
                            <Button
                                variant="primary"
                                icon="receipt_long"
                                onClick={() => setIsGenerateModalOpen(true)}
                            >
                                {t('generate')}
                            </Button>
                        </div>
                    )
                }
            />

            <SuperAdminBillingComplexSelector
                userRole={userRole}
                initialComplexId={billingScopeComplexId}
                onScopeSaved={fetchInvoices}
            />

            <Card className="p-4 flex flex-col sm:flex-row gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                    <Input
                        type="search"
                        name="invoice-list-query"
                        id="invoice-list-search"
                        label={t("searchPlaceholder")}
                        placeholder={t("searchInputPlaceholder")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoComplete="search"
                        inputMode="search"
                    />
                </div>
                <div className="w-full sm:w-auto min-w-[150px]">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('modal.selectMonth') || "Mes"}
                    </label>
                    <div className="relative">
                        <select
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            className="w-full h-10 px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                        >
                            <option value="ALL">Todos los meses</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                <option key={month} value={month.toString()}>
                                    {new Date(2000, month - 1, 1).toLocaleString('es', { month: 'long' }).charAt(0).toUpperCase() + new Date(2000, month - 1, 1).toLocaleString('es', { month: 'long' }).slice(1)}
                                </option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            expand_more
                        </span>
                    </div>
                </div>
                <div className="w-full sm:w-auto min-w-[150px]">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Servicio
                    </label>
                    <div className="relative">
                        <select
                            value={serviceFilter}
                            onChange={(e) => setServiceFilter(e.target.value)}
                            className="w-full h-10 px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                        >
                            <option value="ALL">Todos los servicios</option>
                            {availableServices.map((serviceName: any, idx) => (
                                <option key={idx} value={serviceName}>{serviceName}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            expand_more
                        </span>
                    </div>
                </div>
                <div className="w-full sm:w-auto min-w-[150px]">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('table.status') || "Estado"}
                    </label>
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full h-10 px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                        >
                            <option value="ALL">{t('filterAll', { defaultValue: 'Todos los estados' })}</option>
                            <option value="PENDING">{t('status.PENDING', { defaultValue: 'Pendiente' })}</option>
                            <option value="PAID">{t('status.PAID', { defaultValue: 'Pagado' })}</option>
                            <option value="OVERDUE">{t('status.OVERDUE', { defaultValue: 'Vencido' })}</option>
                            <option value="PROCESSING">{t('status.PROCESSING', { defaultValue: 'En Proceso' })}</option>
                            <option value="CANCELLED">{t('status.CANCELLED', { defaultValue: 'Cancelado' })}</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            expand_more
                        </span>
                    </div>
                </div>
            </Card>

            <Card>
                {isLoading && invoices.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <Spinner />
                    </div>
                ) : (
                    <InvoiceTable
                        invoices={filteredInvoices}
                        onViewDetail={handleViewDetail}
                        onUpdateStatus={handleUpdateStatus}
                        onPay={canOpenInvoicePay ? handlePay : undefined}
                        userRole={userRole}
                        isLoading={isLoading}
                        requirePaymentMethodBeforePay={isResident}
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
                    setSelectedMethod(null);
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
                                <div className="bg-slate-50 dark:bg-background-dark p-4 rounded-lg text-left space-y-3">
                                    <h4 className="font-medium text-slate-900 dark:text-white border-b pb-2">
                                        {tReservations('paymentInstructions.transfer.title')}
                                    </h4>
                                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                        <p><span className="font-semibold">{tReservations('paymentInstructions.transfer.bankName')}</span></p>
                                        <p>{paymentInvoice?.complex?.name || tReservations('paymentInstructions.transfer.accountName')}</p>
                                        <p className="font-mono bg-white dark:bg-background-dark px-2 py-1 rounded inline-block">
                                            {paymentInvoice?.complex?.bankAccount || tReservations('paymentInstructions.transfer.accountNumber')}
                                        </p>
                                    </div>
                                    <p className="text-sm italic text-slate-500">
                                        {tReservations('paymentInstructions.transfer.instructions')}
                                    </p>
                                    <Button
                                        variant="secondary"
                                        className="w-full mt-2"
                                        onClick={() => {
                                            const waNumber = paymentInvoice?.complex?.phone || tReservations('paymentInstructions.transfer.whatsappNumber');
                                            const message = `Hola, envío el comprobante de mi transferencia para la factura #${paymentInvoice?.number || paymentInvoice?.id}.`;
                                            window.open(`https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                                        }}
                                    >
                                        <span className="material-symbols-outlined mr-2 text-lg">chat</span>
                                        {tReservations('paymentInstructions.transfer.whatsapp')}
                                    </Button>
                                </div>
                            )}

                            {selectedMethod === 'CASH' && (
                                <div className="bg-slate-50 dark:bg-background-dark p-4 rounded-lg text-left space-y-3">
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
                            {!isResident && paymentInvoice?.paymentMethodIntent ? (
                                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 text-sm text-slate-700 dark:text-slate-300">
                                    <p>
                                        {t("table.residentChoseMethod" as any)}:{" "}
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {t(
                                                `paymentMethod.${paymentInvoice.paymentMethodIntent}` as any
                                            )}
                                        </span>
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div
                                        onClick={() => setSelectedMethod('CARD')}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedMethod === 'CARD' ? 'border-primary bg-primary text-white' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-background-dark shadow-sm'}`}
                                    >
                                        <span className={`material-symbols-outlined ${selectedMethod === 'CARD' ? 'text-white' : 'text-primary'}`}>credit_card</span>
                                        <div>
                                            <p className={`font-semibold ${selectedMethod === 'CARD' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{tMethods('CARD')}</p>
                                            <p className={`text-xs ${selectedMethod === 'CARD' ? 'text-white/80' : 'text-slate-500'}`}>{tMethods('CARD_desc' as any) || 'Pago instantáneo seguro'}</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setSelectedMethod('CASH')}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedMethod === 'CASH' ? 'border-primary bg-primary text-white' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-background-dark shadow-sm'}`}
                                    >
                                        <span className={`material-symbols-outlined ${selectedMethod === 'CASH' ? 'text-white' : 'text-primary'}`}>payments</span>
                                        <div>
                                            <p className={`font-semibold ${selectedMethod === 'CASH' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{tMethods('CASH')}</p>
                                            <p className={`text-xs ${selectedMethod === 'CASH' ? 'text-white/80' : 'text-slate-500'}`}>{tMethods('CASH_desc' as any) || 'Paga en la administración'}</p>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setSelectedMethod('TRANSFER')}
                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${selectedMethod === 'TRANSFER' ? 'border-primary bg-primary text-white' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-background-dark shadow-sm'}`}
                                    >
                                        <span className={`material-symbols-outlined ${selectedMethod === 'TRANSFER' ? 'text-white' : 'text-primary'}`}>account_balance</span>
                                        <div>
                                            <p className={`font-semibold ${selectedMethod === 'TRANSFER' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{tMethods('TRANSFER')}</p>
                                            <p className={`text-xs ${selectedMethod === 'TRANSFER' ? 'text-white/80' : 'text-slate-500'}`}>{tMethods('TRANSFER_desc' as any) || 'Envía tu comprobante'}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            <Button
                                onClick={handleConfirmPayment}
                                isLoading={isSubmitting}
                                disabled={!selectedMethod}
                                title={
                                    !selectedMethod ? t("modal.confirmRequiresMethod") : undefined
                                }
                                className="w-full"
                            >
                                {t("modal.confirmPayment")}
                            </Button>
                            {!selectedMethod && (
                                <p className="text-center text-xs text-slate-500">
                                    {t("modal.confirmRequiresMethod")}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
