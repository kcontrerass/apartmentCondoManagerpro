import { z } from "zod";
import { AmenityType } from "@prisma/client";

export const operatingHoursSchema = z.object({
    open: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Formato de hora inválido (HH:mm)"),
    close: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Formato de hora inválido (HH:mm)"),
    days: z.array(z.number().min(0).max(6)).optional()
});

export const createAmenitySchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    description: z.string().optional(),
    type: z.nativeEnum(AmenityType),
    requiresPayment: z.boolean().default(false).optional(),
    capacity: z.number().int().positive("La capacidad debe ser un número positivo").optional(),
    operatingHours: operatingHoursSchema.optional(),
    costPerDay: z.number().nonnegative("El costo debe ser 0 o más").optional(),
    costPerHour: z.number().nonnegative("El costo debe ser 0 o más").optional(),
    complexId: z.string().cuid("ID de complejo inválido")
});

export const updateAmenitySchema = createAmenitySchema.omit({ complexId: true }).partial();

export type CreateAmenityInput = z.infer<typeof createAmenitySchema>;
export type UpdateAmenityInput = z.infer<typeof updateAmenitySchema>;
