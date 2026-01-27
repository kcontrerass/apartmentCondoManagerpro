import { z } from "zod";

export const visitorStatusSchema = z.enum(["SCHEDULED", "ARRIVED", "DEPARTED", "CANCELLED"]);

export const visitorLogSchema = z.object({
    visitorName: z.string().min(2, "El nombre del visitante es requerido"),
    visitorId: z.string().optional(),
    reason: z.string().optional(),
    scheduledDate: z.string().or(z.date()),
    unitId: z.string().min(1, "La unidad es requerida"),
    complexId: z.string().min(1, "El complejo es requerido"),
    status: visitorStatusSchema.default("SCHEDULED"),
});

export type VisitorLogInput = z.infer<typeof visitorLogSchema>;
