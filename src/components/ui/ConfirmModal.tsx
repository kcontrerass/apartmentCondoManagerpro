"use client";

import { Modal } from "./Modal";
import { Button } from "./Button";
import { ReactNode } from "react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | ReactNode;
    confirmText?: string;
    cancelText?: string;
    type?: "danger" | "primary" | "secondary";
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    type = "danger",
    isLoading = false
}: ConfirmModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (!isLoading) onClose();
            }}
            title={title}
            size="sm"
            footer={
                <div className="flex gap-3 justify-end w-full">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={type}
                        onClick={onConfirm}
                        isLoading={isLoading}
                    >
                        {confirmText}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                    {message}
                </p>
            </div>
        </Modal>
    );
}
