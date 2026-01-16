import { z } from "zod";
import { ComplexType } from "@prisma/client";

export const getComplexTypeVariant = (type: ComplexType) => {
    switch (type) {
        case ComplexType.BUILDING:
            return "primary";
        case ComplexType.CONDO:
            return "warning";
        default:
            return "info";
    }
};

export const ComplexCreateSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
    type: z.nativeEnum(ComplexType).default(ComplexType.BUILDING),
    logoUrl: z.string().url("URL de logo inválida").or(z.literal("")).optional().nullable(),
    settings: z.record(z.string(), z.any()).optional().nullable(),
    adminId: z.string().min(1, "El administrador es obligatorio"),
});

export const ComplexUpdateSchema = ComplexCreateSchema.partial();

export type ComplexCreateInput = z.infer<typeof ComplexCreateSchema>;
export type ComplexUpdateInput = z.infer<typeof ComplexUpdateSchema>;
