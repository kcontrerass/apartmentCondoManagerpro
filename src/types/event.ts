import { Event as PrismaEvent, EventRSVP, RSVPStatus } from '@prisma/client';

/**
 * Event type with relations
 */
export interface Event extends PrismaEvent {
    complex?: {
        id: string;
        name: string;
    };
    _count?: {
        rsvps: number;
    };
}

/**
 * Detailed Event type with RSVPs
 */
export interface EventWithRSVPs extends Event {
    rsvps: (EventRSVP & {
        user?: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    })[];
}

/**
 * Event list item (for tables/cards)
 */
export interface EventListItem {
    id: string;
    title: string;
    description: string;
    eventDate: Date;
    startTime: Date;
    endTime: Date;
    location: string | null;
    imageUrl: string | null;
    _count: {
        rsvps: number;
    };
    complex?: {
        id: string;
        name: string;
    };
}

/**
 * RSVP counts summary
 */
export interface RSVPStats {
    going: number;
    maybe: number;
    not_going: number;
    totalGuests: number;
}

export { RSVPStatus };

export interface EventFilters {
    timeframe?: 'upcoming' | 'past' | 'all';
    limit?: number;
    search?: string;
}
