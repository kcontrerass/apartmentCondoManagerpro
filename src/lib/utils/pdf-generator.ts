import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { computeRecurrenteCardAmountsWithConfig } from "@/lib/recurrente-fee-math";
import type { RecurrenteFeeConfig } from "@/lib/recurrente-fee-types";
import { getDefaultRecurrenteFeeConfigFromEnv } from "@/lib/recurrente-fee-config-env";

export interface PdfCardRecurrenteDetail {
    pct: number;
    fixedGtq: number;
    netSubtotal: number;
    surcharge: number;
    totalCharged: number;
}

/** Comisión con tarjeta en PDF (misma fórmula que en la UI). */
export function buildCardRecurrenteDetailForInvoicePdf(
    totalNetGtq: number,
    paymentMethod: string | null | undefined,
    reservationPaymentMethod: string | null | undefined,
    config: RecurrenteFeeConfig | null | undefined
): PdfCardRecurrenteDetail | undefined {
    const method = paymentMethod || reservationPaymentMethod;
    if (method !== "CARD" || !config) return undefined;
    const split = computeRecurrenteCardAmountsWithConfig(
        Math.round(totalNetGtq * 100),
        config
    );
    if (split.surchargeCents <= 0) return undefined;
    return {
        pct: config.pct,
        fixedGtq: config.fixedGtq,
        netSubtotal: split.baseCents / 100,
        surcharge: split.surchargeCents / 100,
        totalCharged: split.totalCents / 100,
    };
}

