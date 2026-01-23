import { z } from "zod";

export const unitSchema = z.object({
    number: z.string().min(1, "El número de unidad es requerido"),
    type: z.string().optional(),
    bedrooms: z.number().int().min(0).default(1),
    bathrooms: z.number().min(0).default(1),
    parkingSpots: z.number().int().min(0).default(0),
    area: z.number().min(0).optional(),
    status: z.enum(["OCCUPIED", "VACANT", "MAINTENANCE"]).default("VACANT"),
    complexId: z.string().min(1, "El complejo es requerido").optional(),
    serviceIds: z.array(z.string()).optional(),
    services: z.array(z.object({
        id: z.string(),
        quantity: z.number().int().min(1).optional(),
    })).optional(),
});

export type UnitInput = z.infer<typeof unitSchema>;
