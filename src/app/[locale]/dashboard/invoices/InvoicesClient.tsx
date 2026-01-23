"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { InvoiceGenerationModal } from "@/components/invoices/InvoiceGenerationModal";
import { InvoiceDetailModal } from "@/components/invoices/InvoiceDetailModal";
import { GenerateInvoicesSchema } from "@/lib/validations/invoice";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

export function InvoicesClient() {
    const t = useTranslations('Invoices');

    const [invoices, setInvoices] = useState<any[]>([]);
    const [complexes, setComplexes] = useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data: session } = useSession();

    const isResident = session?.user?.role === Role.RESIDENT;
    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN;

    useEffect(() => {
        const fetchComplexes = async () => {
            try {
                const response = await fetch("/api/complexes");
                const data = await response.json();
                if (response.ok) setComplexes(data);
            } catch (error) {
                console.error("Error fetching complexes:", error);
            }
        };
        fetchComplexes();
    }, []);

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/invoices");
            const data = await response.json();
            if (response.ok) {
                setInvoices(data);
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleGenerate = async (data: GenerateInvoicesSchema) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/invoices/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (response.ok) {
                alert(t('successGenerate', { count: result.generated, skipped: result.skipped }));
                setIsGenerateModalOpen(false);
                fetchInvoices();
            } else {
                alert(result.error || "Error al generar facturas");
            }
        } catch (error) {
            console.error("Error generating invoices:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const response = await fetch(`/api/invoices/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (response.ok) {
                fetchInvoices();
            }
        } catch (error) {
            console.error("Error updating invoice status:", error);
        }
    };

    const handlePay = async (invoice: any) => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/payments/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invoiceId: invoice.id }),
            });

            const data = await response.json();
            if (response.ok && data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || "Error al iniciar el pago");
            }
        } catch (error) {
            console.error("Error initiating payment:", error);
            alert("Ocurrió un error al procesar el pago");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleViewDetail = async (invoice: any) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/invoices/${invoice.id}`);
            const data = await response.json();
            if (response.ok) {
                setSelectedInvoice(data);
                setIsDetailModalOpen(true);
            }
        } catch (error) {
            console.error("Error fetching invoice detail:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={
                    isAdmin && (
                        <Button
                            variant="primary"
                            icon="receipt_long"
                            onClick={() => setIsGenerateModalOpen(true)}
                        >
                            {t('generate')}
                        </Button>
                    )
                }
            />

            <Card>
                {isLoading && invoices.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <Spinner />
                    </div>
                ) : (
                    <InvoiceTable
                        invoices={invoices}
                        onViewDetail={handleViewDetail}
                        onUpdateStatus={handleUpdateStatus}
                        onPay={isResident ? handlePay : undefined}
                    />
                )}
            </Card>

            <Modal
                isOpen={isGenerateModalOpen}
                onClose={() => setIsGenerateModalOpen(false)}
                title={t('modal.generateTitle')}
            >
                <InvoiceGenerationModal
                    onSubmit={handleGenerate}
                    isLoading={isSubmitting}
                    complexes={complexes}
                />
            </Modal>

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedInvoice(null);
                }}
                title={t('detail.title')}
            >
                <InvoiceDetailModal invoice={selectedInvoice} />
            </Modal>
        </div>
    );
}
