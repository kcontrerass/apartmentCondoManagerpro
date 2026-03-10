"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface MobileSidebarContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextType>({
    isOpen: false,
    setIsOpen: () => { },
});

export function MobileSidebarProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <MobileSidebarContext.Provider value={{ isOpen, setIsOpen }}>
            {children}
        </MobileSidebarContext.Provider>
    );
}

export const useMobileSidebar = () => useContext(MobileSidebarContext);
