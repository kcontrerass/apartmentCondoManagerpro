import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ResidentAirbnbForm } from "@/components/profile/ResidentAirbnbForm";
import { PasswordForm } from "@/components/profile/PasswordForm";
import { Role } from "@/types/roles";
import { NotificationManager } from "@/components/pwa/NotificationManager";
import { PWAInstallButton } from "@/components/pwa/PWAInstallButton";
import { getTranslations } from "next-intl/server";
import { roleCanResidentUseAirbnbSelfService } from "@/lib/complex-airbnb-guests";

export default async function ProfilePage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Profile" });
    const session = await auth();
    if (!session?.user) return null;

    const user = await (prisma as any).user.findUnique({
        where: { id: session.user.id },
        include: {
            managedComplexes: {
                select: { name: true }
            },
            residentProfile: {
                include: {
                    unit: {
                        include: {
                            complex: {
                                select: { name: true, settings: true }
                            }
                        }
                    }
                }
            },
            assignedComplex: {
                select: { name: true }
            }
        }
    });

    if (!user) {
        notFound();
    }

    const complexName = user.role === 'RESIDENT'
        ? user.residentProfile?.unit?.complex?.name
        : user.assignedComplex?.name || user.managedComplexes?.name;

    const roleLabels: Record<string, string> = {
        SUPER_ADMIN: t("roles.SUPER_ADMIN"),
        ADMIN: t("roles.ADMIN"),
        BOARD_OF_DIRECTORS: t("roles.BOARD_OF_DIRECTORS"),
        GUARD: t("roles.GUARD"),
        RESIDENT: t("roles.RESIDENT"),
    };
    const statusLabels: Record<string, string> = {
        ACTIVE: t("status.ACTIVE"),
        INACTIVE: t("status.INACTIVE"),
        SUSPENDED: t("status.SUSPENDED"),
    };
    const roleLabel = roleLabels[user.role] ?? user.role;
    const statusLabel = statusLabels[user.status] ?? user.status;
    const airbnbGuestsEnabled = roleCanResidentUseAirbnbSelfService(
        user.residentProfile?.unit?.complex?.settings
    );

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title={t("title")}
                    subtitle={t("subtitle")}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User Summary Card */}
                    <Card className="p-8 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-4 ring-4 ring-primary/5">
                            {user.image ? (
                                <img src={user.image} alt={user.name || ''} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                user.name?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {user.name}
                        </h2>
                        <p className="text-slate-500 mb-4">{user.email}</p>
                        <div className="flex gap-2 mb-6">
                            <Badge variant="info">{roleLabel}</Badge>
                            <Badge variant={user.status === 'ACTIVE' ? 'success' : 'neutral'}>
                                {statusLabel}
                            </Badge>
                        </div>
                        <div className="w-full pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500">{t("memberSince")}</span>
                                <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">{t("complex")}</span>
                                <span className="font-medium text-primary">{complexName || t("global")}</span>
                            </div>
                        </div>

                        <div className="w-full mt-6">
                            <NotificationManager />
                            <div className="mt-3 flex justify-center">
                                <PWAInstallButton />
                            </div>
                        </div>
                    </Card>

                    {/* Interactive Forms */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person</span>
                                {t("personalInfo")}
                            </h3>
                            <ProfileForm
                                user={{
                                    name: user.name,
                                    email: user.email,
                                    phone: user.phone,
                                    role: user.role,
                                }}
                            />
                        </Card>

                        {user.role === Role.RESIDENT && user.residentProfile && (
                            <Card className="p-8">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">holiday_village</span>
                                    {t("airbnb.title")}
                                </h3>
                                {airbnbGuestsEnabled ? (
                                    <ResidentAirbnbForm
                                        initial={{
                                            isAirbnb: user.residentProfile.isAirbnb,
                                            airbnbStartDate: user.residentProfile.airbnbStartDate,
                                            airbnbEndDate: user.residentProfile.airbnbEndDate,
                                            airbnbGuestName: user.residentProfile.airbnbGuestName,
                                            airbnbReservationCode: user.residentProfile.airbnbReservationCode,
                                            airbnbGuestPhone: user.residentProfile.airbnbGuestPhone,
                                            airbnbGuestIdentification: user.residentProfile.airbnbGuestIdentification,
                                        }}
                                    />
                                ) : (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {t("airbnb.disabledByComplex")}
                                    </p>
                                )}
                            </Card>
                        )}

                        <Card className="p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-600">
                                <span className="material-symbols-outlined">security</span>
                                {t("security")}
                            </h3>
                            <PasswordForm />
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
