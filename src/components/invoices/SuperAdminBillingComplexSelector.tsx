"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Role } from "@/types/roles";
import { cn } from "@/lib/utils";

type ComplexOpt = { id: string; name: string };

interface SuperAdminBillingComplexSelectorProps {
    userRole?: string | null;
    initialComplexId?: string | null;
    onScopeSaved?: () => void;
}

/** Selector de complejo solo para la vista de cobros (facturas a residentes). */
export function SuperAdminBillingComplexSelector({
    userRole,
    initialComplexId,
    onScopeSaved,
}: SuperAdminBillingComplexSelectorProps) {
    const t = useTranslations("Invoices.billingScope");
    const [isPending, startTransition] = useTransition();
    const [complexes, setComplexes] = useState<ComplexOpt[]>([]);
    const [value, setValue] = useState<string>(initialComplexId ?? "");
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setValue(initialComplexId ?? "");
    }, [initialComplexId]);

    useEffect(() => {
        if (userRole !== Role.SUPER_ADMIN) return;
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch("/api/complexes");
                const data = await res.json();
                if (!cancelled && res.ok && Array.isArray(data)) {
                    setComplexes(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
                }
            } catch {
                /* ignore */
            } finally {
                if (!cancelled) setLoaded(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [userRole]);

    if (userRole !== Role.SUPER_ADMIN) return null;

    const onChange = (next: string) => {
        setValue(next);
        startTransition(async () => {
            try {
                const res = await fetch("/api/users/super-admin-scope", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ complexId: next === "" ? null : next }),
                });
                if (res.ok) onScopeSaved?.();
            } catch {
                /* ignore */
            }
        });
    };

    return (
        <div
            className={cn(
                "flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0 max-w-full sm:max-w-[320px]",
                !loaded && "opacity-70"
            )}
            title={t("hint")}
        >
            <span className="material-symbols-outlined text-slate-500 shrink-0 text-[20px]" aria-hidden>
                domain
            </span>
            <select
                value={value}
                disabled={isPending}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "flex-1 min-w-0 text-sm rounded-lg border border-card-border bg-background text-foreground py-2 pl-2 pr-8",
                    "focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary",
                    isPending && "opacity-60"
                )}
                aria-label={t("label")}
            >
                <option value="">{t("allComplexes")}</option>
                {complexes.map((c) => (
                    <option key={c.id} value={c.id}>
                        {c.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
