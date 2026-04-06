'use client';

import React, { useEffect, useState } from 'react';
import { usePolls } from '@/hooks/usePolls';
import { PollCard } from './PollCard';
import { PollForm } from './PollForm';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ComplexSelector } from '@/components/dashboard/ComplexSelector';
import { Role } from '@/types/roles';
import { useSelectedComplex } from '@/components/providers/ComplexProvider';
import { useTranslations } from 'next-intl';

interface PollListProps {
    complexId: string;
    userRole: string;
}

export const PollList: React.FC<PollListProps> = ({ complexId: initialComplexId, userRole }) => {
    const t = useTranslations('Polls');
    const { selectedComplexId, setSelectedComplexId, isSuperAdmin } = useSelectedComplex();

    // For SuperAdmin, we use the global selectedComplexId. 
    // For others, we use the complexId passed from the parent (which comes from their profile/unit)
    const currentComplexId = isSuperAdmin ? (selectedComplexId || '') : initialComplexId;

    const { polls, loading, fetchPolls, createPoll, vote, deletePoll } = usePolls(currentComplexId);
    const [isPollModalOpen, setIsPollModalOpen] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

    useEffect(() => {
        if (currentComplexId) {
            fetchPolls();
        }
    }, [fetchPolls, currentComplexId]);

    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'BOARD_OF_DIRECTORS'].includes(userRole);

    const filteredPolls = polls.filter((poll: any) => {
        if (filter === 'ALL') return true;
        const isClosed = poll.status === 'CLOSED' || (poll.expiresAt && new Date() > new Date(poll.expiresAt));
        if (filter === 'CLOSED') return isClosed;
        if (filter === 'OPEN') return !isClosed;
        return true;
    });

    const handleCreatePoll = async (data: any) => {
        try {
            await createPoll(data);
            setIsPollModalOpen(false);
        } catch (error) {
            // Error is handled in the hook (toast)
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-6 flex-1">
                    {/* Complex Selector for Super Admin */}
                    {isSuperAdmin && (
                        <div className="max-w-xs animate-in slide-in-from-left duration-300">
                            <ComplexSelector
                                value={selectedComplexId}
                                onChange={(id) => setSelectedComplexId(id)}
                                label={t('filterByComplex')}
                            />
                        </div>
                    )}

                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-background-dark rounded-2xl w-fit">
                        <button
                            onClick={() => setFilter('ALL')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'ALL' ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t('filters.all')}
                        </button>
                        <button
                            onClick={() => setFilter('OPEN')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'OPEN' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t('filters.open')}
                        </button>
                        <button
                            onClick={() => setFilter('CLOSED')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === 'CLOSED' ? 'bg-white dark:bg-slate-700 text-slate-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t('filters.closed')}
                        </button>
                    </div>
                </div>

                {isAdmin && (
                    <Button
                        onClick={() => setIsPollModalOpen(true)}
                        icon="add_circle"
                        className="shadow-xl shadow-primary/20 h-[48px] px-8"
                        disabled={!currentComplexId}
                    >
                        {t('new')}
                    </Button>
                )}
            </div>

            {loading && polls.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : filteredPolls.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    {filteredPolls.map((poll: any) => (
                        <PollCard
                            key={poll.id}
                            poll={poll}
                            onVote={vote}
                            userRole={userRole}
                            onDelete={deletePoll}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-background-dark rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-background-dark rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-slate-300 text-4xl">how_to_vote</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('emptyTitle')}</h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">
                        {!currentComplexId
                            ? t('selectComplexHelp')
                            : t('noPollsFound')}
                    </p>
                </div>
            )}

            <Modal
                isOpen={isPollModalOpen}
                onClose={() => setIsPollModalOpen(false)}
                title={t('modalTitle')}
            >
                <PollForm
                    complexId={currentComplexId}
                    onSubmit={handleCreatePoll}
                    isLoading={loading}
                />
            </Modal>
        </div>
    );
};
