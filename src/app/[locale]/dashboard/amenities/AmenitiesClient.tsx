"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AmenityTable } from "@/components/amenities/AmenityTable";
import { AmenityForm } from "@/components/amenities/AmenityForm";
import ReservationForm from "@/components/dashboard/reservations/ReservationForm";
import { CreateAmenityInput } from "@/lib/validations/amenity";
import { Spinner } from "@/components/ui/Spinner";

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
                setIsModalOpen(false);
                setSelectedAmenity(null);
                fetchAmenities();
            } else {
                const errorData = await response.json();
                const errorMessage = Array.isArray(errorData.error)
                    ? errorData.error[0]?.message
                    : (errorData.error || t('errorSaving'));
                alert(errorMessage);
            }
        } catch (error) {
            console.error("Error saving amenity:", error);
            alert(t('unexpectedError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return;

        try {
            const response = await fetch(`/api/amenities/${id}`, { method: "DELETE" });
            if (response.ok) {
                fetchAmenities();
            }
        } catch (error) {
            console.error("Error deleting amenity:", error);
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

    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN || session?.user?.role === Role.OPERATOR;

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
                        onDelete={handleDelete}
                        onBook={handleBook}
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
        </div>
    );
}
