'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface PollFormProps {
    complexId: string;
    onSubmit: (data: any) => Promise<any>;
    isLoading?: boolean;
}

export const PollForm: React.FC<PollFormProps> = ({ complexId, onSubmit, isLoading }) => {
    const t = useTranslations('Polls');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [options, setOptions] = useState(['', '']); // Start with 2 empty options
    const [expiresAt, setExpiresAt] = useState('');

    const handleAddOption = () => {
        if (options.length < 6) {
            setOptions([...options, '']);
        }
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const filteredOptions = options.filter(opt => opt.trim() !== '');

        if (filteredOptions.length < 2) return;

        await onSubmit({
            title: title.trim(),
            description: description.trim(),
            complexId,
            expiresAt: expiresAt || null,
            options: filteredOptions
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('form.title')}</label>
                    <input
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('form.titlePlaceholder')}
                        className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('form.description')}</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={t('form.descriptionPlaceholder')}
                        className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all h-24 resize-none"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('form.optionsLabel')}</label>
                        {options.length < 6 && (
                            <button
                                type="button"
                                onClick={handleAddOption}
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-sm">add_circle</span>
                                {t('form.addOption')}
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">{index + 1}</span>
                                    <input
                                        required
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        placeholder={`${t('form.optionPlaceholder')} ${index + 1}`}
                                        className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-100 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                                    />
                                </div>
                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOption(index)}
                                        className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined text-xl">remove_circle</span>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">{t('form.expiresAt')}</label>
                    <input
                        type="date"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                </div>
            </div>

            <div className="pt-4">
                <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full py-4 rounded-[1.5rem] shadow-xl shadow-primary/20 text-lg font-extrabold"
                    icon="rocket_launch"
                >
                    {t('form.submit')}
                </Button>
            </div>
        </form>
    );
};
