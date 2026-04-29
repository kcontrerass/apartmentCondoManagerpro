"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
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
import { Input } from "@/components/ui/Input";

interface AmenitiesClientProps {
    user: any;
}

export function AmenitiesClient({ user }: AmenitiesClientProps) {
    const t = useTranslations('Amenities');
    const tRes = useTranslations('Reservations');

    const [amenities, setAmenities] = useState([]);
    const [complexes, setComplexes] = useState<Array<{ id: string; name: string; type?: string | null }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedAmenity, setSelectedAmenity] = useState<any>(null);
    const [amenityIdToBook, setAmenityIdToBook] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [amenityToDelete, setAmenityToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const userRole = user?.role as Role;
    const isResident = userRole === Role.RESIDENT;
    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN || userRole === Role.BOARD_OF_DIRECTORS;

    // Safety check for complexId if not Super Admin
    const [complexId, setComplexId] = useState<string | null>(user?.complexId || null);
    const [scopedComplexType, setScopedComplexType] = useState<string | null>(null);

    const fetchAmenities = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            const q = debouncedSearch.trim();
            if (q) params.append("search", q);
            const url = params.toString() ? `/api/amenities?${params.toString()}` : "/api/amenities";
            const response = await fetch(url);
            const data = await response.json();
            if (response.ok) setAmenities(data);
        } catch (error) {
            console.error("Error fetching amenities:", error);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch]);

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
        const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchAmenities();
    }, [fetchAmenities]);

    useEffect(() => {
        fetchComplexes();
    }, []);

    useEffect(() => {
        if (!complexId) {
            setScopedComplexType(null);
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const r = await fetch(`/api/complexes/${complexId}`);
                if (!r.ok) return;
                const d = await r.json();
                if (!cancelled) {
                    setScopedComplexType(typeof d.type === "string" ? d.type : null);
                }
            } catch {
                /* ignore */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [complexId]);

    // Proactive complexId recovery for users with stale sessions
    useEffect(() => {
        const recoverComplexId = async () => {
            if (!complexId && userRole !== Role.SUPER_ADMIN && user?.id) {
                console.log(`[Amenities] 🔍 Attempting complexId recovery...`);
                try {
                    const response = await fetch('/api/users/profile');
                    if (response.ok) {
                        const profileData = await response.json();
                        const recoveredId = profileData.complexId ||
                            (profileData.managedComplexes?.[0]?.id) ||
                            (profileData.residentProfile?.unit?.complexId);

                        if (recoveredId) {
                            console.log(`[Amenities] ✅ Recovered complexId: ${recoveredId}`);
                            setComplexId(recoveredId);
                        }
                    }
                } catch (error) {
                    console.error('[Amenities] ❌ Failed to recover complexId:', error);
                }
            }
        };

        recoverComplexId();
    }, [complexId, userRole, user?.id]);

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
                <div className="p-4 space-y-4">
                    <div className="relative max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
                            search
                        </span>
                        <Input
                            type="search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder={t("searchPlaceholder")}
                            className="pl-10"
                            aria-label={t("searchPlaceholder")}
                        />
                    </div>

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
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedAmenity ? t('edit') : t('new')}
            >
                <AmenityForm
                    onSubmit={handleSubmit}
                    initialData={
                        selectedAmenity
                            ? selectedAmenity
                            : complexId
                              ? ({ complexId } as Partial<CreateAmenityInput>)
                              : undefined
                    }
                    isLoading={isSubmitting}
                    complexes={complexes}
                    complexTypeHint={scopedComplexType}
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
