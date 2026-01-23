import { z } from "zod";

const ServiceFrequency = z.enum(["ONCE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
const UnitServiceStatus = z.enum(["ACTIVE", "INACTIVE"]);

export const serviceSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    basePrice: z.coerce.number().min(0, "Price must be positive"),
    frequency: ServiceFrequency.default("MONTHLY"),
    isRequired: z.boolean().default(false),
    hasQuantity: z.boolean().default(false),
    complexId: z.string().min(1, "Complex ID is required"),
});

export const serviceUpdateSchema = serviceSchema.partial().omit({ complexId: true });

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