function formatGtqPdf(n: number) {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Desglose de comisión con tarjeta (texto neutro, sin marca de pasarela). */
function drawPdfCardRecurrenteBlock(
    doc: any,
    pageWidth: number,
    yStart: number,
    cr: PdfCardRecurrenteDetail
): void {
    let y = yStart;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    doc.text("Pago con tarjeta (estimado)", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7.5);
    const cardLines = doc.splitTextToSize(
        `~${cr.pct}% + Q${formatGtqPdf(cr.fixedGtq)} fijos. Factura: Q${formatGtqPdf(cr.netSubtotal)}. Comision: Q${formatGtqPdf(cr.surcharge)}. Total: Q${formatGtqPdf(cr.totalCharged)}.`,
        pageWidth - 28
    ) as string[];
    doc.text(cardLines, 14, y);
}

interface PDFData {
    invoiceNumber: string;
    date: string;
    dueDate: string;
    residentName: string;
    unitNumber: string;
    complexName: string;
    complexAddress: string;
    items: { description: string; amount: number }[];
    total: number;
    status: string;
    bankAccount?: string;
    /** Pago con tarjeta: comisión / ajuste (misma lógica que en la app). */
    cardRecurrente?: PdfCardRecurrenteDetail;
}

export const generateInvoicePDF = (data: PDFData) => {
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // -- Background Sello de Agua (Watermark) --
    if (data.status === 'PAID') {
        doc.setTextColor(240, 240, 240);
        doc.setFontSize(60);
        doc.setFont('helvetica', 'bold');
        doc.text('PAGADO', pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    }

    // -- Header Principal --
    // Fondo de Cabecera (Subtle Gradient effect imitation)
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo / Icono del Complejo
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(14, 10, 16, 16, 4, 4, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(data.complexName.substring(0, 1), 20, 21);

    // Nombre del Complejo (Título Principal)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(data.complexName, 36, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(data.complexAddress || 'Administración Residencial', 36, 23);

    // Etiqueta de Recibo
    doc.setFontSize(28);
    doc.text('RECIBO', pageWidth - 14, 25, { align: 'right' });
    doc.setFontSize(10);
    doc.text(`NÚMERO: ${data.invoiceNumber}`, pageWidth - 14, 32, { align: 'right' });

    // -- Info de Cliente y Fechas --
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 14, 55);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFontSize(12);
    doc.text(data.residentName, 14, 63);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.setFontSize(9);
    doc.text(`Unidad: ${data.unitNumber}`, 14, 69);

    // Panel de Fechas (Caja derecha)
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.roundedRect(pageWidth - 80, 50, 66, 22, 2, 2, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.text('FECHA EMISIÓN:', pageWidth - 76, 58);
    doc.text(data.date, pageWidth - 18, 58, { align: 'right' });
    doc.text('FECHA VENCIMIENTO:', pageWidth - 76, 66);
    doc.text(data.dueDate, pageWidth - 18, 66, { align: 'right' });

    // -- Tabla de Conceptos --
    const tableBody = data.items.map(item => [
        item.description,
        `Q ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
        startY: 85,
        head: [['CONCEPTO / DESCRIPCIÓN', 'TOTAL']],
        body: tableBody,
        theme: 'grid',
        headStyles: { 
            fillColor: [30, 41, 59], // Slate 800
            fontSize: 9, 
            fontStyle: 'bold',
            halign: 'center'
        },
        styles: { 
            fontSize: 9, 
            cellPadding: 5,
            lineColor: [226, 232, 240] // Slate 200
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { halign: 'right', fontStyle: 'bold', cellWidth: 40 }
        }
    });

    // -- Totales y Resumen --
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Caja de Total
    doc.setFillColor(15, 23, 42);
    doc.rect(pageWidth - 70, finalY, 56, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', pageWidth - 65, finalY + 8);
    doc.text(`Q ${data.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 18, finalY + 8, { align: 'right' });

    // Sello de Estado (Badge Elegante) — misma fila que el total
    const isPaid = data.status === 'PAID';
    const statusLabel = isPaid ? 'COMPROBANTE PAGADO' : 'PENDIENTE DE PAGO';
    const statusColor = isPaid ? [22, 163, 74] : [220, 38, 38];

    doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, finalY, 60, 10, 2, 2, 'D');
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFontSize(8);
    doc.text(statusLabel, 44, finalY + 6.5, { align: 'center' });

    if (data.cardRecurrente) {
        drawPdfCardRecurrenteBlock(doc, pageWidth, finalY + 14, data.cardRecurrente);
    }

    // -- Firmas y Footer --
    const footerY = pageHeight - 50;

    // Líneas de firmas
    doc.setDrawColor(203, 213, 225); // Slate 300
    doc.setLineWidth(0.2);
    doc.line(30, footerY, 80, footerY);
    doc.line(pageWidth - 80, footerY, pageWidth - 30, footerY);

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('ADMINISTRACIÓN', 55, footerY + 5, { align: 'center' });
    doc.text('RESIDENTE', pageWidth - 55, footerY + 5, { align: 'center' });

    // Información Bancaria
    if (data.bankAccount) {
        doc.setFontSize(7);
        doc.text('INFORMACIÓN DE PAGO:', 14, footerY + 20);
        doc.setFont('helvetica', 'bold');
        doc.text(data.bankAccount, 14, footerY + 24);
    }

    // Marca de agua pequeña de powered by
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(203, 213, 225);
    doc.text('Documento generado digitalmente por ADESSO-365 PropTech Solutions', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save PDF
    doc.save(`Recibo_${data.invoiceNumber}.pdf`);
};

/** Comprobante PDF solo para suscripción a la plataforma (facturado al complejo). */
export interface PlatformSubscriptionReceiptPdfData {
    invoiceNumber: string;
    complexName: string;
    complexAddress: string;
    /** Fecha de emisión (texto ya formateado) */
    issuedAt: string;
    /** Periodo factura ej. "3 / 2026" */
    periodLabel: string;
    dueDate: string;
    /** Fecha real del pago (incluye mes); "—" si no hay dato */
    paidAtLabel: string;
    items: { description: string; amount: number }[];
    total: number;
    paymentMethodLabel: string;
    cardRecurrente?: PdfCardRecurrenteDetail;
}

export function invoiceJsonToPlatformSubscriptionReceiptPdfData(
    invoice: {
        number: string;
        month: number;
        year: number;
        dueDate: string;
        createdAt: string;
        updatedAt?: string;
        status?: string;
        totalAmount: unknown;
        paymentMethod?: string | null;
        category?: string;
        complex?: { name?: string | null; address?: string | null } | null;
        items?: { description: string; amount: unknown }[];
        platformFeePayment?: { paidAt?: string | Date | null } | null;
    },
    feeConfig?: RecurrenteFeeConfig | null
): PlatformSubscriptionReceiptPdfData {
    const total = Number(invoice.totalAmount);
    const items =
        invoice.items?.map((it) => ({
            description: it.description,
            amount: Number(it.amount),
        })) ?? [];
    const pm = invoice.paymentMethod ?? "";
    let paymentMethodLabel = pm;
    if (pm === "CARD") paymentMethodLabel = "Tarjeta";
    else if (pm === "TRANSFER" || pm === "CASH") paymentMethodLabel = pm === "TRANSFER" ? "Transferencia bancaria" : "Efectivo";

    const issued = new Date(invoice.createdAt);
    const due = new Date(invoice.dueDate);

    const paidRaw =
        invoice.platformFeePayment?.paidAt != null
            ? new Date(invoice.platformFeePayment.paidAt as string | Date)
            : invoice.status === "PAID" && invoice.updatedAt
              ? new Date(invoice.updatedAt)
              : null;
    const paidAtLabel = paidRaw && !Number.isNaN(paidRaw.getTime())
        ? paidRaw.toLocaleDateString("es-GT", {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : "—";

    const cfg = feeConfig ?? getDefaultRecurrenteFeeConfigFromEnv();
    const cardRecurrente = buildCardRecurrenteDetailForInvoicePdf(
        Number.isFinite(total) ? total : 0,
        pm,
        undefined,
        cfg
    );

    return {
        invoiceNumber: invoice.number,
        complexName: invoice.complex?.name ?? "Complejo",
        complexAddress: invoice.complex?.address ?? "",
        issuedAt: issued.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" }),
        periodLabel: `${invoice.month} / ${invoice.year}`,
        dueDate: due.toLocaleDateString("es-GT", { day: "2-digit", month: "short", year: "numeric" }),
        paidAtLabel,
        items,
        total: Number.isFinite(total) ? total : 0,
        paymentMethodLabel,
        cardRecurrente,
    };
}

export function generatePlatformSubscriptionReceiptPdf(data: PlatformSubscriptionReceiptPdfData) {
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setTextColor(240, 240, 240);
    doc.setFontSize(52);
    doc.setFont("helvetica", "bold");
    doc.text("PAGADO", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 42, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("ADESSO-365", 14, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Comprobante de suscripción — uso del software", 14, 20);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("COMPROBANTE", pageWidth - 14, 18, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`No. ${data.invoiceNumber}`, pageWidth - 14, 26, { align: "right" });

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("FACTURADO AL COMPLEJO", 14, 54);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(data.complexName, 14, 62);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const addr = data.complexAddress?.trim() || "—";
    const addrLines = doc.splitTextToSize(addr, pageWidth - 28);
    doc.text(addrLines, 14, 68);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(pageWidth - 80, 50, 66, 36, 2, 2, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.text("EMISIÓN:", pageWidth - 76, 56);
    doc.text(data.issuedAt, pageWidth - 18, 56, { align: "right" });
    doc.text("PERIODO:", pageWidth - 76, 63);
    doc.text(data.periodLabel, pageWidth - 18, 63, { align: "right" });
    doc.text("VENCIMIENTO:", pageWidth - 76, 70);
    doc.text(data.dueDate, pageWidth - 18, 70, { align: "right" });
    doc.text("FECHA DE PAGO:", pageWidth - 76, 77);
    doc.text(data.paidAtLabel, pageWidth - 18, 77, { align: "right" });

    const tableStartY = 92 + (addrLines.length > 2 ? 6 : 0);
    const tableBody = data.items.map((item) => [
        item.description,
        `Q ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
        startY: tableStartY,
        head: [["CONCEPTO", "MONTO"]],
        body: tableBody.length ? tableBody : [["Suscripción plataforma", `Q ${data.total.toFixed(2)}`]],
        theme: "grid",
        headStyles: {
            fillColor: [30, 41, 59],
            fontSize: 9,
            fontStyle: "bold",
            halign: "center",
        },
        styles: { fontSize: 9, cellPadding: 5, lineColor: [226, 232, 240] },
        columnStyles: {
            0: { cellWidth: "auto" },
            1: { halign: "right", fontStyle: "bold", cellWidth: 40 },
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");
    doc.text(`Medio de pago: ${data.paymentMethodLabel}`, 14, finalY);

    doc.setFillColor(15, 23, 42);
    doc.rect(pageWidth - 70, finalY + 4, 56, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", pageWidth - 65, finalY + 12);
    doc.text(
        `Q ${data.total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pageWidth - 18,
        finalY + 12,
        { align: "right" }
    );

    if (data.cardRecurrente) {
        drawPdfCardRecurrenteBlock(doc, pageWidth, finalY + 18, data.cardRecurrente);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
        "Copia válida para archivo del complejo y del operador de la plataforma.",
        pageWidth / 2,
        pageHeight - 22,
        { align: "center" }
    );
    doc.setFontSize(6);
    doc.setTextColor(203, 213, 225);
    doc.text("Documento generado digitalmente — ADESSO-365", pageWidth / 2, pageHeight - 12, { align: "center" });

    doc.save(`Comprobante_suscripcion_${data.invoiceNumber}.pdf`);
}
