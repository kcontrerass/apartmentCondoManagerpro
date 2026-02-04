'use client';

import React, { useEffect } from 'react';
import { useComplexes } from '@/hooks/useComplexes';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';

interface ComplexSelectorProps {
    value: string | null;
    onChange: (id: string) => void;
    label?: string;
    error?: string;
}

export const ComplexSelector: React.FC<ComplexSelectorProps> = ({
    value,
    onChange,
    label = 'Seleccionar Condominio',
    error
}) => {
    const { complexes, loading, fetchComplexes } = useComplexes();

    useEffect(() => {
        fetchComplexes();
    }, [fetchComplexes]);

    if (loading && complexes.length === 0) {
        return (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                <Spinner size="sm" />
                <span>Cargando condominios...</span>
            </div>
        );
    }

    const options = complexes.map(c => ({
        label: c.name,
        value: c.id
    }));

    return (
        <Select
            label={label}
            options={[
                { label: 'Seleccione un condominio', value: '' },
                ...options
            ]}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            error={error}
        />
    );
};
