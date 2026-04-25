import { z } from "zod";

export const unitSchema = z.object({
    number: z.string().min(1, "El número de unidad es requerido"),
    type: z.string().optional(),
    bedrooms: z.number().int().min(0).default(1),
    bathrooms: z.number().min(0).default(1),
    parkingSpots: z.number().int().min(0).default(0),
    area: z.number().min(0).optional(),
    status: z.enum(["OCCUPIED", "VACANT", "MAINTENANCE"]).default("VACANT"),
    complexId: z.string().optional(),
    serviceIds: z.array(z.string()).optional(),
    services: z.array(z.object({
        id: z.string(),
        quantity: z.number().int().min(1).optional(),
    })).optional(),
});

export type UnitInput = z.infer<typeof unitSchema>;

/** Crea varias unidades con los mismos datos (excepto número) en un complejo. */
export const unitBatchCreateSchema = unitSchema
  .omit({ number: true })
  .extend({
    complexId: z.string().min(1, "El complejo es requerido"),
    numbers: z
      .array(z.string().min(1, "Cada número debe tener al menos un carácter"))
      .min(1, "Indica al menos un número de unidad")
      .max(200, "Máximo 200 unidades por lote"),
  });

export type UnitBatchInput = z.infer<typeof unitBatchCreateSchema>;

export const UNIT_BATCH_MAX = 200;

/**
 * Genera nombres de unidad: `{namePrefix}-1`, `{namePrefix}-2`, …
 * (ej. prefijo "A" → A-1, A-2, …).
 */
export function buildUnitNumbersFromPrefix(
  namePrefix: string,
  count: number
): string[] {
  const p = namePrefix.trim();
  if (!p) return [];
  const n = Math.floor(Number(count));
  if (n < 1 || n > UNIT_BATCH_MAX) return [];
  return Array.from({ length: n }, (_, i) => `${p}-${i + 1}`);
}
