'use client';

import React, { useEffect, useState } from 'react';
import { useIncidents } from '@/hooks/useIncidents';
import { Incident, IncidentStatus, IncidentPriority } from '@/types/incident';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from '@/i18n/routing';
import { toast } from 'react-hot-toast';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { Modal } from '@/components/ui/Modal';

interface IncidentDetailClientProps {
    incidentId: string;
    userRole: string;
}

export default function IncidentDetailClient({ incidentId, userRole }: IncidentDetailClientProps) {
    const { updateIncident, deleteIncident } = useIncidents();
    const [incident, setIncident] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [commentContent, setCommentContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchIncident = async () => {
            try {
                const response = await fetch(`/api/incidents/${incidentId}`);
                const result = await response.json();
                if (result.success) {
                    setIncident(result.data);
                } else {
                    toast.error('No se pudo encontrar el incidente');
                    router.push('/dashboard/incidents');
                }
            } catch (error) {
                toast.error('Error al cargar detalle');
            } finally {
                setLoading(false);
            }
        };

        fetchIncident();
    }, [incidentId, router]);

    const handleUpdateStatus = async (status: IncidentStatus) => {
        try {
            const updated = await updateIncident(incidentId, { status });
            setIncident((prev: any) => prev ? { ...prev, ...updated } : null);
            toast.success(`Estado actualizado a ${status}`);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleUpdatePriority = async (priority: IncidentPriority) => {
        try {
            const updated = await updateIncident(incidentId, { priority });
            setIncident((prev: any) => prev ? { ...prev, ...updated } : null);
            toast.success(`Prioridad actualizada a ${priority}`);
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handlePostComment = async () => {
        if (!commentContent.trim()) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/incidents/${incidentId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: commentContent.trim() })
            });
            const result = await response.json();
            if (result.success) {
                setCommentContent('');
                // Optimized update: append the new comment to the list if it doesn't already exist
                setIncident((prev: any) => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        comments: [...(prev.comments || []), result.data]
                    };
                });
                toast.success('Mensaje enviado');
            } else {
                toast.error(result.error?.message || 'Error al enviar mensaje');
            }
        } catch (error) {
            toast.error('Error de red al enviar mensaje');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteIncident(incidentId);
            toast.success('Incidente eliminado');
            setIsDeleteModalOpen(false);
            router.push('/dashboard/incidents');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!incident) return null;

    const getStatusVariant = (status: IncidentStatus) => {
        switch (status) {
            case 'REPORTED': return 'warning';
            case 'IN_PROGRESS': return 'info';
            case 'RESOLVED': return 'success';
            case 'CANCELLED': return 'error';
            default: return 'neutral';
        }
    };

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'BOARD_OF_DIRECTORS' || userRole === 'GUARD';

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <Breadcrumbs />
            <div className="flex items-center gap-4">
                <Button variant="secondary" size="sm" icon="arrow_back" onClick={() => router.back()}>
                    Volver
                </Button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                    Detalle de Incidente
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                {incident.title}
                            </h2>
                            <Badge variant={getStatusVariant(incident.status)}>
                                {incident.status}
                            </Badge>
                        </div>

                        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 mb-8">
                            <p className="whitespace-pre-wrap leading-relaxed py-4 border-y border-slate-50 dark:border-slate-800/50">
                                {incident.description}
                            </p>
                        </div>

                        {incident.imageUrl && (
                            <div className="rounded-[2rem] overflow-hidden mb-8 shadow-lg">
                                <img src={incident.imageUrl} alt="Evidencia" className="w-full h-auto" />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                                <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                                    {incident.location || 'No especificada'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tipo</p>
                                <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                                    {incident.type}
                                </p>
                            </div>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
                                Acciones de Gestión
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {incident.status === 'REPORTED' && (
                                    <Button onClick={() => handleUpdateStatus('IN_PROGRESS')} variant="primary" icon="play_arrow">
                                        Iniciar Atención
                                    </Button>
                                )}
                                {incident.status === 'IN_PROGRESS' && (
                                    <Button onClick={() => handleUpdateStatus('RESOLVED')} variant="primary" icon="check">
                                        Marcar como Resuelto
                                    </Button>
                                )}
                                {incident.status !== 'CANCELLED' && (
                                    <Button onClick={() => handleUpdateStatus('CANCELLED')} variant="outline" className="text-white border-white/20 hover:bg-white/10" icon="cancel">
                                        Cancelar
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {userRole === 'RESIDENT' && incident.status === 'REPORTED' && (
                        <div className="flex justify-end pt-4">
                            <Button onClick={() => setIsDeleteModalOpen(true)} variant="outline" className="text-red-400 border-red-400/20 hover:bg-red-400/10" icon="delete">
                                Eliminar Reporte
                            </Button>
                        </div>
                    )}

                    {/* Seguimiento del Caso (Timeline / Mensajes) */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">forum</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Seguimiento del Caso</h3>
                                <p className="text-xs text-slate-500 font-medium">Historial de actualizaciones y mensajes</p>
                            </div>
                        </div>

                        {/* Lista de Comentarios */}
                        <div className="space-y-6 mb-10 max-h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                            {incident.comments && incident.comments.length > 0 ? (
                                incident.comments.map((comment: any) => (
                                    <div key={comment.id} className="flex gap-4">
                                        <div className="flex-shrink-0 pt-1">
                                            {comment.author.image ? (
                                                <img
                                                    src={comment.author.image}
                                                    alt={comment.author.name}
                                                    className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <span className="material-symbols-outlined text-xl">person</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] p-4 border border-slate-100 dark:border-slate-800/60">
                                                <div className="flex justify-between items-center mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {comment.author.name}
                                                        </span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary uppercase tracking-tight">
                                                            {comment.author.role}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-medium text-slate-400">
                                                        {format(new Date(comment.createdAt), "p, d MMM", { locale: es })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <span className="material-symbols-outlined text-slate-300 text-3xl">chat_bubble_outline</span>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">No hay mensajes de seguimiento aún.</p>
                                    <p className="text-xs text-slate-400">Sé el primero en escribir algo sobre este caso.</p>
                                </div>
                            )}
                        </div>

                        {/* Formulario para nuevo mensaje */}
                        <div className="relative group">
                            <textarea
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                placeholder="Escribe una actualización o mensaje sobre el caso..."
                                className="w-full h-32 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-[2rem] p-5 text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none pr-16"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        handlePostComment();
                                    }
                                }}
                            />
                            <div className="absolute right-4 bottom-4">
                                <Button
                                    onClick={handlePostComment}
                                    disabled={!commentContent.trim() || isSubmitting}
                                    isLoading={isSubmitting}
                                    className="rounded-2xl w-12 h-12 p-0 flex items-center justify-center shadow-lg shadow-primary/20"
                                >
                                    <span className="material-symbols-outlined">send</span>
                                </Button>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-3 ml-4 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">info</span>
                            Presiona Ctrl + Enter para enviar rápidamente
                        </p>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest mb-6 border-b border-slate-50 dark:border-slate-800/50 pb-4">
                            Información del Reporte
                        </h4>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">priority_high</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Prioridad</p>
                                    <select
                                        value={incident.priority}
                                        onChange={(e) => handleUpdatePriority(e.target.value as IncidentPriority)}
                                        disabled={!isAdmin}
                                        className="text-sm font-extrabold text-slate-700 dark:text-slate-300 bg-transparent outline-none disabled:appearance-none cursor-pointer"
                                    >
                                        <option value="LOW">Baja</option>
                                        <option value="MEDIUM">Media</option>
                                        <option value="HIGH">Alta</option>
                                        <option value="URGENT">Urgente</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                                    <span className="material-symbols-outlined">person_pin</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Reportado por</p>
                                    <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300 truncate">
                                        {incident.reporter?.name}
                                    </p>
                                    {isAdmin && incident.reporter?.phone && (
                                        <p className="text-xs font-medium text-slate-500">
                                            {incident.reporter.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                    <span className="material-symbols-outlined">calendar_today</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Reporte</p>
                                    <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                                        {format(new Date(incident.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                                    </p>
                                </div>
                            </div>

                            {incident.unit && (
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                                        <span className="material-symbols-outlined">meeting_room</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Unidad</p>
                                        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">
                                            #{incident.unit.number}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                title="Confirmar Eliminación"
                footer={
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            isLoading={isDeleting}
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar Reporte"}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        ¿Estás seguro de que deseas eliminar este incidente definitivamente? Esta acción no se puede deshacer.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
