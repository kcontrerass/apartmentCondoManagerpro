"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Resident, Unit } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Role } from "@/types/roles";

interface ResidentAirbnbRow extends Resident {
    user: { name: string; email: string; phone: string | null };
    unit: Unit & { complex: { name: string } };
}

export function AirbnbGuestsClient({ userRole }: { userRole: Role }) {
    const t = useTranslations("AirbnbGuests");
    const tCommon = useTranslations("Common");
    const router = useRouter();
    const [rows, setRows] = useState<ResidentAirbnbRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("isAirbnb", "true");
            const q = debouncedSearch.trim();
            if (q) params.set("search", q);
            const res = await fetch(`/api/residents?${params.toString()}`, {
                credentials: "include",
                cache: "no-store",
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setRows(data);
            } else {
                setRows([]);
            }
        } catch {
            setRows([]);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fmtRange = (start: Date | string | null, end: Date | string | null) => {
        if (!start || !end) return "—";
        const a = new Date(start).toLocaleDateString();
        const b = new Date(end).toLocaleDateString();
        return `${a} — ${b}`;
    };

    const subtitle =
        userRole === Role.SUPER_ADMIN ? t("subtitleAllComplexes") : t("subtitle");

    return (
        <div className="space-y-8">
            <PageHeader title={t("title")} subtitle={subtitle} />

            <Card>
                <div className="p-4 space-y-4">
                    <div className="relative max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
                            search
                        </span>
                        <Input
                            type="search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder={t("searchPlaceholder")}
                            className="pl-10"
                            aria-label={t("searchPlaceholder")}
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Spinner />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                                            {t("host")}
                                        </th>
                                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                                            {t("unit")}
                                        </th>
                                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                                            {t("guest")}
                                        </th>
                                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                                            {t("identification")}
                                        </th>
                                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                                            {t("stayPeriod")}
                                        </th>
                                        <th className="py-4 px-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                                            {tCommon("actions")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                    {rows.map((r) => (
                                        <tr
                                            key={r.id}
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                        >
                                            <td className="py-4 px-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900 dark:text-white">
                                                        {r.user.name}
                                                    </span>
                                                    <span className="text-xs text-slate-500">{r.user.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-sm">
                                                <span className="font-medium">{r.unit.number}</span>
                                                <span className="block text-xs text-slate-500">{r.unit.complex.name}</span>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-300">
                                                {r.airbnbGuestName || "—"}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-300 font-mono">
                                                {r.airbnbGuestIdentification || "—"}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {fmtRange(r.airbnbStartDate, r.airbnbEndDate)}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => router.push(`/dashboard/residents/${r.id}`)}
                                                    title={t("viewDetail")}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        visibility
                                                    </span>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {rows.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-slate-500">{t("empty")}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
