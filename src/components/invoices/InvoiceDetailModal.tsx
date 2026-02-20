"use client";

import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatPrice } from "@/lib/utils";

interface InvoiceDetailModalProps {
    invoice: any;
}

export function InvoiceDetailModal({ invoice }: InvoiceDetailModalProps) {
    const t = useTranslations('Invoices.detail');

    if (!invoice) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {invoice.number}
                    </h3>
                    <p className="text-sm text-slate-500">
                        Periodo: {invoice.month}/{invoice.year}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Vencimiento
                    </p>
                    <p className="text-sm text-slate-500">
                        {invoice.number?.startsWith('RES-') ? '-' : format(new Date(invoice.dueDate), 'dd MMM yyyy', { locale: es })}
                    </p>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    {t('client')}
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                        Unidad: <span className="font-medium">{invoice.unit?.number}</span>
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                        Complejo: <span className="font-medium">{invoice.complex?.name}</span>
                    </p>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                    {t('items')}
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="py-2 px-3 font-medium text-slate-700 dark:text-slate-300">{t('description')}</th>
                                <th className="py-2 px-3 text-right font-medium text-slate-700 dark:text-slate-300">{t('amount')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {invoice.items?.map((item: any) => (
                                <tr key={item.id}>
                                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{item.description}</td>
                                    <td className="py-2 px-3 text-right text-slate-900 dark:text-white">{formatPrice(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50/50 dark:bg-slate-800/30 font-bold">
                            <tr>
                                <td className="py-2 px-3 text-slate-900 dark:text-white">{t('total')}</td>
                                <td className="py-2 px-3 text-right text-slate-primary">{formatPrice(invoice.totalAmount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
