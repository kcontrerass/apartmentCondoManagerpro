import { z } from 'zod';

/**
 * Base schema for an event
 */
export const eventBaseSchema = z.object({
    complexId: z.string().cuid('ID de complejo inválido'),
    title: z.string()
        .min(3, 'El título debe tener al menos 3 caracteres')
        .max(200, 'El título no puede exceder 200 caracteres'),
    description: z.string()
        .min(10, 'La descripción debe tener al menos 10 caracteres'),
    location: z.string().optional().or(z.literal('')),
    eventDate: z.string().min(1, 'Fecha del evento es requerida'),
    startTime: z.string().min(1, 'Hora de inicio es requerida'),
    endTime: z.string().min(1, 'Hora de fin es requerida'),
    imageUrl: z.string().url('URL de imagen inválida').optional().or(z.literal('')).nullable(),
    maxAttendees: z.union([z.number().int().min(1), z.nan(), z.null(), z.undefined()])
        .transform(v => (v === undefined || v === null || (typeof v === 'number' && isNaN(v))) ? null : v)
        .optional(),
});

/**
 * Schema for creating an event
 */
export const eventCreateSchema = eventBaseSchema.refine((data) => {
    // Validate that endTime is after startTime
    return new Date(data.endTime) > new Date(data.startTime);
}, {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['endTime'],
});

/**
 * Schema for updating an event
 */
export const eventUpdateSchema = eventBaseSchema.partial().refine((data) => {
    // Validate that endTime is after startTime if both are provided
    if (data.startTime && data.endTime) {
        return new Date(data.endTime) > new Date(data.startTime);
    }
    return true;
}, {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['endTime'],
});

/**
 * RSVP Status Enum
 */
export const rsvpStatusEnum = z.enum(['GOING', 'NOT_GOING', 'MAYBE']);

/**
 * Schema for RSVP creation/update
 */
export const rsvpSchema = z.object({
    status: rsvpStatusEnum,
    guests: z.number().int().min(0, 'El número de invitados no puede ser negativo').default(0),
});

/**
 * Type exports
 */
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
export type RSVPInput = z.infer<typeof rsvpSchema>;
export type RSVPStatus = z.infer<typeof rsvpStatusEnum>;
