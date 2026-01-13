export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
