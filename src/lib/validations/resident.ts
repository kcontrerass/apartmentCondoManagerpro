import { z } from "zod";

export const residentSchema = z.object({
    userId: z.string().min(1, "El ID de usuario es requerido"),
    unitId: z.string().min(1, "El ID de unidad es requerido"),
    type: z.enum(["OWNER", "TENANT"]).default("TENANT"),
    startDate: z.string().or(z.date()).transform((val) => new Date(val)),
    endDate: z.string().or(z.date()).optional().transform((val) => val ? new Date(val) : undefined),
    emergencyContact: z.object({
        name: z.string().min(1, "Nombre de contacto de emergencia requerido"),
        phone: z.string().min(1, "Teléfono de contacto de emergencia requerido"),
        relation: z.string().min(1, "Parentesco requerido"),
    }).optional(),
});

export type ResidentInput = z.infer<typeof residentSchema>;
