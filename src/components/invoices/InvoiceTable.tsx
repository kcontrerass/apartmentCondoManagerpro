"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { Role } from "@/types/roles";
import { formatPrice } from "@/lib/utils";
import {
    buildCardRecurrenteDetailForInvoicePdf,
    generateInvoicePDF,
} from "@/lib/utils/pdf-generator";
import { getDefaultRecurrenteFeeConfigFromEnv } from "@/lib/recurrente-fee-config-env";
import { useRecurrenteFeeConfig } from "@/hooks/useRecurrenteFeeConfig";
import { RecurrenteCardFeeInline } from "@/components/payments/RecurrenteCardFeeInline";
import { invoiceShowsRecurrenteCardLine } from "@/lib/invoice-recurrente-card";

interface InvoiceTableProps {
    invoices: any[];
    onViewDetail: (invoice: any) => void;
    onUpdateStatus: (id: string, status: string) => void;
    onPay?: (invoice: any) => void;
    userRole?: Role;
    isLoading?: boolean;
    /** Residente: método solo en el modal; staff paga cuando el residente ya guardó intención en servidor. */
    requirePaymentMethodBeforePay?: boolean;
    /** Para comisión % tarjeta (mismo complejo que en cobros). */
    cardFeeComplexId?: string | null;
}

