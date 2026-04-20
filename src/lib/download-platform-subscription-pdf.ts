import {
    generatePlatformSubscriptionReceiptPdf,
    invoiceJsonToPlatformSubscriptionReceiptPdfData,
} from "@/lib/utils/pdf-generator";

/** Número reservado para suscripción a la plataforma (idempotente con paymentId). */
export function isPlatformSubscriptionInvoicePayload(json: {
    category?: string | null;
    number?: string | null;
}): boolean {
    const cat = json.category != null ? String(json.category).toUpperCase() : "";
    if (cat === "PLATFORM_SUBSCRIPTION") return true;
    const num = json.number != null ? String(json.number) : "";
    return num.startsWith("INV-PLAT-");
}

/**
 * Descarga el PDF del comprobante de suscripción a la plataforma.
 * Acepta `category === PLATFORM_SUBSCRIPTION` o número `INV-PLAT-*` (filas previas a migraciones / backfill).
 */
export async function downloadPlatformSubscriptionReceiptPdf(invoiceId: string): Promise<{ error?: string }> {
    const res = await fetch(`/api/invoices/${invoiceId}`);
    const json = await res.json();
    if (!res.ok) {
        return { error: typeof json?.error === "string" ? json.error : "No se pudo cargar el comprobante" };
    }
    if (!isPlatformSubscriptionInvoicePayload(json)) {
        return { error: "Este documento no es un comprobante de suscripción a la plataforma" };
    }
    const data = invoiceJsonToPlatformSubscriptionReceiptPdfData(json);
    generatePlatformSubscriptionReceiptPdf(data);
    return {};
}
