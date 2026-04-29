import { z } from "zod";

const UnitServiceStatus = z.enum(["ACTIVE", "INACTIVE"]);

/** Valores típicos desde <select> (strings) o JSON (boolean). */
const booleanLike = z.union([
    z.boolean(),
    z.enum(["true", "false"]).transform((v) => v === "true"),
]);

const optionalBooleanLike = booleanLike.optional();

const defaultQuantityCreate = z.preprocess((val) => {
    if (val === "" || val === undefined || val === null) return undefined;
    const n = typeof val === "number" ? val : Number(val);
    return Number.isFinite(n) ? n : undefined;
}, z.number().int().min(1).optional());

/** Solo mensual en alta/edición desde el portal (la BD puede tener otros valores históricos). */
export const serviceSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    basePrice: z.coerce.number().min(0, "Price must be positive"),
    frequency: z.literal("MONTHLY"),
    isRequired: booleanLike,
    hasQuantity: booleanLike,
    defaultQuantity: defaultQuantityCreate,
    complexId: z.string().min(1, "Complex ID is required"),
});

export const serviceUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    basePrice: z.coerce.number().min(0).optional(),
    frequency: z.literal("MONTHLY").optional(),
    isRequired: optionalBooleanLike,
    hasQuantity: optionalBooleanLike,
    defaultQuantity: z.preprocess((val) => {
        if (val === undefined) return undefined;
        if (val === "" || val === null) return null;
        const n = typeof val === "number" ? val : Number(val);
        if (!Number.isFinite(n)) return undefined;
        return n;
    }, z.number().int().min(1).nullable().optional()),
});

export const assignServiceSchema = z.object({
    serviceId: z.string().min(1, "Service ID is required"),
    customPrice: z.coerce.number().min(0).optional().nullable(),
    quantity: z.number().int().min(1).default(1),
    status: UnitServiceStatus.default("ACTIVE"),
    startDate: z.coerce.date().default(() => new Date()),
    endDate: z.coerce.date().optional().nullable(),
});

export const updateUnitServiceSchema = assignServiceSchema.partial().omit({ serviceId: true });

export type ServiceSchema = z.infer<typeof serviceSchema>;
export type AssignServiceSchema = z.infer<typeof assignServiceSchema>;
