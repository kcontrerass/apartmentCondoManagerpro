import { z } from "zod";
import { UserStatus } from "@prisma/client";
import { Role } from "@/types/roles";

export const staffCreateSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Correo electrónico inválido"),
    phone: z.string().optional(),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    role: z.nativeEnum(Role),
    complexId: z.string().optional().nullable().or(z.literal("")),
});

export const staffUpdateSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
    phone: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(UserStatus).optional(),
    complexId: z.string().cuid("Complejo inválido").optional().nullable(),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
});

export type StaffCreateData = z.infer<typeof staffCreateSchema>;
export type StaffUpdateData = z.infer<typeof staffUpdateSchema>;
