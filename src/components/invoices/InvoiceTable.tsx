"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslations } from "next-intl";

interface InvoiceTableProps {
    invoices: any[];
    onViewDetail: (invoice: any) => void;
    onUpdateStatus: (id: string, status: string) => void;
    onPay?: (invoice: any) => void;
}

export function InvoiceTable({ invoices, onViewDetail, onUpdateStatus, onPay }: InvoiceTableProps) {
    const t = useTranslations('Invoices');

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "PAID": return "success";
            case "PENDING": return "warning";
            case "OVERDUE": return "error";
            case "CANCELLED": return "neutral";
            default: return "neutral";
        }
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
                            {t('table.total')}
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {t('table.status')}
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
                    {invoices.map((invoice) => (
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
                            <td className="py-4 px-4 text-sm text-slate-900 dark:text-white font-semibold">
                                ${Number(invoice.totalAmount).toFixed(2)}
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant={getStatusVariant(invoice.status)}>
                                    {t(`status.${invoice.status}`)}
                                </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {format(new Date(invoice.dueDate), 'dd MMM yyyy', { locale: es })}
                            </td>
                            <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => onViewDetail(invoice)}
                                        title={t('actions.view')}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                    </Button>

                                    {invoice.status === "PENDING" && onPay && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => onPay(invoice)}
                                            title={t('actions.pay')}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">payments</span>
                                        </Button>
                                    )}

                                    {invoice.status === "PENDING" && !onPay && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => onUpdateStatus(invoice.id, "PAID")}
                                            title={t('actions.markPaid')}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                        </Button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
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
