'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEvents } from '@/hooks/useEvents';
import EventTable from '@/components/events/EventTable';
import EventCard from '@/components/events/EventCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Role } from '@prisma/client';

const EventsClient = () => {
    const { data: session } = useSession();
    const t = useTranslations('events');
    const router = useRouter();

    const [userRole, setUserRole] = useState<string | null>(session?.user?.role || null);
    const [complexId, setComplexId] = useState<string | null>(session?.user?.complexId || null);
    const [isRecovering, setIsRecovering] = useState(false);

    // Sync state with session when it loads
    useEffect(() => {
        if (session?.user) {
            setUserRole(session.user.role);
            if (session.user.complexId) {
                setComplexId(session.user.complexId);
            }
        }
    }, [session]);

    // Proactive complexId recovery for residents with stale sessions
    useEffect(() => {
        const recoverComplexId = async () => {
            if (session?.user?.id && !complexId && session.user.role === Role.RESIDENT) {
                console.log(`[Events] 🔍 Attempting complexId recovery for user ${session.user.id}...`);
                setIsRecovering(true);
                try {
                    const response = await fetch(`/api/residents?userId=${session.user.id}`);
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0 && data[0].unit) {
                        const recoveredId = data[0].unit.complexId;
                        console.log(`[Events] ✅ Recovered complexId: ${recoveredId}`);
                        setComplexId(recoveredId);
                    } else {
                        console.warn('[Events] ⚠️ No resident unit found for user.');
                    }
                } catch (error) {
                    console.error('[Events] ❌ Failed to recover complexId:', error);
                } finally {
                    setIsRecovering(false);
                }
            } else if (complexId) {
                console.log(`[Events] 🆔 Using complexId: ${complexId}`);
            }
        };

        recoverComplexId();
    }, [session?.user?.id, complexId, session?.user?.role]);

    const { events, loading: hookLoading, fetchEvents, deleteEvent } = useEvents(complexId || undefined);
    const loading = hookLoading || isRecovering;
    const [timeframe, setTimeframe] = useState<'upcoming' | 'past'>('upcoming');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [searchTerm, setSearchTerm] = useState('');

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            if (complexId || userRole === Role.SUPER_ADMIN) {
                console.log(`[Events] 🔄 Fetching ${timeframe} events with search "${searchTerm}" for ${complexId || 'GLOBAL'}...`);
                fetchEvents({ timeframe, search: searchTerm });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, timeframe, complexId, userRole, fetchEvents]);


    const handleEdit = (event: any) => {
        router.push(`/dashboard/events/${event.id}`);
    };

    const canManage = [Role.SUPER_ADMIN, Role.ADMIN, Role.OPERATOR].includes(userRole as any);

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('title')}
                subtitle="Eventos y actividades para la comunidad"
                actions={
                    canManage && (
                        <Button
                            onClick={() => router.push('/dashboard/events/new')}
                            icon="event"
                        >
                            {t('new')}
                        </Button>
                    )
                }
            />

            {/* Controls Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <button
                            onClick={() => setTimeframe('upcoming')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${timeframe === 'upcoming'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {t('upcoming')}
                        </button>
                        <button
                            onClick={() => setTimeframe('past')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${timeframe === 'past'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {t('past')}
                        </button>
                    </div>

                    <div className="relative flex-1 sm:min-w-[300px]">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por título..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 h-11 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all shadow-inner"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="sm"
                            icon="grid_view"
                            onClick={() => setViewMode('grid')}
                            className={viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}
                        />
                        <Button
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                            size="sm"
                            icon="table_rows"
                            onClick={() => setViewMode('table')}
                            className={viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {!complexId && userRole !== Role.SUPER_ADMIN ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">apartment</span>
                    <p className="text-slate-600 dark:text-slate-300 font-bold">No se pudo identificar tu complejo</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-6 max-w-xs mx-auto">
                        Tu sesión puede estar incompleta. Por favor, intenta cerrar sesión y volver a entrar o recargar la página.
                    </p>
                    <Button onClick={() => window.location.reload()} variant="outline">
                        Recargar página
                    </Button>
                </div>
            ) : loading ? (
                <div className="flex justify-center py-20">
                    <Spinner />
                </div>
            ) : events.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-24 text-center">
                    <span className="material-symbols-outlined text-6xl text-slate-200 mb-6">event_busy</span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">No hay eventos para mostrar</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2">Vuelve pronto para ver nuevas actividades en tu comunidad.</p>
                </Card>
            ) : viewMode === 'table' ? (
                <Card>
                    <EventTable
                        events={events}
                        onEdit={handleEdit}
                        onDelete={deleteEvent}
                        canManage={canManage}
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                    {events.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventsClient;
