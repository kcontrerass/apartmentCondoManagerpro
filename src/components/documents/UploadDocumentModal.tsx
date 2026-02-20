"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Role } from "@/types/roles";

interface Complex {
    id: string;
    name: string;
}

interface UploadDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    complexId: string;
    userRole?: Role;
}

export function UploadDocumentModal({ isOpen, onClose, onSuccess, complexId, userRole }: UploadDocumentModalProps) {
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [complexes, setComplexes] = useState<Complex[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isSuperAdmin = userRole === Role.SUPER_ADMIN;

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            title: "",
            description: "",
            category: "Reglamento",
            targetComplexId: complexId || "",
        }
    });

    useEffect(() => {
        if (isOpen && isSuperAdmin) {
            fetch("/api/complexes")
                .then(res => res.json())
                .then(data => setComplexes(data))
                .catch(err => console.error("Error fetching complexes", err));
        }
    }, [isOpen, isSuperAdmin]);

    const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];

    const handleFileChange = (file: File | null) => {
        if (!file) return;
        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error("Tipo de archivo no permitido. Solo PDF e imágenes.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("El archivo supera el límite de 10 MB.");
            return;
        }
        setSelectedFile(file);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (type: string) => {
        if (type === "application/pdf") return "picture_as_pdf";
        if (type.startsWith("image/")) return "image";
        return "description";
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileChange(file);
    };

    const onSubmit = async (data: any) => {
        if (!selectedFile) {
            toast.error("Por favor selecciona un archivo.");
            return;
        }

        const finalComplexId = isSuperAdmin ? data.targetComplexId : complexId;

        if (!finalComplexId) {
            toast.error("Debes seleccionar un complejo.");
            return;
        }

        setLoading(true);
        try {
            // Step 1: Upload the file
            const formData = new FormData();
            formData.append("file", selectedFile);

            const uploadRes = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) {
                const err = await uploadRes.json().catch(() => ({}));
                toast.error(err.error || "Error al subir el archivo");
                return;
            }

            const { fileUrl, fileSize, fileType } = await uploadRes.json();

            const saveRes = await fetch("/api/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, complexId: finalComplexId, fileUrl, fileSize, fileType }),
            });

            if (saveRes.ok) {
                toast.success("Documento subido correctamente");
                reset({ ...data, targetComplexId: finalComplexId });
                setSelectedFile(null);
                onSuccess();
                onClose();
            } else {
                const errorData = await saveRes.text();
                console.error("Save Document Error:", saveRes.status, errorData);
                toast.error(`Error al guardar: ${saveRes.status}`);
            }
        } catch (error) {
            console.error("Upload error caught:", error);
            toast.error("Error inesperado al subir el documento");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        reset({ ...useForm().getValues(), targetComplexId: complexId || "" });
        setSelectedFile(null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Subir Nuevo Documento">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                {/* Complex Selection for Super Admin */}
                {isSuperAdmin && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Condominio Destino <span className="text-red-500">*</span></label>
                        <Select
                            {...register("targetComplexId", { required: "Debes seleccionar un condominio" })}
                            options={[
                                { label: "Seleccionar Condominio...", value: "" },
                                ...complexes.map(c => ({ label: c.name, value: c.id }))
                            ]}
                        />
                        {errors.targetComplexId && <p className="text-red-500 text-xs mt-1">{errors.targetComplexId.message as string}</p>}
                    </div>
                )}

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium mb-1">Título</label>
                    <Input
                        {...register("title", { required: "El título es requerido" })}
                        placeholder="Ej: Reglamento Interno 2024"
                        error={errors.title?.message as string}
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-1">Descripción</label>
                    <textarea
                        {...register("description")}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[80px]"
                        placeholder="Breve descripción del documento..."
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium mb-1">Categoría</label>
                    <Select
                        {...register("category")}
                        options={[
                            { label: "Reglamento", value: "Reglamento" },
                            { label: "Política", value: "Politica" },
                            { label: "Acta", value: "Acta" },
                            { label: "Manual", value: "Manual" },
                            { label: "Otro", value: "Otro" },
                        ]}
                    />
                </div>

                {/* File Picker */}
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Archivo <span className="text-red-500">*</span>
                    </label>

                    {selectedFile ? (
                        /* File preview */
                        <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined">{getFileIcon(selectedFile.type)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{selectedFile.name}</p>
                                <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedFile(null)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                                title="Quitar archivo"
                            >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                    ) : (
                        /* Drop zone */
                        <div
                            className={`relative flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${isDragging
                                ? "border-primary bg-primary/5"
                                : "border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                        >
                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">upload_file</span>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Arrastra un archivo aquí o <span className="text-primary">selecciona uno</span>
                            </p>
                            <p className="text-xs text-slate-400">PDF, JPG, PNG, WebP — Máx. 10 MB</p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,image/*"
                                className="hidden"
                                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                            />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={loading} disabled={loading || !selectedFile}>
                        {loading ? "Subiendo..." : "Guardar Documento"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
