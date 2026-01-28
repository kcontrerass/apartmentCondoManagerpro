import { z } from "zod";

export const invoiceStatusSchema = z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED", "PROCESSING"]);

export const updateInvoiceSchema = z.object({
    status: invoiceStatusSchema,
});

export const generateInvoicesSchema = z.object({
    complexId: z.string().min(1, "Complex ID is required"),
    month: z.number().min(1).max(12),
    year: z.number().min(2024),
    dueDate: z.date().or(z.string()),
});

export type UpdateInvoiceSchema = z.infer<typeof updateInvoiceSchema>;
export type GenerateInvoicesSchema = z.infer<typeof generateInvoicesSchema>;
