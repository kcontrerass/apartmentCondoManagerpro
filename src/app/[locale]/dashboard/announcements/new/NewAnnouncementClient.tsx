'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import AnnouncementForm from '@/components/announcements/AnnouncementForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ComplexSelector } from '@/components/dashboard/ComplexSelector';
import { Spinner } from '@/components/ui/Spinner';
import { Role } from "@/types/roles";

const NewAnnouncementClient = () => {
    const { data: session, status } = useSession();
    const isSessionLoading = status === "loading";
    const router = useRouter();
    const t = useTranslations('announcements');
    const { createAnnouncement, loading } = useAnnouncements();
    const sessionComplexId = session?.user?.complexId;


    const isSuperAdmin = status === "authenticated" && session?.user?.role === Role.SUPER_ADMIN;
    const [complexId, setComplexId] = React.useState<string | null>(sessionComplexId || null);

    // Proactive complexId recovery for users with stale sessions
    React.useEffect(() => {
        const recoverComplexId = async () => {
            if (session?.user?.id && !complexId && !isSuperAdmin) {
                console.log(`[NewAnnouncement] 🔍 Attempting complexId recovery for user ${session.user.id}...`);
                try {
                    const profileRes = await fetch('/api/users/profile');
                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        const recoveredId = profileData.complexId ||
                            (profileData.managedComplexes?.[0]?.id);

                        if (recoveredId) {
                            console.log(`[NewAnnouncement] ✅ Recovered (Profile) complexId: ${recoveredId}`);
                            setComplexId(recoveredId);
                        }
                    }
                } catch (error) {
                    console.error('[NewAnnouncement] ❌ Failed to recover complexId:', error);
                }
            }
        };

        recoverComplexId();
    }, [session?.user?.id, complexId, isSuperAdmin]);

    const handleSubmit = async (data: any) => {
        try {
            await createAnnouncement(data);
            router.push('/dashboard/announcements');
        } catch (error) {
            console.error('Error in page:', error);
        }
    };

    if (isSessionLoading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner />
            </div>
        );
    }

    if (!complexId && !isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">account_circle</span>
                <p className="text-slate-600 font-bold">No se pudo identificar tu complejo</p>
                <p className="text-slate-500 text-sm mt-1 mb-6 text-center max-w-xs">
                    Tu sesión puede estar incompleta. Por favor, intenta cerrar sesión y volver a entrar.
                </p>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Recargar página
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <PageHeader
                title={t('new')}
                subtitle="Publica información relevante para los residentes"
            />

            {isSuperAdmin && !sessionComplexId && (
                <Card className="p-6">
                    <ComplexSelector
                        value={complexId}
                        onChange={setComplexId}
                    />
                </Card>
            )}

            {(complexId) && (
                <Card className="p-8">
                    <AnnouncementForm
                        onSubmit={handleSubmit}
                        isLoading={loading}
                        complexId={complexId}
                    />
                </Card>
            )}

            {isSuperAdmin && !complexId && (
                <Card className="p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">apartment</span>
                    <p className="text-slate-500 font-medium">Seleccione un condominio para comenzar a redactar el aviso</p>
                </Card>
            )}
        </div>
    );
};

export default NewAnnouncementClient;
