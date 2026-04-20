import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Role } from "@/types/roles";
import { ResidentAdminResetPassword } from "@/components/residents/ResidentAdminResetPassword";
import { getTranslations } from "next-intl/server";

interface RouteParams {
    params: Promise<{ locale: string; id: string }>;
}

export default async function ResidentDetailPage({ params }: RouteParams) {
    const session = await auth();
    if (!session?.user) return null;

    const { locale, id } = await params;
    const t = await getTranslations({ locale, namespace: "Residents" });

    const resident = await prisma.resident.findUnique({
        where: { id },
        include: {
            user: true,
            unit: {
                include: {
                    complex: true,
                },
            },
        },
    });

    if (!resident) notFound();

    const sessionUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, complexId: true },
    });

    let showAdminPasswordReset = false;
    if (sessionUser) {
        if (sessionUser.role === Role.SUPER_ADMIN) {
            showAdminPasswordReset = true;
        } else if (sessionUser.role === Role.ADMIN && resident.unit.complex.adminId === session.user.id) {
            showAdminPasswordReset = true;
        } else if (
            sessionUser.role === Role.BOARD_OF_DIRECTORS &&
            sessionUser.complexId === resident.unit.complexId
        ) {
            showAdminPasswordReset = true;
        }
    }

    const emergency = resident.emergencyContact as { name?: string; phone?: string; relation?: string } | null;

    const dateLocale = locale === "es" ? "es-ES" : "en-US";
    const fmt = (d: Date) => d.toLocaleDateString(dateLocale, { dateStyle: "medium" });

    const typeLabel =
        resident.type === "OWNER"
            ? t("form.typeOwner")
            : resident.type === "TENANT"
              ? t("form.typeTenant")
              : resident.type;

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title={resident.user.name}
                    subtitle={t("detailPage.subtitle", { complex: resident.unit.complex.name })}
                    actions={
                        <Link href="/dashboard/residents">
                            <Button variant="secondary" icon="arrow_back">
                                {t("detailPage.back")}
                            </Button>
                        </Link>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-6">{t("detailPage.personalInfo")}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">{t("detailPage.fullName")}</p>
                                    <p className="font-medium">{resident.user.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">{t("email")}</p>
                                    <p className="font-medium">{resident.user.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">{t("phone")}</p>
                                    <p className="font-medium">{resident.user.phone || t("detailPage.phoneNotRegistered")}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">{t("detailPage.residenceType")}</p>
                                    <Badge variant={resident.type === "OWNER" ? "info" : "neutral"}>{typeLabel}</Badge>
                                </div>
                            </div>
                        </Card>

                        {resident.isAirbnb && (
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold mb-6">{t("detailPage.airbnbTitle")}</h3>
                                <div className="mb-4">
                                    <Badge variant="info">{t("detailPage.airbnbActive")}</Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">{t("detailPage.airbnbStayPeriod")}</p>
                                        <p className="text-sm font-medium">
                                            {resident.airbnbStartDate && resident.airbnbEndDate
                                                ? `${fmt(new Date(resident.airbnbStartDate))} — ${fmt(new Date(resident.airbnbEndDate))}`
                                                : "—"}
                                        </p>
                                    </div>
                                    {resident.airbnbGuestName && (
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">{t("detailPage.airbnbGuest")}</p>
                                            <p className="font-medium">{resident.airbnbGuestName}</p>
                                        </div>
                                    )}
                                    {resident.airbnbGuestIdentification && (
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">{t("detailPage.airbnbIdentification")}</p>
                                            <p className="font-medium">{resident.airbnbGuestIdentification}</p>
                                        </div>
                                    )}
                                    {resident.airbnbReservationCode && (
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">{t("detailPage.airbnbReservation")}</p>
                                            <p className="font-medium">{resident.airbnbReservationCode}</p>
                                        </div>
                                    )}
                                    {resident.airbnbGuestPhone && (
                                        <div>
                                            <p className="text-sm text-slate-500 mb-1">{t("detailPage.airbnbGuestPhoneLabel")}</p>
                                            <p className="font-medium">{resident.airbnbGuestPhone}</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-6">{t("detailPage.emergencyTitle")}</h3>
                            {emergency?.name ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">{t("form.name")}</p>
                                        <p className="font-medium">{emergency.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">{t("form.phone")}</p>
                                        <p className="font-medium">{emergency.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">{t("form.relation")}</p>
                                        <p className="font-medium">{emergency.relation}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">{t("detailPage.noEmergency")}</p>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-6">{t("detailPage.locationTitle")}</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">{t("detailPage.complex")}</p>
                                    <p className="font-medium">{resident.unit.complex.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">{t("unit")}</p>
                                    <Link
                                        href={`/dashboard/units/${resident.unitId}`}
                                        className="text-primary hover:underline font-medium"
                                    >
                                        {t("unitLabel", { number: resident.unit.number })}
                                    </Link>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">{t("detailPage.period")}</p>
                                    <p className="text-sm">
                                        {t("detailPage.from")}: {fmt(new Date(resident.startDate))}
                                        {resident.endDate
                                            ? ` ${t("detailPage.until")} ${fmt(new Date(resident.endDate))}`
                                            : ""}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {showAdminPasswordReset && <ResidentAdminResetPassword residentId={resident.id} />}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
