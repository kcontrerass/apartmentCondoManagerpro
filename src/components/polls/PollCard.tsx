'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PollCardProps {
    poll: any;
    onVote: (pollId: string, optionId: string) => Promise<boolean>;
    userRole: string;
    onDelete?: (id: string) => void;
}

export const PollCard: React.FC<PollCardProps> = ({ poll, onVote, userRole, onDelete }) => {
    const [isVoting, setIsVoting] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(poll.userOptionId || null);

    const totalVotes = poll._count?.votes || 0;
    const isClosed = poll.status === 'CLOSED' || (poll.expiresAt && new Date() > new Date(poll.expiresAt));
    const showResults = poll.hasVoted || isClosed || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    const handleVote = async () => {
        if (!selectedOption || isVoting || poll.hasVoted) return;
        setIsVoting(true);
        const success = await onVote(poll.id, selectedOption);
        if (!success) setIsVoting(false);
    };

    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'BOARD_OF_DIRECTORS'].includes(userRole);

    return (
        <div className="bg-white dark:bg-background-dark rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-all hover:shadow-2xl hover:shadow-primary/5 group">
            <div className="flex justify-between items-start mb-4">
                <Badge variant={isClosed ? 'neutral' : 'success'}>
                    {isClosed ? 'Cerrada' : 'Activa'}
                </Badge>
                {isAdmin && onDelete && (
                    <button
                        onClick={() => onDelete(poll.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                )}
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2 leading-tight">
                {poll.title}
            </h3>

            {poll.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
                    {poll.description}
                </p>
            )}

            <div className="space-y-3 mb-6">
                {(poll.options || []).map((option: any) => {
                    const votes = option._count?.votes || 0;
                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const isSelected = selectedOption === option.id;

                    return (
                        <div key={option.id} className="relative">
                            {showResults ? (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className={isSelected ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}>
                                            {option.text} {isSelected && '✓'}
                                        </span>
                                        <span className="text-slate-400">{percentage}% ({votes})</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 dark:bg-background-dark rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${isSelected ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setSelectedOption(option.id)}
                                    disabled={isClosed || poll.hasVoted}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${isSelected
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
                                        }`}
                                >
                                    <span className="text-sm font-bold">{option.text}</span>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary' : 'border-slate-200 dark:border-slate-700'}`}>
                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                    </div>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="material-symbols-outlined text-[14px]">how_to_vote</span>
                    {totalVotes} votos totales
                </div>

                {!showResults ? (
                    <Button
                        size="sm"
                        disabled={!selectedOption || isVoting}
                        isLoading={isVoting}
                        onClick={handleVote}
                        className="rounded-xl shadow-lg shadow-primary/20"
                    >
                        Votar ahora
                    </Button>
                ) : (
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                        {isClosed ? 'Votación Finalizada' : 'Ya has votado'}
                    </div>
                )}
            </div>

            {poll.expiresAt && (
                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-medium text-slate-400 italic">
                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                    Finaliza el {format(new Date(poll.expiresAt), "d 'de' MMMM", { locale: es })}
                </div>
            )}
        </div>
    );
};
