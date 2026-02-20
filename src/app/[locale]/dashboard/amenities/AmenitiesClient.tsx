"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Role } from "@/types/roles";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AmenityTable } from "@/components/amenities/AmenityTable";
import { AmenityForm } from "@/components/amenities/AmenityForm";
import ReservationForm from "@/components/dashboard/reservations/ReservationForm";
import { CreateAmenityInput } from "@/lib/validations/amenity";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "sonner";

export function AmenitiesClient() {
    const t = useTranslations('Amenities');
    const tRes = useTranslations('Reservations');
    const { data: session } = useSession();
    const [amenities, setAmenities] = useState([]);
    const [complexes, setComplexes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedAmenity, setSelectedAmenity] = useState<any>(null);
    const [amenityIdToBook, setAmenityIdToBook] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [amenityToDelete, setAmenityToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isResident = session?.user?.role === Role.RESIDENT;

    const fetchAmenities = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/amenities");
            const data = await response.json();
            if (response.ok) setAmenities(data);
        } catch (error) {
            console.error("Error fetching amenities:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchComplexes = async () => {
        try {
            const response = await fetch("/api/complexes");
            const data = await response.json();
            if (response.ok) setComplexes(data);
        } catch (error) {
            console.error("Error fetching complexes:", error);
        }
    };

    useEffect(() => {
        fetchAmenities();
        fetchComplexes();
    }, []);

    const handleSubmit = async (data: CreateAmenityInput) => {
        setIsSubmitting(true);
        try {
            const url = selectedAmenity
                ? `/api/amenities/${selectedAmenity.id}`
                : "/api/amenities";
            const method = selectedAmenity ? "PATCH" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success(t('successSave'));
                setIsModalOpen(false);
                setSelectedAmenity(null);
                fetchAmenities();
            } else {
                const errorData = await response.json();
                const errorMessage = Array.isArray(errorData.error)
                    ? errorData.error[0]?.message
                    : (errorData.error || t('errorSaving'));
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error("Error saving amenity:", error);
            toast.error(t('unexpectedError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!amenityToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/amenities/${amenityToDelete}`, { method: "DELETE" });
            if (response.ok) {
                toast.success(t('deleted'));
                setIsDeleteModalOpen(false);
                setAmenityToDelete(null);
                fetchAmenities();
            } else {
                const data = await response.json();
                toast.error(data.error || t('errorDeleting'));
            }
        } catch (error) {
            console.error("Error deleting amenity:", error);
            toast.error(t('unexpectedError'));
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEdit = (amenity: any) => {
        setSelectedAmenity(amenity);
        setIsModalOpen(true);
    };

    const handleBook = (id: string) => {
        setAmenityIdToBook(id);
        setIsBookingModalOpen(true);
    };

    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN;

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={
                    isAdmin && (
                        <Button
                            variant="primary"
                            icon="add"
                            onClick={() => {
                                setSelectedAmenity(null);
                                setIsModalOpen(true);
                            }}
                        >
                            {t('new')}
                        </Button>
                    )
                }
            />

            <Card>
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Spinner />
                    </div>
                ) : (
                    <AmenityTable
                        amenities={amenities}
                        onEdit={handleEdit}
                        onDelete={(id) => {
                            setAmenityToDelete(id);
                            setIsDeleteModalOpen(true);
                        }}
                        onBook={isResident ? handleBook : undefined}
                        isAdmin={isAdmin}
                    />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedAmenity ? t('edit') : t('new')}
            >
                <AmenityForm
                    onSubmit={handleSubmit}
                    initialData={selectedAmenity}
                    isLoading={isSubmitting}
                    complexes={complexes}
                />
            </Modal>

            <Modal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                title={tRes('book')}
            >
                <div className="p-4">
                    {amenityIdToBook && (
                        <ReservationForm
                            amenityId={amenityIdToBook}
                        />
                    )}
                </div>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                title={t('confirmDeleteTitle')}
                footer={
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            isLoading={isDeleting}
                        >
                            {isDeleting ? t('deleting') : t('delete')}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        {t('deleteConfirm')}
                    </p>
                </div>
            </Modal>
        </div>
    );
}
