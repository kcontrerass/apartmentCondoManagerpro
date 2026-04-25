/**
 * @module recurrente-card-surcharge
 * Cálculo de ajuste al cobro con tarjeta: ver `resolveRecurrenteFeeConfig` + `recurrente-fee-math`.
 * Las funciones *sync* de abajo usan solo .env/defaults (útil en cliente sin haber hecho fetch al API interno).
 */

import { getDefaultRecurrenteFeeConfigFromEnv } from "@/lib/recurrente-fee-config-env";
import {
    buildRecurrenteCardCheckoutLineItemsWithConfig,
    computeRecurrenteCardAmountsWithConfig,
    hasRecurrenteCardFeeForConfig,
} from "@/lib/recurrente-fee-math";
import { resolveRecurrenteFeeConfig } from "@/lib/recurrente-fee-config";
import type { RecurrenteKeys } from "@/lib/recurrente";
import type { RecurrenteFeeConfig } from "@/lib/recurrente-fee-types";

const syncConfig = () => getDefaultRecurrenteFeeConfigFromEnv();

export async function getRecurrenteFeeConfigForCheckout(
    keys: RecurrenteKeys | null
): Promise<RecurrenteFeeConfig> {
    return resolveRecurrenteFeeConfig(keys);
}

export function hasRecurrenteCardFee(): boolean {
    return hasRecurrenteCardFeeForConfig(syncConfig());
}

export function getRecurrenteFeePctForDisplay(): number {
    return syncConfig().pct;
}

export function getRecurrenteFeeFixedGtqForDisplay(): number {
    return syncConfig().fixedGtq;
}

export function computeRecurrenteCardAmountsFromBaseCents(baseCents: number) {
    return computeRecurrenteCardAmountsWithConfig(baseCents, syncConfig());
}

export function buildRecurrenteCardCheckoutLineItems(
    baseItem: { name: string; currency: string },
    baseCents: number
) {
    return buildRecurrenteCardCheckoutLineItemsWithConfig(baseItem, baseCents, syncConfig());
}

export { computeRecurrenteCardAmountsWithConfig, buildRecurrenteCardCheckoutLineItemsWithConfig };
export type { RecurrenteFeeConfig };
