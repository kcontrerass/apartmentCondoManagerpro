import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export function usePolls(complexId?: string) {
    const [polls, setPolls] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPolls = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const url = complexId ? `/api/polls?complexId=${complexId}` : '/api/polls';
            const response = await fetch(url);
            const result = await response.json();
            if (result.success) {
                setPolls(result.data);
            } else {
                setError(result.error?.message || 'Error al obtener votaciones');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    }, [complexId]);

    const createPoll = async (data: any) => {
        setLoading(true);
        try {
            const response = await fetch('/api/polls', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (result.success) {
                setPolls(prev => [result.data, ...prev]);
                toast.success('Votación creada exitosamente');
                return result.data;
            } else {
                const message = result.error?.message || 'Error al crear votación';
                toast.error(message);
                throw new Error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const vote = async (pollId: string, optionId: string) => {
        try {
            const response = await fetch(`/api/polls/${pollId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ optionId }),
            });
            const result = await response.json();
            if (result.success) {
                // Update local state to show the vote immediately
                setPolls(prev => prev.map(p => {
                    if (p.id === pollId) {
                        return {
                            ...p,
                            hasVoted: true,
                            userOptionId: optionId,
                            options: p.options.map((opt: any) => {
                                if (opt.id === optionId) {
                                    return {
                                        ...opt,
                                        _count: { ...opt._count, votes: (opt._count?.votes || 0) + 1 }
                                    };
                                }
                                return opt;
                            }),
                            _count: { ...p._count, votes: (p._count?.votes || 0) + 1 }
                        };
                    }
                    return p;
                }));
                toast.success('¡Voto registrado!');
                return true;
            } else {
                toast.error(result.error?.message || 'Error al votar');
                return false;
            }
        } catch (err) {
            toast.error('Error de conexión al votar');
            return false;
        }
    };

    const deletePoll = async (id: string) => {
        try {
            const response = await fetch(`/api/polls/${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();
            if (result.success) {
                setPolls(prev => prev.filter(p => p.id !== id));
                toast.success('Votación eliminada');
                return true;
            } else {
                toast.error(result.error?.message || 'Error al eliminar');
                return false;
            }
        } catch (err) {
            toast.error('Error de conexión');
            return false;
        }
    };

    return {
        polls,
        loading,
        error,
        fetchPolls,
        createPoll,
        vote,
        deletePoll
    };
}
