"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { Role } from "@/types/roles";
import { motion } from "framer-motion";
import { useRecurrenteFeeConfig } from "@/hooks/useRecurrenteFeeConfig";
import { RecurrenteCardFeeInline } from "@/components/payments/RecurrenteCardFeeInline";
import { invoiceShowsRecurrenteCardLine } from "@/lib/invoice-recurrente-card";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

interface ResidentDashboardProps {
    data: {
        resident: any;
        complexSettings?: any;
        pendingInvoices: any[];
        /** Identificador de complejo para tarifas de comisión con tarjeta. */
        cardFeeComplexId?: string | null;
        upcomingReservations: any[];
        recentIncidents: any[];
        activities: any[];
        activePolls: any[];
    };
}

export function ResidentDashboard({ data }: ResidentDashboardProps) {
    const t = useTranslations("Dashboard");
    const {
        resident,
        complexSettings,
        pendingInvoices,
        cardFeeComplexId,
        upcomingReservations,
        recentIncidents,
        activities,
        activePolls,
    } = data;
    const cardFeeConfig = useRecurrenteFeeConfig(cardFeeComplexId ?? null);

    const hasPermission = (module: string) => {
        // Resident role is always 'RESIDENT'
        const permissions = complexSettings?.permissions?.[Role.RESIDENT];
        if (!permissions) return true; // Default true if no config
        return permissions[module] !== false; // Explicit false hides it
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Unit Details */}
                <motion.div variants={item}>
                    <Card className="p-6 border-l-4 border-indigo-500 h-full">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                <span className="material-symbols-outlined text-indigo-600">home</span>
                            </div>
                            <h3 className="font-bold text-lg">{t("residentDashboard.myUnit")}</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p className="flex justify-between">
                                <span className="text-slate-500">{t("residentDashboard.unitNumber")}:</span>
                                <span className="font-medium">{resident.unit.number}</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-slate-500">{t("residentDashboard.complex")}:</span>
                                <span className="font-medium">{resident.unit.complex.name}</span>
                            </p>
                            <p className="flex justify-between">
                                <span className="text-slate-500">{t("residentDashboard.type")}:</span>
                                <span className="font-medium">{resident.type}</span>
                            </p>
                        </div>
                    </Card>
                </motion.div>

                {/* Next Payment */}
                {hasPermission('invoices') && (
                    <motion.div variants={item}>
                        <Card className="p-6 border-l-4 border-emerald-500 h-full">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <span className="material-symbols-outlined text-emerald-600">payments</span>
                                </div>
                                <h3 className="font-bold text-lg">{t("residentDashboard.nextPayment")}</h3>
                            </div>
                            {pendingInvoices.length > 0 ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {formatPrice(pendingInvoices[0].totalAmount)}
                                        </p>
                                        {invoiceShowsRecurrenteCardLine(pendingInvoices[0]) ? (
                                            <RecurrenteCardFeeInline
                                                baseGtq={Number(pendingInvoices[0].totalAmount)}
                                                config={cardFeeConfig}
                                                className="text-left"
                                            />
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {t("residentDashboard.dueOn")}: {format(new Date(pendingInvoices[0].dueDate), "dd MMM", { locale: es })}
                                    </p>
                                    <Link href="/dashboard/invoices">
                                        <Button size="sm" className="w-full mt-2" variant="primary">
                                            {t("residentDashboard.payNow")}
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <p className="text-sm text-emerald-600 font-medium py-4">
                                    {t("residentDashboard.allClear")}
                                </p>
                            )}
                        </Card>
                    </motion.div>
                )}

                {/* Next Reservation */}
                {hasPermission('reservations') && (
                    <motion.div variants={item}>
                        <Card className="p-6 border-l-4 border-amber-500 h-full">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                    <span className="material-symbols-outlined text-amber-600">event_available</span>
                                </div>
                                <h3 className="font-bold text-lg">{t("residentDashboard.myReservations")}</h3>
                            </div>
                            {upcomingReservations.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                                                {upcomingReservations[0].amenity.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {format(new Date(upcomingReservations[0].startTime), "PPp", { locale: es })}
                                            </p>
                                        </div>
                                        <Badge variant={upcomingReservations[0].status === 'APPROVED' ? 'success' : 'warning'}>
                                            {upcomingReservations[0].status}
                                        </Badge>
                                    </div>
                                    <Link href="/dashboard/reservations">
                                        <Button size="sm" className="w-full mt-2" variant="secondary">
                                            {t("residentDashboard.viewAll")}
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="py-2">
                                    <p className="text-sm text-slate-500 mb-3">{t("residentDashboard.noReservations")}</p>
                                    <Link href="/dashboard/amenities">
                                        <Button size="sm" className="w-full" variant="outline">
                                            {t("residentDashboard.bookAmenity")}
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}
            </motion.div>

            {/* Quick Actions / More Info */}
            <motion.div variants={container} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {hasPermission('invoices') && (
                    <motion.div variants={item}>
                        <Card className="p-6 h-full">
                            <h3 className="font-bold mb-4">{t("residentDashboard.recentInvoices")}</h3>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {pendingInvoices.map((inv) => (
                                    <div key={inv.id} className="py-3 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-sm">{inv.number}</p>
                                            <p className="text-xs text-slate-500">{inv.month}/{inv.year}</p>
                                        </div>
                                        <div className="text-right max-w-[min(100%,14rem)] ml-auto">
                                            <p className="font-bold text-sm">{formatPrice(inv.totalAmount)}</p>
                                            {invoiceShowsRecurrenteCardLine(inv) ? (
                                                <RecurrenteCardFeeInline
                                                    baseGtq={Number(inv.totalAmount)}
                                                    config={cardFeeConfig}
                                                    className="text-right"
                                                />
                                            ) : null}
                                            <div className="flex flex-col items-end gap-1">
                                                <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>{inv.status}</Badge>
                                                {(() => {
                                                    const pm =
                                                        inv.paymentMethod ||
                                                        inv.paymentMethodIntent;
                                                    if (!pm) return null;
                                                    return (
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                                        <span className="material-symbols-outlined text-xs">
                                                            {pm === 'CARD' ? 'credit_card' : pm === 'CASH' ? 'payments' : 'account_balance'}
                                                        </span>
                                                        <span>{pm}</span>
                                                    </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {pendingInvoices.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No hay facturas pendientes.</p>}
                        </Card>
                    </motion.div>
                )}

                <motion.div variants={container} className="space-y-6 flex-1 w-full lg:min-w-[50%]">
                    {hasPermission('incidents') && (
                        <motion.div variants={item}>
                            <Card className="p-6">
                                <h3 className="font-bold mb-4">Reportes e Incidentes</h3>
                                <p className="text-sm text-slate-500 mb-4">Informa sobre cualquier problema técnico o de seguridad en el complejo.</p>
                                <div className="space-y-3 mb-4">
                                    {recentIncidents.map((inc: any) => (
                                        <Link key={inc.id} href={`/dashboard/incidents/${inc.id}`} className="block border-b border-slate-50 dark:border-slate-800 pb-2 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors px-1 rounded">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs font-bold truncate pr-2">{inc.title}</p>
                                                <Badge variant={inc.status === 'RESOLVED' ? 'success' : 'warning'} className="scale-75 origin-right">
                                                    {inc.status}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-slate-400">
                                                {format(new Date(inc.createdAt), "d MMM", { locale: es })}
                                            </p>
                                        </Link>
                                    ))}
                                    {recentIncidents.length === 0 && (
                                        <p className="text-xs text-slate-400 italic">No tienes reportes recientes.</p>
                                    )}
                                </div>
                                <Link href="/dashboard/incidents">
                                    <Button variant="outline" className="w-full" icon="report">
                                        Nuevo Reporte
                                    </Button>
                                </Link>
                            </Card>
                        </motion.div>
                    )}

                    {hasPermission('polls') && activePolls?.length > 0 && (
                        <motion.div variants={item}>
                            <Card className="p-6 border-l-4 border-primary">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">ballot</span>
                                    Votaciones Pendientes
                                </h3>
                                <div className="space-y-4 mb-4">
                                    {activePolls.map((poll: any) => (
                                        <div key={poll.id} className="bg-slate-50 dark:bg-background-dark/50 p-3 rounded-xl">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{poll.title}</p>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                                {poll._count.votes} votos registrados
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <Link href="/dashboard/polls">
                                    <Button className="w-full" variant="primary">
                                        Ir a Votar
                                    </Button>
                                </Link>
                            </Card>
                        </motion.div>
                    )}

                    {hasPermission('accessControl') && (
                        <motion.div variants={item}>
                            <Card className="p-6">
                                <h3 className="font-bold mb-4">Control de Acceso</h3>
                                <p className="text-sm text-slate-500 mb-4">Registra tus visitas programadas para agilizar su ingreso al complejo.</p>
                                <Link href="/dashboard/access-control">
                                    <Button variant="outline" className="w-full" icon="add_card">
                                        Registrar Visita
                                    </Button>
                                </Link>
                            </Card>
                        </motion.div>
                    )}

                    <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
                        <ActivityTable activities={activities} />
                    </motion.div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
