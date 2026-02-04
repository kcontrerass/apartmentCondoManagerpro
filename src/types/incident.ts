import { Incident as PrismaIncident, IncidentStatus, IncidentPriority, IncidentType } from '@prisma/client';

/**
 * Incident type with basic relations
 */
export interface Incident extends PrismaIncident {
    complex?: {
        id: string;
        name: string;
    };
    reporter?: {
        id: string;
        name: string;
        image: string | null;
    };
    resolver?: {
        id: string;
        name: string;
    } | null;
    unit?: {
        id: string;
        number: string;
    } | null;
}

/**
 * Incident list item (for tables)
 */
export interface IncidentListItem {
    id: string;
    title: string;
    status: IncidentStatus;
    priority: IncidentPriority;
    type: IncidentType;
    createdAt: Date;
    reporterName: string;
    complexName?: string;
    unitNumber?: string | null;
}

/**
 * Input for creating an incident
 */
export interface CreateIncidentInput {
    title: string;
    description: string;
    priority?: IncidentPriority;
    type?: IncidentType;
    complexId: string;
    unitId?: string;
    location?: string;
    imageUrl?: string;
}

/**
 * Input for updating an incident
 */
export interface UpdateIncidentInput {
    status?: IncidentStatus;
    priority?: IncidentPriority;
    type?: IncidentType;
    resolverId?: string;
    location?: string;
}

/**
 * Filters for incidents
 */
export interface IncidentFilters {
    status?: IncidentStatus | 'ALL';
    priority?: IncidentPriority | 'ALL';
    type?: IncidentType | 'ALL';
    search?: string;
    limit?: number;
}

export { IncidentStatus, IncidentPriority, IncidentType };
