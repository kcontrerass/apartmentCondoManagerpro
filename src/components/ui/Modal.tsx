"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
    size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Modal({ isOpen, onClose, title, children, footer, className, size = "md" }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    const sizes = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-2xl",
        full: "max-w-[95vw]",
    };

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted) return null;
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Card className={cn("w-full shadow-xl animate-in zoom-in-95 duration-200", sizes[size], className)}>
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle>{title}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                        <span className="material-symbols-outlined">close</span>
                    </Button>
                </div>

                <CardContent className="p-6">
                    {children}
                </CardContent>

                {footer && (
                    <div className="flex items-center justify-end gap-2 p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl">
                        {footer}
                    </div>
                )}
            </Card>

            {/* Backdrop click to close */}
            <div className="fixed inset-0 -z-10" onClick={onClose} />
        </div>,
        document.body
    );
}
