'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import AnnouncementDetail from '@/components/announcements/AnnouncementDetail';
import AnnouncementForm from '@/components/announcements/AnnouncementForm';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Role } from '@prisma/client';

const AnnouncementDetailClient = () => {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { getAnnouncement, updateAnnouncement, deleteAnnouncement, loading } = useAnnouncements();

    const [announcement, setAnnouncement] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            if (id) {
                const data = await getAnnouncement(id as string);
                setAnnouncement(data);
            }
        };
        fetchDetail();
    }, [id, getAnnouncement]);

    const handleUpdate = async (data: any) => {
        if (id) {
            const updated = await updateAnnouncement(id as string, data);
            if (updated) {
                setAnnouncement(updated);
                setIsEditing(false);
            }
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que deseas eliminar este aviso?')) return;
        if (id) {
            const success = await deleteAnnouncement(id as string);
            if (success) {
                router.push('/dashboard/announcements');
            }
        }
    };

    if (loading && !announcement) {
        return (
            <div className="flex items-center justify-center py-20">
                <Spinner />
            </div>
        );
    }

    if (!announcement) {
        return (
            <div className="text-center py-20">
                <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">error</span>
                <h2 className="text-2xl font-bold text-slate-800">Aviso no encontrado</h2>
                <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push('/dashboard/announcements')}
                    icon="arrow_back"
                >
                    Volver a la lista
                </Button>
            </div>
        );
    }

    const userRole = session?.user?.role;
    const canManage = [Role.SUPER_ADMIN, Role.ADMIN, Role.OPERATOR].includes(userRole as any);
    const isAuthor = announcement.authorId === session?.user?.id;
    const isAdminInSameComplex = userRole === Role.ADMIN && announcement.complexId === session?.user?.complexId;
    const canEdit = isAuthor || isAdminInSameComplex || userRole === Role.SUPER_ADMIN;

    return (
        <div className="space-y-8 max-w-5xl">
            <PageHeader
                title={isEditing ? 'Editar Aviso' : announcement.title}
                subtitle={isEditing ? 'Modifica los detalles del comunicado' : 'Detalles del comunicado oficial'}
                actions={
                    !isEditing ? (
                        <div className="flex gap-2">
                            <Button variant="secondary" icon="arrow_back" onClick={() => router.push('/dashboard/announcements')}>
                                Volver
                            </Button>
                            {canEdit && (
                                <>
                                    <Button variant="secondary" icon="edit" onClick={() => setIsEditing(true)}>
                                        Editar
                                    </Button>
                                    <Button variant="outline" icon="delete" className="text-red-500 border-red-100 hover:bg-red-50" onClick={handleDelete}>
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
                <Card className="p-8">
                    <AnnouncementForm
                        initialData={announcement as any}
                        onSubmit={handleUpdate}
                        isLoading={loading}
                        complexId={announcement.complexId}
                    />
                </Card>
            ) : (
                <AnnouncementDetail
                    announcement={announcement}
                    onBack={() => router.push('/dashboard/announcements')}
                />
            )}
        </div>
    );
};

export default AnnouncementDetailClient;
