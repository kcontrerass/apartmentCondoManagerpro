import { z } from 'zod';
import { IncidentStatus, IncidentPriority, IncidentType } from '@prisma/client';

export const incidentSchema = z.object({
    title: z.string().min(5, 'El título debe tener al menos 5 caracteres').max(100),
    description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
    priority: z.nativeEnum(IncidentPriority).optional(),
    type: z.nativeEnum(IncidentType).optional(),
    complexId: z.string().min(1, 'El complejo es requerido'),
    unitId: z.string().optional(),
    location: z.string().optional(),
    imageUrl: z.string().url('URL de imagen inválida').optional().or(z.literal('')),
});

export const updateIncidentSchema = z.object({
    status: z.nativeEnum(IncidentStatus).optional(),
    priority: z.nativeEnum(IncidentPriority).optional(),
    type: z.nativeEnum(IncidentType).optional(),
    resolverId: z.string().optional(),
    location: z.string().optional(),
});
