"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    SOFTWARE_TERMS_DOC_TITLE,
    SOFTWARE_TERMS_META_LINES,
    SOFTWARE_TERMS_PREAMBLE,
    SOFTWARE_TERMS_SECTIONS,
    getDefaultTermsText
} from "@/content/software-terms-document";

interface SuperAdminTermsFormProps {
    initialTerms: string;
}

export function SuperAdminTermsForm({ initialTerms }: SuperAdminTermsFormProps) {
    const [terms, setTerms] = useState(initialTerms || "");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Send request to platform config endpoint updating termsBody
            const response = await fetch("/api/platform/recurrente-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    termsBody: terms.trim()
                }),
            });

            if (response.ok) {
                toast.success("Términos y condiciones actualizados correctamente.");
                router.refresh();
            } else {
                const data = await response.json().catch(() => ({}));
                toast.error(
                    data?.error?.message || "No se pudieron actualizar los términos."
                );
            }
        } catch {
            toast.error("Error de conexión al guardar los términos.");
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreDefault = () => {
        const defaultText = getDefaultTermsText();
        setTerms(defaultText);
        toast.info("Texto preestablecido cargado. Presiona Guardar para aplicar.");
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Modifica los términos y condiciones de la plataforma aquí. Este texto se mostrará a los residentes al registrarse y al realizar pagos de suscripción.
                </p>
                <textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-sans resize-y min-h-[250px] leading-relaxed"
                    placeholder="Escribe los términos y condiciones aquí..."
                    required
                />
            </div>

            <div className="flex flex-wrap gap-3 justify-start">
                <Button type="submit" isLoading={loading} disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Términos"}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleRestoreDefault}
                    disabled={loading}
                >
                    Restaurar por defecto
                </Button>
            </div>
        </form>
    );
}
