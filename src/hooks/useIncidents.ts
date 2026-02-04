import { useState, useCallback } from 'react';
import { Incident, IncidentFilters, CreateIncidentInput, UpdateIncidentInput } from '@/types/incident';

export function useIncidents(complexId?: string) {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchIncidents = useCallback(async (filters: IncidentFilters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams();
            if (filters.status && filters.status !== 'ALL') queryParams.append('status', filters.status);
            if (filters.priority && filters.priority !== 'ALL') queryParams.append('priority', filters.priority);
            if (filters.type && filters.type !== 'ALL') queryParams.append('type', filters.type);
            if (filters.search) queryParams.append('search', filters.search);

            const url = complexId
                ? `/api/complexes/${complexId}/incidents?${queryParams.toString()}`
                : `/api/incidents?${queryParams.toString()}`;

            const response = await fetch(url);
            const result = await response.json();

            if (result.success) {
                setIncidents(result.data);
            } else {
                setError(result.error?.message || 'Error al obtener incidentes');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    }, [complexId]);

    const reportIncident = async (data: CreateIncidentInput) => {
        setLoading(true);
        try {
            const response = await fetch('/api/incidents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (result.success) {
                setIncidents(prev => [result.data, ...prev]);
                return result.data;
            } else {
                throw new Error(result.error?.message || 'Error al reportar incidente');
            }
        } finally {
            setLoading(false);
        }
    };

    const updateIncident = async (id: string, data: UpdateIncidentInput) => {
        try {
            const response = await fetch(`/api/incidents/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (result.success) {
                setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, ...result.data } : inc));
                return result.data;
            } else {
                throw new Error(result.error?.message || 'Error al actualizar incidente');
            }
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const deleteIncident = async (id: string) => {
        try {
            const response = await fetch(`/api/incidents/${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (result.success) {
                setIncidents(prev => prev.filter(inc => inc.id !== id));
            } else {
                throw new Error(result.error?.message || 'Error al eliminar incidente');
            }
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    return {
        incidents,
        loading,
        error,
        fetchIncidents,
        reportIncident,
        updateIncident,
        deleteIncident
    };
}
