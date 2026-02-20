'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useEvents } from '@/hooks/useEvents';
import EventDetail from '@/components/events/EventDetail';
import EventForm from '@/components/events/EventForm';
import { RSVPStatus } from '@/types/event';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Role } from "@/types/roles";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";

const EventDetailClient = () => {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { getEvent, updateEvent, deleteEvent, submitRSVP, loading } = useEvents();

    const [event, setEvent] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            if (id) {
                const data = await getEvent(id as string);
                setEvent(data);
            }
        };
        fetchDetail();
    }, [id, getEvent]);

    const handleUpdate = async (data: any) => {
        if (id) {
            const updated = await updateEvent(id as string, data);
            if (updated) {
                setEvent((prev: any) => ({ ...prev, ...updated }));
                setIsEditing(false);
            }
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setIsDeleting(true);
        try {
            const success = await deleteEvent(id as string);
            if (success) {
                toast.success("Evento eliminado exitosamente");
                router.push('/dashboard/events');
            } else {
                toast.error("Error al eliminar el evento");
            }
        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error inesperado");
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    const handleRSVP = async (status: RSVPStatus, guests: number) => {
        if (id) {
            const result = await submitRSVP(id as string, status, guests);
            if (result) {
                // Refresh detail to get updated stats and RSVP
                const refreshed = await getEvent(id as string);
                setEvent(refreshed);
            }
        }
    };

    if (loading && !event) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="text-center py-20">
                <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">error</span>
                <h2 className="text-2xl font-bold text-slate-800">Evento no encontrado</h2>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push('/dashboard/events')}
                    icon="arrow_back"
                >
                    Volver a la lista
                </Button>
            </div>
        );
    }

    const userRole = session?.user?.role;
    const canManage = [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS].includes(userRole as any);
    const isOrganizer = event.organizerId === session?.user?.id;
    const isAdminInSameComplex = userRole === Role.ADMIN && event.complexId === session?.user?.complexId;
    const canEdit = isOrganizer || isAdminInSameComplex || userRole === Role.SUPER_ADMIN;

    return (
        <div className="space-y-8 max-w-6xl">
            <PageHeader
                title={isEditing ? 'Editar Evento' : event.title}
                subtitle={isEditing ? 'Actualiza los detalles de la actividad' : 'Detalles de la actividad comunitaria'}
                actions={
                    !isEditing ? (
                        <div className="flex gap-2">
                            <Button variant="secondary" icon="arrow_back" onClick={() => router.push('/dashboard/events')}>
                                Volver
                            </Button>
                            {canEdit && (
                                <>
                                    <Button variant="secondary" icon="edit" onClick={() => setIsEditing(true)}>
                                        Editar
                                    </Button>
                                    <Button variant="outline" icon="delete" className="text-red-500 border-red-100 hover:bg-red-50" onClick={() => setIsDeleteModalOpen(true)}>
                                        Eliminar
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    )
                }
            />

            {isEditing ? (
                <Card className="p-8 md:p-12">
                    <EventForm
                        initialData={event as any}
                        onSubmit={handleUpdate}
                        isLoading={loading}
                        complexId={event.complexId}
                    />
                </Card>
            ) : (
                <EventDetail
                    event={event}
                    onRSVP={handleRSVP}
                    onBack={() => router.push('/dashboard/events')}
                    isSubmittingRSVP={loading}
                />
            )}

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
                            {isDeleting ? "Eliminando..." : "Eliminar Evento"}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        ¿Estás seguro de que deseas eliminar este evento? Esta acción es irreversible y notificará a los asistentes si es necesario.
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default EventDetailClient;
