"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ComplexSelector } from "@/components/dashboard/ComplexSelector";
import { Role } from "@/types/roles";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useSelectedComplex } from "@/components/providers/ComplexProvider";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";

interface PermissionSettings {
    [role: string]: {
        [module: string]: boolean;
    };
}

export default function SettingsClient({ user }: { user: any }) {
    const { selectedComplexId, setSelectedComplexId } = useSelectedComplex();
    const t = useTranslations("Settings");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [complexId, setLocalComplexId] = useState<string | null>(selectedComplexId);
    const [bankAccount, setBankAccount] = useState("");
    const [phone, setPhone] = useState("");
    const [recurrentePublicKey, setRecurrentePublicKey] = useState("");
    const [recurrenteSecretKey, setRecurrenteSecretKey] = useState("");
    const [recurrenteWebhookSecret, setRecurrenteWebhookSecret] = useState("");
    const [permissions, setPermissions] = useState<PermissionSettings>({
        [Role.ADMIN]: {},
        [Role.RESIDENT]: {},
        [Role.GUARD]: {},
        [Role.BOARD_OF_DIRECTORS]: {}
    });

    // Synchronize local state with global context for SuperAdmin
    useEffect(() => {
        if (user?.role === Role.SUPER_ADMIN && selectedComplexId !== complexId) {
            setLocalComplexId(selectedComplexId);
        }
    }, [selectedComplexId, user?.role, complexId]);

    const setComplexId = (id: string | null) => {
        setLocalComplexId(id);
        if (user?.role === Role.SUPER_ADMIN) {
            setSelectedComplexId(id);
        }
    };

    const allRoles = [
        {
            id: Role.ADMIN,
            label: "Administradores",
            allowedModules: ["units", "residents", "airbnbGuests", "amenities", "reservations", "services", "invoices", "accessControl", "announcements", "events", "communications", "incidents", "staff", "documents", "reports", "polls"]
        },
        {
            id: Role.BOARD_OF_DIRECTORS,
            label: "Junta Directiva",
            allowedModules: ["units", "residents", "airbnbGuests", "amenities", "reservations", "services", "invoices", "accessControl", "announcements", "events", "communications", "incidents", "documents", "staff", "reports", "polls"]
        },
        {
            id: Role.RESIDENT,
            label: "Residentes",
            allowedModules: ["amenities", "reservations", "services", "invoices", "accessControl", "announcements", "events", "communications", "incidents", "documents", "polls", "airbnbGuests"]
        },
        {
            id: Role.GUARD,
            label: "Seguridad / Guardias",
            allowedModules: ["units", "residents", "airbnbGuests", "amenities", "services", "accessControl", "announcements", "events", "communications", "incidents", "documents"]
        }
    ];

    let configurableRoles: typeof allRoles = [];

    if (user?.role === Role.SUPER_ADMIN) {
        configurableRoles = allRoles;
    } else if (user?.role === Role.BOARD_OF_DIRECTORS) {
        // Board can configure everyone except themselves and Super Admin (already excluded)
        configurableRoles = allRoles.filter(r => r.id !== Role.BOARD_OF_DIRECTORS);
    } else if (user?.role === Role.ADMIN) {
        // Admins can only configure Guard and Residents
        configurableRoles = allRoles.filter(r => r.id === Role.GUARD || r.id === Role.RESIDENT);
    }

    const availableModules = [
        { id: "units", label: "Unidades" },
        { id: "residents", label: "Residentes" },
        { id: "airbnbGuests", label: t("moduleAirbnbGuests") },
        { id: "amenities", label: "Amenidades (Áreas Comunes)" },
        { id: "reservations", label: "Reservaciones" },
        { id: "services", label: "Servicios (Mantenimiento, etc)" },
        { id: "invoices", label: "Facturación y Cobros" },
        { id: "accessControl", label: "Control de Acceso" },
        { id: "announcements", label: "Anuncios y Comunicados" },
        { id: "events", label: "Eventos" },
        { id: "communications", label: "Foro / Comunicaciones" },
        { id: "incidents", label: "Reporte de Incidentes" },
        { id: "staff", label: "Personal" },
        { id: "documents", label: "Documentos" },
        { id: "reports", label: "Reportes y Estadísticas" },
        { id: "polls", label: "Votaciones Digitales" }
    ];

    const fetchSettings = async (id: string) => {
        setIsLoading(true);
        try {
            const complexRes = await fetch(`/api/complexes/${id}`);
            if (complexRes.ok) {
                const complexData = await complexRes.json();
                const fullSettings = complexData.settings || {};
                const existingPerRole = fullSettings.permissions || {};
                const legacyAirbnbOff = fullSettings.airbnbGuestsEnabled === false;

                const mergedPermissions: PermissionSettings = {
                    [Role.ADMIN]: {},
                    [Role.RESIDENT]: {},
                    [Role.GUARD]: {},
                    [Role.BOARD_OF_DIRECTORS]: {}
                };

                const rolesToPopulate = [Role.ADMIN, Role.RESIDENT, Role.GUARD, Role.BOARD_OF_DIRECTORS];

                rolesToPopulate.forEach(roleId => {
                    availableModules.forEach(mod => {
                        let on = existingPerRole[roleId]?.[mod.id] !== false;
                        if (mod.id === "airbnbGuests" && legacyAirbnbOff) {
                            on = false;
                        }
                        mergedPermissions[roleId][mod.id] = on;
                    });
                });

                setPermissions(mergedPermissions);
                setBankAccount(complexData.bankAccount || "");
                setPhone(complexData.phone || "");
                setRecurrentePublicKey(fullSettings.recurrente?.publicKey || "");
                setRecurrenteSecretKey(fullSettings.recurrente?.secretKey || "");
                setRecurrenteWebhookSecret(fullSettings.recurrente?.webhookSecret || "");
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Error al cargar configuración", {
                className: "bg-red-500 text-white border-0",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Obtain initial complexId if none has been selected
    useEffect(() => {
        const fetchInitialComplex = async () => {
            try {
                const profileRes = await fetch('/api/users/profile');
                if (profileRes.ok) {
                    const profileData = await profileRes.json();

                    const recoveredId = profileData.complexId ||
                        (profileData.managedComplexes?.[0]?.id) ||
                        (profileData.residentProfile?.unit?.complexId);

                    if (recoveredId && !complexId) {
                        setComplexId(recoveredId);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile for initial complex:", error);
            }
        };

        if (!complexId && user?.role !== Role.SUPER_ADMIN) {
            fetchInitialComplex();
        } else if (!complexId && user?.role === Role.SUPER_ADMIN) {
            fetchInitialComplex();
        }
    }, [complexId, user?.role]);

    // Render permissions when complexId is updated
    useEffect(() => {
        if (complexId) {
            fetchSettings(complexId);
        }
    }, [complexId]);

    const handleToggle = (roleId: string, moduleId: string) => {
        setPermissions(prev => {
            const newState = !prev[roleId][moduleId];
            const updatedRole = { ...prev[roleId], [moduleId]: newState };

            // Cascade turn off reservations if amenities are turned off
            if (moduleId === 'amenities' && !newState) {
                updatedRole['reservations'] = false;
            }
            if (moduleId === 'residents' && !newState) {
                updatedRole['airbnbGuests'] = false;
            }

            return {
                ...prev,
                [roleId]: updatedRole
            };
        });
    };

    const handleSave = async () => {
        if (!complexId) {
            toast.error(t('errorComplex'));
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`/api/complexes/${complexId}/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    settings: { 
                        permissions,
                        recurrente: {
                            publicKey: recurrentePublicKey.trim(),
                            secretKey: recurrenteSecretKey.trim(),
                            webhookSecret: recurrenteWebhookSecret.trim()
                        }
                    },
                    bankAccount,
                    phone
                })
            });

            if (!response.ok) throw new Error("Failed to save settings");

            toast.success(t('success'), {
                description: t('successDesc'),
                className: "bg-green-50 text-green-700 border-green-200",
            });

            // Reload window to apply new sidebar constraints immediately
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error("Save error:", error);
            toast.error(t('error'), {
                description: t('errorDesc'),
                className: "bg-red-50 text-red-700 border-red-200",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={
                    <>
                        <PWAInstallButton />
                        {(user?.role === Role.SUPER_ADMIN || user?.role === Role.ADMIN) && (
                            <div className="w-full min-w-0 sm:flex-1 sm:min-w-[12rem] sm:max-w-md">
                                <ComplexSelector
                                    value={complexId}
                                    onChange={(id) => setComplexId(id)}
                                    label={t('complexSelectLabel')}
                                />
                            </div>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || isLoading || !complexId}
                            className="h-11 w-full min-h-[44px] justify-center sm:h-[42px] sm:w-auto sm:shrink-0 sm:px-6"
                        >
                            {isSaving ? (
                                <><span className="material-symbols-outlined animate-spin mr-2">progress_activity</span> {t('saving')}</>
                            ) : (
                                <><span className="material-symbols-outlined mr-2">save</span> {t('save')}</>
                            )}
                        </Button>
                    </>
                }
            />

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                </div>
            ) : !complexId ? (
                <div className="text-center p-12 bg-slate-50 dark:bg-background-dark/50 rounded-lg">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">domain</span>
                    <p className="text-sm text-slate-500">{t('selectComplexHelp')}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Payment Information Section - Visible to Admin & Board */}
                    <Card className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">payments</span>
                            {t('paymentsTitle')}
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    {t('bankAccountLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={bankAccount}
                                    onChange={(e) => setBankAccount(e.target.value)}
                                    placeholder={t('bankAccountPlaceholder')}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    {t('bankAccountHelp')}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    {t('whatsappLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Ej: 50212345678"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    {t('whatsappHelp')}
                                </p>
                            </div>

                            <div className="lg:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{t('recurrenteConfigTitle', { default: 'Configuración de la pasarela de pagos' })}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                                    {t('platformRecurrenteHint')}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    {t('recurrentePublicLabel', { default: 'Public Key' })}
                                </label>
                                <input
                                    type="text"
                                    value={recurrentePublicKey}
                                    onChange={(e) => setRecurrentePublicKey(e.target.value)}
                                    placeholder="pk_test_..."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    {t('recurrenteSecretLabel', { default: 'Secret Key' })}
                                </label>
                                <input
                                    type="password"
                                    value={recurrenteSecretKey}
                                    onChange={(e) => setRecurrenteSecretKey(e.target.value)}
                                    placeholder="sk_test_..."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark text-sm"
                                />
                            </div>

                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    {t('recurrenteWebhookLabel', { default: 'Webhook Secret' })}
                                </label>
                                <input
                                    type="password"
                                    value={recurrenteWebhookSecret}
                                    onChange={(e) => setRecurrenteWebhookSecret(e.target.value)}
                                    placeholder="wh_sec_..."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark text-sm"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    {t('recurrenteWebhookHelp', { default: 'Secret necesario para validar pagos en automático. Déjalo en blanco si aún no tienes uno.' })}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {configurableRoles.map((role) => (
                            <Card key={role.id} className="p-6">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                                    {role.label}
                                </h3>
                                <div className="space-y-4">
                                    {availableModules
                                        .filter(module => role.allowedModules.includes(module.id))
                                        .map((module) => {
                                            const isReservationsAndAmenitiesOff = module.id === 'reservations' && permissions[role.id]?.['amenities'] === false;
                                            const isAirbnbAndResidentsOff =
                                                module.id === 'airbnbGuests' &&
                                                role.id !== Role.RESIDENT &&
                                                permissions[role.id]?.['residents'] === false;
                                            const toggleDisabled = isReservationsAndAmenitiesOff || isAirbnbAndResidentsOff;

                                            return (
                                                <div key={`${role.id}-${module.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 min-w-0 gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block truncate">
                                                            {module.label}
                                                        </span>
                                                        {isReservationsAndAmenitiesOff && (
                                                            <span className="block text-[10px] text-slate-400 mt-0.5 truncate uppercase tracking-tight">{t('amenitiesRequired')}</span>
                                                        )}
                                                        {isAirbnbAndResidentsOff && (
                                                            <span className="block text-[10px] text-slate-400 mt-0.5 truncate uppercase tracking-tight">{t('airbnbGuestsRequiresResidents')}</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        disabled={toggleDisabled}
                                                        onClick={() => !toggleDisabled && handleToggle(role.id, module.id)}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 ${toggleDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"} items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${permissions[role.id]?.[module.id] ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`}
                                                    >
                                                        <span className="sr-only">{t('enableModule', { module: module.label })}</span>
                                                        <span
                                                            aria-hidden="true"
                                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${permissions[role.id]?.[module.id] ? "translate-x-5" : "translate-x-0"}`}
                                                        />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
