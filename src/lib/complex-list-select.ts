import type { Prisma } from "@prisma/client";

/**
 * Listado de complejos para APIs públicas del dashboard (selector, etc.).
 * Evita leer columnas recientes (p. ej. `platform_paid_until`) para que el endpoint
 * siga funcionando si la base aún no tiene esa migración aplicada.
 */
export const complexListApiSelect = {
    id: true,
    name: true,
    address: true,
    type: true,
    logoUrl: true,
    bankAccount: true,
    phone: true,
    settings: true,
    createdAt: true,
    updatedAt: true,
    adminId: true,
    _count: {
        select: {
            units: true,
            amenities: true,
        },
    },
} satisfies Prisma.ComplexSelect;

export type ComplexListApiPayload = Prisma.ComplexGetPayload<{
    select: typeof complexListApiSelect;
}>;
