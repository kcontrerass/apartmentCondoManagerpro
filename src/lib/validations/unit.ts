import { z } from "zod";

export const unitSchema = z.object({
    number: z.string().min(1, "El número de unidad es requerido"),
    type: z.string().optional(),
    bedrooms: z.number().int().min(0).default(1),
    bathrooms: z.number().min(0).default(1),
    area: z.number().min(0).optional(),
    status: z.enum(["OCCUPIED", "VACANT", "MAINTENANCE"]).default("VACANT"),
    complexId: z.string().min(1, "El complejo es requerido").optional(),
});

export type UnitInput = z.infer<typeof unitSchema>;
