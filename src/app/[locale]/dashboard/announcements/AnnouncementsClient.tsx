'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import AnnouncementTable from '@/components/announcements/AnnouncementTable';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { AnnouncementFilters, AnnouncementListItem } from '@/types/announcement';
import { Role } from '@prisma/client';

const AnnouncementsClient = () => {
    const { data: session } = useSession();
    const t = useTranslations('announcements');
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
                console.log(`[Announcements] 🔍 Attempting complexId recovery for user ${session.user.id}...`);
                setIsRecovering(true);
                try {
                    const response = await fetch(`/api/residents?userId=${session.user.id}`);
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0 && data[0].unit) {
                        const recoveredId = data[0].unit.complexId;
                        console.log(`[Announcements] ✅ Recovered complexId: ${recoveredId}`);
                        setComplexId(recoveredId);
                    } else {
                        console.warn('[Announcements] ⚠️ No resident unit found for user.');
                    }
                } catch (error) {
                    console.error('[Announcements] ❌ Failed to recover complexId:', error);
                } finally {
                    setIsRecovering(false);
                }
            } else if (complexId) {
                console.log(`[Announcements] 🆔 Using complexId: ${complexId}`);
            }
        };

        recoverComplexId();
    }, [session?.user?.id, complexId, session?.user?.role]);

    const { announcements, loading: hookLoading, fetchAnnouncements, deleteAnnouncement } = useAnnouncements(complexId || undefined);
    const loading = hookLoading || isRecovering;
    const [filters, setFilters] = useState<AnnouncementFilters>({ status: 'active' });
    const [searchTerm, setSearchTerm] = useState('');

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchTerm }));
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (complexId || userRole === Role.SUPER_ADMIN) {
            console.log(`[Announcements] 🔄 Fetching ${filters.status} announcements for ${complexId || 'GLOBAL'}...`);
            fetchAnnouncements(filters);
        }
    }, [complexId, userRole, filters, fetchAnnouncements]);

    const handleEdit = (announcement: AnnouncementListItem) => {
        router.push(`/dashboard/announcements/${announcement.id}`);
    };

    const handleView = (id: string) => {
        router.push(`/dashboard/announcements/${id}`);
    };

    const canManage = [Role.SUPER_ADMIN, Role.ADMIN, Role.OPERATOR].includes(userRole as any);

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('title')}
                subtitle="Gestiona los comunicados de tu complejo"
                actions={
                    canManage && (
                        <Button
                            onClick={() => router.push('/dashboard/announcements/new')}
                            icon="campaign"
                        >
                            {t('new')}
                        </Button>
                    )
                }
            />

            {/* Quick Filters Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { id: 'active', label: t('active'), status: 'active', icon: 'check_circle' },
                    { id: 'expired', label: t('expired'), status: 'expired', icon: 'history' },
                    { id: 'all', label: t('all'), status: 'all', icon: 'list' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setFilters(prev => ({ ...prev, status: tab.status as any }))}
                        className={`p-6 rounded-2xl border transition-all text-left flex items-center gap-4 ${filters.status === tab.status
                            ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20'
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${filters.status === tab.status
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                            <span className="material-symbols-outlined text-2xl">{tab.icon}</span>
                        </div>
                        <div>
                            <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${filters.status === tab.status ? 'text-primary' : 'text-slate-500'
                                }`}>
                                {tab.label}
                            </div>
                            <div className="text-slate-900 dark:text-white font-bold">
                                {filters.status === tab.status ? 'Seleccionado' : 'Ver'}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <Card>
                {!complexId && userRole !== Role.SUPER_ADMIN ? (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                        <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">apartment</span>
                        <p className="text-slate-600 font-bold">No se pudo identificar tu complejo</p>
                        <p className="text-slate-500 text-sm mt-1 mb-6">Tu sesión puede estar incompleta. Por favor, intenta cerrar sesión y volver a entrar.</p>
                        <Button onClick={() => window.location.reload()} variant="outline">
                            Recargar página
                        </Button>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center py-20">
                        <Spinner />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 px-2">
                            <div className="relative flex-1 max-w-md">
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

                        <AnnouncementTable
                            announcements={announcements}
                            onEdit={handleEdit}
                            onDelete={deleteAnnouncement}
                            canManage={canManage}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AnnouncementsClient;
