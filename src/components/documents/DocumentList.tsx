"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Role } from "@/types/roles";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { toast } from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { useTranslations } from "next-intl";

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

function getViewFileNotation(fileType: string | null, fileUnknown: string): string {
    if (!fileType) return fileUnknown;

    const normalized = fileType.split(";")[0].trim().toLowerCase();
    if (normalized.includes("pdf")) return "PDF";

    const subtype = normalized.split("/")[1];
    if (!subtype) return fileUnknown;

    return subtype.toUpperCase();
}

export function DocumentList({ userRole, complexId }: DocumentListProps) {
    const t = useTranslations("Documents");
    const tCommon = useTranslations("Common");
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

    const fetchDocuments = useCallback(async () => {
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
    }, [complexId]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const canManage = userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN || userRole === Role.BOARD_OF_DIRECTORS;

    const handleDelete = async () => {
        if (!documentToDelete) return;

        try {
            const response = await fetch(`/api/documents/${documentToDelete}`, { method: "DELETE" });
            if (response.ok) {
                toast.success(t("toastDeleted"));
                setDocumentToDelete(null);
                fetchDocuments();
            } else {
                toast.error(t("toastDeleteError"));
            }
        } catch {
            toast.error(t("toastDeleteError"));
        }
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return t("notAvailable");
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
                        {t("addDocument")}
                    </Button>
                </div>
            )}

            {documents.length === 0 ? (
                <Card className="p-12 text-center text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-4 text-slate-300">description</span>
                    <p>{t("empty")}</p>
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
                                            title={tCommon("delete")}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    )}
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">
                                    {doc.title}
                                </h3>
                                <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                                    {doc.description || t("noDescription")}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <div className="text-xs text-slate-400">
                                    <p>{formatFileSize(doc.fileSize)}</p>
                                    <p>{new Date(doc.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-primary/80 font-semibold text-sm flex items-center gap-1"
                                    >
                                        {t("viewWithType", {
                                            type: getViewFileNotation(doc.fileType, t("fileUnknown")),
                                        })}{" "}
                                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                    </a>
                                    <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary font-semibold text-sm flex items-center gap-1"
                                    >
                                        {t("download")} <span className="material-symbols-outlined text-[16px]">download</span>
                                    </a>
                                </div>
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
                title={t("deleteModalTitle")}
            >
                <div className="pt-4 space-y-4">
                    <p className="text-slate-600 dark:text-slate-300">
                        {t("deleteModalMessage")}
                    </p>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            variant="outline"
                            onClick={() => setDocumentToDelete(null)}
                        >
                            {tCommon("cancel")}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                        >
                            {t("deleteDocument")}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
