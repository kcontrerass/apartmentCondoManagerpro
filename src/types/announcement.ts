import { Announcement as PrismaAnnouncement, AnnouncementPriority } from '@prisma/client';

/**
 * Announcement type with relations
 */
export interface Announcement extends PrismaAnnouncement {
    complex?: {
        id: string;
        name: string;
    };
}

/**
 * Announcement list item (for tables)
 */
export interface AnnouncementListItem {
    id: string;
    title: string;
    priority: AnnouncementPriority;
    publishedAt: Date | null;
    expiresAt: Date | null;
    authorName: string;
    complex?: {
        id: string;
        name: string;
    };
}

/**
 * Input for creating an announcement
 */
export interface CreateAnnouncementInput {
    complexId: string;
    title: string;
    content: string;
    priority: AnnouncementPriority;
    targetRoles?: string[];
    imageUrl?: string;
    publishedAt?: string; // ISO string for API
    expiresAt?: string; // ISO string for API
}

/**
 * Input for updating an announcement
 */
export interface UpdateAnnouncementInput extends Partial<CreateAnnouncementInput> { }

/**
 * Filters for announcements
 */
export interface AnnouncementFilters {
    priority?: AnnouncementPriority;
    status?: 'active' | 'expired' | 'all';
    limit?: number;
    search?: string;
}

export { AnnouncementPriority };
