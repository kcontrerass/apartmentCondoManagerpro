export type RecurrenteFeeConfig = {
    pct: number;
    fixedGtq: number;
    passThrough: boolean;
    source: "fee_rates_url" | "api_account" | "env" | "default";
};
