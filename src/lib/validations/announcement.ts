import { z } from 'zod';

const userRoleEnum = z.enum(['SUPER_ADMIN', 'ADMIN', 'BOARD_OF_DIRECTORS', 'GUARD', 'RESIDENT']);
const announcementPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

/**
 * Base schema for an announcement
 */
export const announcementBaseSchema = z.object({
    complexId: z.string(),
    title: z.string()
        .min(3, 'El título debe tener al menos 3 caracteres')
        .max(200, 'El título no puede exceder 200 caracteres'),
    content: z.string()
        .min(10, 'El contenido debe tener al menos 10 caracteres'),
    priority: announcementPriorityEnum,
    targetRoles: z.union([z.array(userRoleEnum), userRoleEnum, z.string(), z.any()]).optional().nullable(),
    imageUrl: z.string().url('URL de imagen inválida').optional().nullable().or(z.literal('')),
    publishedAt: z.string().optional().nullable().or(z.literal('')),
    expiresAt: z.string().optional().nullable().or(z.literal('')),
});

/**
 * Schema for creating an announcement
 */
export const announcementCreateSchema = announcementBaseSchema.refine((data) => {
    // Validate that expiresAt is after publishedAt if both are provided
    if (data.publishedAt && data.expiresAt) {
        return new Date(data.expiresAt) > new Date(data.publishedAt);
    }
    return true;
}, {
    message: 'La fecha de expiración debe ser posterior a la fecha de publicación',
    path: ['expiresAt'],
});

/**
 * Schema for updating an announcement
 */
export const announcementUpdateSchema = announcementBaseSchema.partial().refine((data) => {
    if (data.publishedAt && data.expiresAt) {
        return new Date(data.expiresAt) > new Date(data.publishedAt);
    }
    return true;
}, {
    message: 'La fecha de expiración debe ser posterior a la fecha de publicación',
    path: ['expiresAt'],
});

export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;
export type AnnouncementUpdateInput = z.infer<typeof announcementUpdateSchema>;
