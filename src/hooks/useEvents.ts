'use client';

import { useState, useCallback } from 'react';
import { EventListItem, Event, RSVPStatus, EventFilters } from '@/types/event';
import { toast } from 'sonner';

export const useEvents = (complexId?: string) => {
    const [events, setEvents] = useState<EventListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async (filters: EventFilters = {}) => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            if (filters.timeframe) queryParams.append('timeframe', filters.timeframe);
            if (filters.limit) queryParams.append('limit', filters.limit.toString());
            if (filters.search) queryParams.append('search', filters.search);

            const url = complexId
                ? `/api/complexes/${complexId}/events?${queryParams.toString()}`
                : `/api/events?${queryParams.toString()}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setEvents(data.data.events);
            } else {
                throw new Error(data.error?.message || 'Error al cargar eventos');
            }
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }, [complexId]);

    const createEvent = useCallback(async (data: any) => {
        setLoading(true);
        try {
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (result.success) {
                toast.success('Evento creado exitosamente');
                return result.data;
            } else {
                throw new Error(result.error?.message || 'Error al crear evento');
            }
        } catch (err: any) {
            toast.error(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateEvent = useCallback(async (id: string, data: any) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/events/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();

            if (result.success) {
                toast.success('Evento actualizado exitosamente');
                return result.data;
            } else {
                throw new Error(result.error?.message || 'Error al actualizar evento');
            }
        } catch (err: any) {
            toast.error(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteEvent = useCallback(async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/events/${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();

            if (result.success) {
                toast.success('Evento eliminado');
                setEvents(prev => prev.filter(e => e.id !== id));
                return true;
            } else {
                throw new Error(result.error?.message || 'Error al eliminar evento');
            }
        } catch (err: any) {
            toast.error(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const getEvent = useCallback(async (id: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/events/${id}`);
            const data = await response.json();

            if (data.success) {
                return data.data;
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

    const submitRSVP = useCallback(async (eventId: string, status: RSVPStatus, guests: number = 0) => {
        console.log(`[RSVP Hook] Submitting ${status} for event ${eventId} (guests: ${guests})`);
        setLoading(true);
        try {
            const response = await fetch(`/api/events/${eventId}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, guests }),
            });
            const result = await response.json();

            if (result.success) {
                console.log('[RSVP Hook] Success:', result.message);
                toast.success(result.message || 'Tu asistencia ha sido registrada');
                return result.data;
            } else {
                console.error('[RSVP Hook] API Error:', result.error);
                throw new Error(result.error?.message || 'Error al registrar asistencia');
            }
        } catch (err: any) {
            console.error('[RSVP Hook] Exception:', err);
            toast.error(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        events,
        loading,
        error,
        fetchEvents,
        createEvent,
        updateEvent,
        deleteEvent,
        getEvent,
        submitRSVP,
    };
};
