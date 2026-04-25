"use client";

import { useEffect, useState } from "react";
import type { RecurrenteFeeConfig } from "@/lib/recurrente-fee-types";
import { getDefaultRecurrenteFeeConfigFromEnv } from "@/lib/recurrente-fee-config-env";

/**
 * Misma lógica que en el desglose de pago: tarifas vía API interna o ajustes del entorno.
 */
export function useRecurrenteFeeConfig(
    complexId: string | null | undefined,
    platform?: boolean
): RecurrenteFeeConfig | null {
    const [config, setConfig] = useState<RecurrenteFeeConfig | null>(null);

    useEffect(() => {
        let cancelled = false;
        const qs = new URLSearchParams();
        if (platform) qs.set("platform", "1");
        else if (complexId) qs.set("complexId", complexId);
        const url = `/api/recurrente/fee-rates${qs.toString() ? `?${qs}` : ""}`;
        (async () => {
            try {
                const res = await fetch(url);
                const body = await res.json();
                const c = body?.data?.config as RecurrenteFeeConfig | undefined;
                if (!cancelled && c && (c.pct > 0 || c.fixedGtq > 0) && c.passThrough) {
                    setConfig(c);
                    return;
                }
            } catch {
                /* fallback */
            }
            if (!cancelled) {
                setConfig(getDefaultRecurrenteFeeConfigFromEnv());
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [complexId, platform]);

    return config;
}
