/**
 * Indica si debe mostrarse el desglose de comisión con tarjeta en facturas.
 */
export function invoiceShowsRecurrenteCardLine(invoice: {
    status?: string;
    paymentMethod?: string | null;
    paymentMethodIntent?: string | null;
    reservation?: { paymentMethod?: string | null } | null;
}): boolean {
    if (invoice.status === "CANCELLED") return false;
    const method = invoice.paymentMethod || invoice.reservation?.paymentMethod;
    if (method === "CARD") return true;
    const intent = invoice.paymentMethodIntent;
    if (intent === "CARD" && invoice.status !== "PAID") return true;
    return false;
}
