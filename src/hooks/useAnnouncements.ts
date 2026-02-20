'use client';

import { useState, useCallback } from 'react';
import { AnnouncementListItem, Announcement, AnnouncementFilters } from '@/types/announcement';
import { toast } from 'sonner';

export const useAnnouncements = (complexId?: string) => {
    const [announcements, setAnnouncements] = useState<AnnouncementListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAnnouncements = useCallback(async (filters: AnnouncementFilters = {}) => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            if (filters.priority) queryParams.append('priority', filters.priority);
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.limit) queryParams.append('limit', filters.limit.toString());
            if (filters.search) queryParams.append('search', filters.search);

            const url = complexId
                ? `/api/complexes/${complexId}/announcements?${queryParams.toString()}`
                : `/api/announcements?${queryParams.toString()}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setAnnouncements(data.data.announcements);
            } else {
                throw new Error(data.error?.message || 'Error al cargar avisos');
            }
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [complexId]);

    const createAnnouncement = useCallback(async (data: any) => {
        setLoading(true);
        try {
            const response = await fetch('/api/announcements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (result.success) {
                toast.success('Aviso publicado exitosamente');
                return result.data;
            } else {
                throw new Error(result.error?.message || 'Error al crear aviso');
            }
        } catch (err: any) {
            toast.error(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateAnnouncement = useCallback(async (id: string, data: any) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/announcements/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (result.success) {
                toast.success('Aviso actualizado exitosamente');
                return result.data;
            } else {
                throw new Error(result.error?.message || 'Error al actualizar aviso');
            }
        } catch (err: any) {
            toast.error(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteAnnouncement = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/announcements/${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();

            if (result.success) {
                toast.success('Aviso eliminado');
                setAnnouncements(prev => prev.filter(a => a.id !== id));
                return true;
            } else {
                throw new Error(result.error?.message || 'Error al eliminar aviso');
            }
        } catch (err: any) {
            toast.error(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const getAnnouncement = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/announcements/${id}`);
            const data = await response.json();

            if (data.success) {
                return data.data as Announcement;
            } else {
                throw new Error(data.error?.message || 'Error al cargar detalle');
            }
        } catch (err: any) {
            toast.error(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        announcements,
        loading,
        error,
        fetchAnnouncements,
        createAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        getAnnouncement,
    };
};
