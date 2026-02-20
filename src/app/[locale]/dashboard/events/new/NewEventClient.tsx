'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEvents } from '@/hooks/useEvents';
import EventForm from '@/components/events/EventForm';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ComplexSelector } from '@/components/dashboard/ComplexSelector';
import { Role } from "@/types/roles";

const NewEventClient = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const t = useTranslations('events');
    const { createEvent, loading: createLoading } = useEvents();
    const sessionComplexId = session?.user?.complexId;
    const [selectedComplexId, setSelectedComplexId] = React.useState<string | null>(sessionComplexId || null);

    const isSuperAdmin = session?.user?.role === Role.SUPER_ADMIN;
    const complexId = sessionComplexId || selectedComplexId;

    const [residentCount, setResidentCount] = React.useState<number | undefined>(undefined);
    const [statsLoading, setStatsLoading] = React.useState(false);

    React.useEffect(() => {
        const fetchStats = async () => {
            if (complexId) {
                setStatsLoading(true);
                try {
                    const response = await fetch(`/api/complexes/${complexId}`);
                    const data = await response.json();
                    if (data._count && typeof data._count.residents === 'number') {
                        setResidentCount(data._count.residents);
                    }
                } catch (error) {
                    console.error('Error fetching complex stats:', error);
                } finally {
                    setStatsLoading(false);
                }
            }
        };
        fetchStats();
    }, [complexId]);

    const handleSubmit = async (data: any) => {
        try {
            await createEvent(data);
            router.push('/dashboard/events');
        } catch (error) {
            console.error('Error in page:', error);
        }
    };

    if (!complexId && !isSuperAdmin) return null;

    return (
        <div className="space-y-8 max-w-4xl">
            <PageHeader
                title={t('new')}
                subtitle="Organiza una nueva actividad para la comunidad"
                actions={
                    <Button variant="secondary" icon="arrow_back" onClick={() => router.push('/dashboard/events')}>
                        Volver
                    </Button>
                }
            />

            {isSuperAdmin && !sessionComplexId && (
                <Card className="p-6">
                    <ComplexSelector
                        value={selectedComplexId}
                        onChange={setSelectedComplexId}
                    />
                </Card>
            )}

            {complexId ? (
                <Card className="p-8 md:p-12">
                    {statsLoading ? (
                        <div className="flex justify-center py-20">
                            <Spinner />
                        </div>
                    ) : (
                        <EventForm
                            onSubmit={handleSubmit}
                            isLoading={createLoading}
                            complexId={complexId}
                            initialData={{
                                maxAttendees: residentCount
                            }}
                        />
                    )}
                </Card>
            ) : isSuperAdmin && (
                <Card className="p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">apartment</span>
                    <p className="text-slate-500 font-medium">Seleccione un condominio para comenzar a organizar el evento</p>
                </Card>
            )}
        </div>
    );
};

export default NewEventClient;
