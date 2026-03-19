"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface ResidentAdminResetPasswordProps {
    residentId: string;
}

export function ResidentAdminResetPassword({ residentId }: ResidentAdminResetPasswordProps) {
    const t = useTranslations("Residents.adminResetPassword");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [generating, setGenerating] = useState(false);
    const [savingManual, setSavingManual] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showManual, setShowManual] = useState(false);

    const openModalWithPassword = (plain: string) => {
        setGeneratedPassword(plain);
        setShowPasswordModal(true);
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch(`/api/residents/${residentId}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "generate" }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                toast.error((data as { error?: string }).error || t("error"));
                return;
            }

            const temp = (data as { temporaryPassword?: string }).temporaryPassword;
            if (temp) {
                openModalWithPassword(temp);
                toast.success(t("generatedToast"));
            } else {
                toast.error(t("error"));
            }
        } catch {
            toast.error(t("error"));
        } finally {
            setGenerating(false);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error(t("minLength"));
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error(t("mismatch"));
            return;
        }

        setSavingManual(true);
        try {
            const res = await fetch(`/api/residents/${residentId}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "manual",
                    newPassword,
                    confirmPassword,
                }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                toast.error((data as { error?: string }).error || t("error"));
                return;
            }

            toast.success(t("manualSuccess"));
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            toast.error(t("error"));
        } finally {
            setSavingManual(false);
        }
    };

    const copyPassword = async () => {
        if (!generatedPassword) return;
        try {
            await navigator.clipboard.writeText(generatedPassword);
            toast.success(t("copied"));
        } catch {
            toast.error(t("copyFailed"));
        }
    };

    const closeModal = () => {
        setShowPasswordModal(false);
        setGeneratedPassword(null);
    };

    return (
        <>
            <Card className="p-6 border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10">
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">{t("title")}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t("description")}</p>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                            {t("generateTitle")}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t("generateHint")}</p>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleGenerate}
                            isLoading={generating}
                            disabled={generating || savingManual}
                            className="w-full sm:w-auto"
                        >
                            {t("generateButton")}
                        </Button>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/30">
                        <button
                            type="button"
                            onClick={() => setShowManual((v) => !v)}
                            className="text-sm text-primary font-medium hover:underline"
                        >
                            {showManual ? t("hideManual") : t("showManual")}
                        </button>

                        {showManual && (
                            <form onSubmit={handleManualSubmit} className="space-y-4 mt-4">
                                <Input
                                    type="password"
                                    label={t("newPassword")}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                    minLength={6}
                                    required
                                />
                                <Input
                                    type="password"
                                    label={t("confirmPassword")}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    minLength={6}
                                    required
                                />
                                <Button
                                    type="submit"
                                    variant="secondary"
                                    isLoading={savingManual}
                                    disabled={savingManual || generating}
                                >
                                    {t("submitManual")}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </Card>

            <Modal isOpen={showPasswordModal} onClose={closeModal} title={t("modalTitle")}>
                <div className="pt-2 space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t("modalWarning")}</p>
                    <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-4 font-mono text-lg break-all text-center text-slate-900 dark:text-white">
                        {generatedPassword}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="primary" onClick={copyPassword}>
                            {t("copyButton")}
                        </Button>
                        <Button type="button" variant="outline" onClick={closeModal}>
                            {t("modalClose")}
                        </Button>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400">{t("modalFooter")}</p>
                </div>
            </Modal>
        </>
    );
}
