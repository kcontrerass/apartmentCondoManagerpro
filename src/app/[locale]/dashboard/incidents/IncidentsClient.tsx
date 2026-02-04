'use client';

import React, { useEffect, useState } from 'react';
import { useIncidents } from '@/hooks/useIncidents';
import { useComplexes } from '@/hooks/useComplexes';
import IncidentTable from '@/components/incidents/IncidentTable';
import IncidentForm from '@/components/incidents/IncidentForm';
import { IncidentListItem, IncidentStatus } from '@/types/incident';
import { Role } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'react-hot-toast';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';

interface IncidentsClientProps {
    userRole: Role;
    userComplexId?: string;
    residentComplexId?: string;
    residentUnitId?: string;
}

export default function IncidentsClient({
    userRole,
    userComplexId,
    residentComplexId,
    residentUnitId
}: IncidentsClientProps) {
    const [userRoleState, setUserRoleState] = useState<Role>(userRole);
    const [complexId, setComplexId] = useState<string | null>(userComplexId || residentComplexId || null);
    const [isRecovering, setIsRecovering] = useState(false);

    // Sync complexId if props change
    useEffect(() => {
        if (userComplexId || residentComplexId) {
            setComplexId(userComplexId || residentComplexId || null);
        }
    }, [userComplexId, residentComplexId]);

    // Proactive complexId recovery for users with stale sessions
    useEffect(() => {
        const recoverComplexId = async () => {
            // If we have an ID but no complexId, and we're not Super Admin
            if (!complexId && userRole !== Role.SUPER_ADMIN) {
                console.log(`[Incidents] 🔍 Attempting complexId recovery...`);
                setIsRecovering(true);
                try {
                    const response = await fetch('/api/users/profile');
                    if (response.ok) {
                        const profileData = await response.json();
                        const recoveredId = profileData.complexId ||
                            (profileData.managedComplexes?.[0]?.id) ||
                            (profileData.residentProfile?.unit?.complexId);

                        if (recoveredId) {
                            console.log(`[Incidents] ✅ Recovered complexId: ${recoveredId}`);
                            setComplexId(recoveredId);
                        }
                    }
                } catch (error) {
                    console.error('[Incidents] ❌ Failed to recover complexId:', error);
                } finally {
                    setIsRecovering(false);
                }
            }
        };

        recoverComplexId();
    }, [complexId, userRole]);

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const {
        incidents,
        loading: hookLoading,
        fetchIncidents,
        reportIncident,
        updateIncident,
        deleteIncident
    } = useIncidents(userRole !== (Role.SUPER_ADMIN as any) ? (complexId || undefined) : undefined);

    const loading = hookLoading || isRecovering;

    useEffect(() => {
        if (complexId || userRole === Role.SUPER_ADMIN) {
            fetchIncidents();
        }
    }, [fetchIncidents, complexId, userRole]);

    const handleReport = async (data: any) => {
        setSubmitting(true);
        try {
            await reportIncident(data);
            toast.success('Incidente reportado correctamente');
            setIsReportModalOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Error al reportar incidente');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: IncidentStatus) => {
        try {
            await updateIncident(id, { status });
            toast.success(`Estado actualizado a ${status}`);
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar estado');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este incidente?')) return;
        try {
            await deleteIncident(id);
            toast.success('Incidente eliminado');
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar incidente');
        }
    };

    // Prepare list items
    const incidentListItems: IncidentListItem[] = (incidents as any[]).map(inc => ({
        id: inc.id,
        title: inc.title,
        status: inc.status,
        priority: inc.priority,
        type: inc.type,
        createdAt: inc.createdAt,
        reporterName: inc.reporter?.name || 'Anónimo',
        complexName: inc.complex?.name,
        unitNumber: inc.unit?.number
    }));

    const canReport = [Role.RESIDENT, Role.ADMIN, Role.OPERATOR, (Role.SUPER_ADMIN as any)].includes(userRole);
    const canManage = [Role.ADMIN, Role.OPERATOR, (Role.SUPER_ADMIN as any), Role.GUARD].includes(userRole);
    const canDelete = String(userRole) === 'RESIDENT'; // Only Residents can delete their own reports (if they are REPORTED)

    return (
        <div className="space-y-6">
            <Breadcrumbs />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white items-center flex gap-3">
                        <span className="material-symbols-outlined text-3xl text-primary">report</span>
                        Reportes e Incidentes
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Gestiona y reporta problemas dentro del complejo.
                    </p>
                </div>

                {canReport && (
                    <Button
                        onClick={() => setIsReportModalOpen(true)}
                        className="shadow-xl shadow-primary/20"
                        icon="add_circle"
                    >
                        Reportar Incidente
                    </Button>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <IncidentTable
                        incidents={incidentListItems}
                        onUpdateStatus={handleUpdateStatus}
                        onDelete={handleDelete}
                        canManage={canManage}
                        canDelete={canDelete}
                    />
                )}
            </div>

            <Modal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                title="Nuevo Reporte de Incidente"
            >
                <IncidentForm
                    complexId={complexId || ''}
                    unitId={residentUnitId}
                    onSubmit={handleReport}
                    isLoading={submitting}
                />
            </Modal>
        </div>
    );
}
