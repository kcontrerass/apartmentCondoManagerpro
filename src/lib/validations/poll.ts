import { z } from 'zod';

export const pollSchema = z.object({
    title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100),
    description: z.string().max(500).optional(),
    complexId: z.string().min(1, 'El complejo es requerido'),
    expiresAt: z.string().optional().nullable(),
    options: z.array(z.string().min(1, 'La opción no puede estar vacía')).min(2, 'Debe haber al menos 2 opciones'),
});

export type CreatePollInput = z.infer<typeof pollSchema>;
