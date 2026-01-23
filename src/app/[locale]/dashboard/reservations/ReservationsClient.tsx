"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/dashboard/PageHeader";
import ReservationTable from "@/components/dashboard/reservations/ReservationTable";
import ReservationList from "@/components/dashboard/reservations/ReservationList";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getReservations, updateReservation } from "@/lib/api/reservations";
import { Spinner } from "@/components/ui/Spinner";

export function ReservationsClient() {
    const t = useTranslations('Reservations');
    const tCommon = useTranslations('Common');
    const { data: session } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reservations, setReservations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isResident = session?.user?.role === Role.RESIDENT;
    const isAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.SUPER_ADMIN || session?.user?.role === Role.OPERATOR;

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

    const handleCancel = async (id: string) => {
        if (!confirm(t('cancelConfirm'))) return;
        try {
            await updateReservation(id, { status: "CANCELLED" as any });
            fetchReservations();
        } catch (error) {
            console.error(error);
        }
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
                                    onCancel={handleCancel}
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
                    <p className="text-sm text-slate-500 mb-4">
                        {t('adminPlaceholder')}
                    </p>
                    <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="w-full">
                        {tCommon('close')}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
