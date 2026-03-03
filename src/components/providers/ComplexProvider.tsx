'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Role } from '@/types/roles';

interface ComplexContextType {
    selectedComplexId: string | null;
    setSelectedComplexId: (id: string | null) => void;
    isSuperAdmin: boolean;
}

const ComplexContext = createContext<ComplexContextType | undefined>(undefined);

export function ComplexProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [selectedComplexId, setSelectedComplexIdState] = useState<string | null>(null);
    const isSuperAdmin = session?.user?.role === Role.SUPER_ADMIN;

    // Load from localStorage on mount
    useEffect(() => {
        if (isSuperAdmin) {
            const saved = localStorage.getItem('super_admin_selected_complex');
            if (saved) {
                setSelectedComplexIdState(saved);
            }
        }
    }, [isSuperAdmin]);

    const setSelectedComplexId = (id: string | null) => {
        setSelectedComplexIdState(id);
        if (isSuperAdmin) {
            if (id) {
                localStorage.setItem('super_admin_selected_complex', id);
            } else {
                localStorage.removeItem('super_admin_selected_complex');
            }
        }
    };

    return (
        <ComplexContext.Provider value={{ selectedComplexId, setSelectedComplexId, isSuperAdmin }}>
            {children}
        </ComplexContext.Provider>
    );
}

export function useSelectedComplex() {
    const context = useContext(ComplexContext);
    if (context === undefined) {
        throw new Error('useSelectedComplex must be used within a ComplexProvider');
    }
    return context;
}
