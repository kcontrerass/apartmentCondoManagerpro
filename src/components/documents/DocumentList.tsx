"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Role } from "@/types/roles";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { toast } from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";

interface Document {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    fileUrl: string;
    fileSize: number | null;
    fileType: string | null;
    createdAt: string;
    author: { name: string };
}

interface DocumentListProps {
    userRole: Role;
    complexId: string;
}

export function DocumentList({ userRole, complexId }: DocumentListProps) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

    const fetchDocuments = async () => {
        try {
            const response = await fetch(`/api/documents?complexId=${complexId}`);
            if (response.ok) {
                const data = await response.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error("Error fetching documents", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [complexId]);

    const canManage = userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN;

    const handleDelete = async () => {
        if (!documentToDelete) return;

        try {
            const response = await fetch(`/api/documents/${documentToDelete}`, { method: "DELETE" });
            if (response.ok) {
                toast.success("Documento eliminado");
                setDocumentToDelete(null);
                fetchDocuments();
            } else {
                toast.error("Error al eliminar");
            }
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "N/A";
        const units = ["B", "KB", "MB", "GB"];
        let size = bytes;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        return `${size.toFixed(1)} ${units[unitIndex]}`;
    };

    if (loading) {
        return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Card key={i} className="h-40 animate-pulse bg-slate-100" />)}
        </div>;
    }

    return (
        <div className="space-y-6">
            {canManage && (
                <div className="flex justify-end">
                    <Button onClick={() => setIsModalOpen(true)}>
                        <span className="material-symbols-outlined mr-2">upload</span>
                        Agregar Documento
                    </Button>
                </div>
            )}

            {documents.length === 0 ? (
                <Card className="p-12 text-center text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-4 text-slate-300">description</span>
                    <p>No hay documentos disponibles en este complejo.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.map((doc) => (
                        <Card key={doc.id} className="p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">
                                            {doc.fileType?.includes('pdf') ? 'picture_as_pdf' : doc.fileType?.includes('image') ? 'image' : 'description'}
                                        </span>
                                    </div>
                                    {canManage && (
                                        <button
                                            type="button"
                                            onClick={() => setDocumentToDelete(doc.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    )}
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                                    {doc.title}
                                </h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                                    {doc.description || "Sin descripción"}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div className="text-xs text-slate-400">
                                    <p>{formatFileSize(doc.fileSize)}</p>
                                    <p>{new Date(doc.createdAt).toLocaleDateString()}</p>
                                </div>
                                <a
                                    href={doc.fileUrl.startsWith('/') ? doc.fileUrl : `/${doc.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center gap-1"
                                >
                                    Ver <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                </a>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <UploadDocumentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchDocuments}
                complexId={complexId}
                userRole={userRole}
            />

            <Modal
                isOpen={documentToDelete !== null}
                onClose={() => setDocumentToDelete(null)}
                title="Eliminar Documento"
            >
                <div className="pt-4 space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">
                        ¿Estás seguro de que deseas eliminar este documento? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            variant="outline"
                            onClick={() => setDocumentToDelete(null)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                        >
                            Eliminar Documento
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
