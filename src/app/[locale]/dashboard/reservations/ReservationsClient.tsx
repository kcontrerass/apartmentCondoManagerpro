"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Role } from "@/types/roles";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/dashboard/PageHeader";
import ReservationTable from "@/components/dashboard/reservations/ReservationTable";
import ReservationList from "@/components/dashboard/reservations/ReservationList";
import ReservationForm from "@/components/dashboard/reservations/ReservationForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getReservations, updateReservation } from "@/lib/api/reservations";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "sonner";

export function ReservationsClient() {
    const t = useTranslations('Reservations');
    const tCommon = useTranslations('Common');
    const { data: session } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reservations, setReservations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    const isResident = session?.user?.role === Role.RESIDENT;
    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN || session?.user?.role === Role.BOARD_OF_DIRECTORS;

    const fetchReservations = async () => {
        setIsLoading(true);
        try {
            const data = await getReservations();
            setReservations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleCancel = async () => {
        if (!reservationToCancel) return;
        setIsCancelling(true);
        try {
            await updateReservation(reservationToCancel, { status: "CANCELLED" as any });
            toast.success(t('cancelledSuccess'));
            setIsCancelModalOpen(false);
            setReservationToCancel(null);
            fetchReservations();
        } catch (error) {
            console.error(error);
            toast.error(t('cancelError'));
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={
                    isResident && (
                        <Button
                            variant="primary"
                            icon="add"
                            onClick={() => setIsModalOpen(true)}
                        >
                            {t('new')}
                        </Button>
                    )
                }
            />

            <Card>
                <div className="p-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Spinner />
                        </div>
                    ) : (
                        <>
                            {isResident ? (
                                <ReservationList
                                    reservations={reservations}
                                    onCancel={(id) => {
                                        setReservationToCancel(id);
                                        setIsCancelModalOpen(true);
                                    }}
                                />
                            ) : (
                                <ReservationTable />
                            )}
                        </>
                    )}
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t('new')}
            >
                <div className="p-4">
                    <ReservationForm
                        onSuccess={() => {
                            setIsModalOpen(false);
                            fetchReservations();
                        }}
                    />
                </div>
            </Modal>

            <Modal
                isOpen={isCancelModalOpen}
                onClose={() => !isCancelling && setIsCancelModalOpen(false)}
                title={t('confirmCancelTitle')}
                footer={
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setIsCancelModalOpen(false)}
                            disabled={isCancelling}
                        >
                            {tCommon('cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleCancel}
                            isLoading={isCancelling}
                        >
                            {isCancelling ? t('cancelling') : t('confirmCancel')}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        {t('cancelConfirm')}
                    </p>
                </div>
            </Modal>
        </div>
    );
}
