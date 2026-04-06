import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    // Sello de Estado (Badge Elegante)
    const isPaid = data.status === 'PAID';
    const statusLabel = isPaid ? 'COMPROBANTE PAGADO' : 'PENDIENTE DE PAGO';
    const statusColor = isPaid ? [22, 163, 74] : [220, 38, 38];

    doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, finalY, 60, 10, 2, 2, 'D');
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFontSize(8);
    doc.text(statusLabel, 44, finalY + 6.5, { align: 'center' });

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