export function InvoiceTable({
    invoices,
    onViewDetail,
    onUpdateStatus,
    onPay,
    userRole,
    isLoading,
    requirePaymentMethodBeforePay = false,
    cardFeeComplexId: cardFeeComplexIdProp = null,
}: InvoiceTableProps) {
    const t = useTranslations('Invoices');
    const locale = useLocale();
    const dateLocale = locale === 'es' ? es : enUS;

    const cardFeeComplexId =
        cardFeeComplexIdProp ||
        invoices.find((i) => i.unit?.complexId)?.unit?.complexId ||
        null;
    const feeConfig = useRecurrenteFeeConfig(cardFeeComplexId);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "PAID": return "success";
            case "PENDING": return "warning";
            case "OVERDUE": return "error";
            case "CANCELLED": return "neutral";
            case "PROCESSING": return "info";
            default: return "neutral";
        }
    };

    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    const staffWaitsForResidentIntent =
        userRole === Role.ADMIN ||
        userRole === Role.SUPER_ADMIN ||
        userRole === Role.BOARD_OF_DIRECTORS;
    const canPayRow = (status: string) =>
        status === "PENDING" || status === "PROCESSING" || status === "OVERDUE";

    const hasServerPaymentIntent = (invoice: any) => !!invoice.paymentMethodIntent;

    /** Solo staff espera a que el residente guarde método en servidor. */
    const staffIntentBlocked = (invoice: any) =>
        canPayRow(invoice.status) &&
        staffWaitsForResidentIntent &&
        !hasServerPaymentIntent(invoice);

    const handleDownload = (invoice: any) => {
        const configForPdf = feeConfig ?? getDefaultRecurrenteFeeConfigFromEnv();
        const cardRecurrente = buildCardRecurrenteDetailForInvoicePdf(
            Number(invoice.totalAmount),
            invoice.paymentMethod,
            invoice.reservation?.paymentMethod,
            configForPdf
        );
        generateInvoicePDF({
            invoiceNumber: invoice.number,
            date: format(new Date(invoice.createdAt), 'dd/MM/yyyy'),
            dueDate: format(new Date(new Date(invoice.dueDate).getTime() + new Date(invoice.dueDate).getTimezoneOffset() * 60000), 'dd/MM/yyyy'),
            residentName: invoice.resident?.name || invoice.unit?.residents?.[0]?.user?.name || "Residente",
            unitNumber: invoice.unit?.number || "N/A",
            complexName: invoice.complex?.name || "ADESSO-365 Complex",
            complexAddress: invoice.complex?.address || "",
            items: (invoice.items || []).map((item: any) => ({
                description: item.description,
                amount: Number(item.amount)
            })),
            total: Number(invoice.totalAmount),
            status: invoice.status,
            bankAccount: invoice.complex?.bankAccount,
            cardRecurrente,
        });
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {t('table.number')}
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {t('table.unit')}
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {t('table.period')}
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            Servicios
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {t('table.total')}
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {t('table.status')}
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {t('table.payment')}
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {t('table.dueDate')}
                        </th>
                        <th className="py-4 px-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                            {t('table.actions')}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {invoices.map((invoice) => {
                        const staffBlocked = staffIntentBlocked(invoice);
                        const intentGateTitle = staffBlocked
                            ? t("table.actionsNeedResidentMethod" as any)
                            : undefined;

                        return (
                        <tr key={invoice.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-4 text-sm font-medium text-slate-900 dark:text-white">
                                {invoice.number}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {invoice.unit?.number}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {`${invoice.month}/${invoice.year}`}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {invoice.items && invoice.items.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {invoice.items.map((item: any, idx: number) => (
                                            <span
                                                key={idx}
                                                className="inline-block rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap"
                                            >
                                                {item.description}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-slate-400">-</span>
                                )}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-900 dark:text-white font-semibold align-top">
                                <div>{formatPrice(invoice.totalAmount)}</div>
                                {invoiceShowsRecurrenteCardLine(invoice) ? (
                                    <RecurrenteCardFeeInline
                                        baseGtq={Number(invoice.totalAmount)}
                                        config={feeConfig}
                                    />
                                ) : null}
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant={getStatusVariant(invoice.status)}>
                                    {t(`status.${invoice.status}`)}
                                </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm">
                                {(() => {
                                    const method =
                                        invoice.paymentMethod ||
                                        invoice.reservation?.paymentMethod;
                                    const intent = invoice.paymentMethodIntent as
                                        | "CARD"
                                        | "CASH"
                                        | "TRANSFER"
                                        | null
                                        | undefined;
                                    const isPaid = invoice.status === 'PAID';
                                    const isCancelled = invoice.status === 'CANCELLED';
                                    const display =
                                        method ||
                                        (!isPaid && !isCancelled ? intent : null);

                                    if (display && !isCancelled) {
                                        return (
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-sm text-slate-500">
                                                    {display === 'CARD' ? 'credit_card' : display === 'CASH' ? 'payments' : 'account_balance'}
                                                </span>
                                                <span className="text-slate-600 dark:text-slate-400">
                                                    {t(`paymentMethod.${display}` as any)}
                                                    {!method &&
                                                    intent &&
                                                    !requirePaymentMethodBeforePay ? (
                                                        <span className="block text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                                            {t("table.intentPending" as any)}
                                                        </span>
                                                    ) : null}
                                                </span>
                                            </div>
                                        );
                                    }
                                    return <span className="text-slate-400 dark:text-slate-500">-</span>;
                                })()}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {invoice.number?.startsWith('RES-') ? '-' : format(new Date(new Date(invoice.dueDate).getTime() + new Date(invoice.dueDate).getTimezoneOffset() * 60000), 'dd MMM yyyy', { locale: dateLocale })}
                            </td>
                            <td className="py-4 px-4 text-right">
                                <div className="flex flex-col items-end sm:flex-row sm:justify-end gap-2">
                                    {invoice.status === "PAID" && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleDownload(invoice)}
                                            title="Descargar PDF"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                                        </Button>
                                    )}
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => onViewDetail(invoice)}
                                        title={t('actions.view')}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                    </Button>

                                    {canPayRow(invoice.status) &&
                                        onPay &&
                                        requirePaymentMethodBeforePay && (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => onPay(invoice)}
                                                title={t("actions.pay")}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">
                                                    payments
                                                </span>
                                            </Button>
                                        )}

                                    {(invoice.status === "PENDING" || invoice.status === "PROCESSING" || invoice.status === "OVERDUE") && isAdmin && (
                                        <>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => onUpdateStatus(invoice.id, "PAID")}
                                                disabled={staffBlocked}
                                                title={intentGateTitle ?? t('actions.markPaid')}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => onUpdateStatus(invoice.id, "OVERDUE")}
                                                disabled={staffBlocked}
                                                title={intentGateTitle ?? t('actions.markOverdue')}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">cancel</span>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                        );
                    })}
                </tbody>
            </table>
            {invoices.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-500">{t('noInvoices')}</p>
                </div>
            )}
        </div>
    );
}
