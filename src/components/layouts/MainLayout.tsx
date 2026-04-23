import { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
import { Toaster } from "sonner";
import { ModuleGuard } from "./ModuleGuard";
import { MobileSidebarProvider } from "./MobileSidebarContext";
import { PlatformSubscriptionGate } from "./PlatformSubscriptionGate";
import { evaluatePlatformSubscriptionAccess } from "@/lib/platform-subscription-rules";
import { getPlatformSubscriptionGraceDays } from "@/lib/platform-subscription-access";

import { UnassignedResidentView } from "@/components/dashboard/UnassignedResidentView";
import { AnimatedPage } from "@/components/animations/AnimatedPage";
import { PWAInstallPrompt, type PWAInstallCopy } from "@/components/pwa/PWAInstallPrompt";
import { PwaPostLogoutNotificationPrompt } from "@/components/pwa/PwaPostLogoutNotificationPrompt";

interface MainLayoutProps {
    children: ReactNode;
    user?: any; // Session user
}

export async function MainLayout({ children, user }: MainLayoutProps) {
    const locale = await getLocale();
    const messages = await getMessages({ locale });
    const tpwa = await getTranslations("PWAInstall");
    const pwaInstallCopy: PWAInstallCopy = {
        title: tpwa("title"),
        subtitle: tpwa("subtitle"),
        benefit1: tpwa("benefit1"),
        benefit2: tpwa("benefit2"),
        benefit3: tpwa("benefit3"),
        install: tpwa("install"),
        installing: tpwa("installing"),
        later: tpwa("later"),
        dismiss: tpwa("dismiss"),
        waitingPrompt: tpwa("waitingPrompt"),
    };

    let complexName: string | null = null;
    let complexId: string | null = null;
    let complexSettings: any = null;
    let platformPaidUntil: Date | null = null;
    let complexCreatedAt: Date | null = null;
    let isUnassignedResident = false;

    if (user?.role === Role.RESIDENT) {
        const resident = await prisma.resident.findUnique({
            where: { userId: user.id },
            include: {
                unit: {
                    include: {
                        complex: {
                            select: {
                                id: true,
                                name: true,
                                settings: true,
                                platformPaidUntil: true,
                                createdAt: true,
                            },
                        },
                    },
                },
            },
        });

        if (!resident) {
            isUnassignedResident = true;
        } else {
            const c = resident.unit.complex;
            complexName = c.name;
            complexId = resident.unit.complexId;
            complexSettings = c.settings;
            platformPaidUntil = c.platformPaidUntil;
            complexCreatedAt = c.createdAt;
        }
    } else {
        // For ADMIN, GUARD, BOARD_OF_DIRECTORS
        // 1. Try to find complex by adminId (for ADMINs)
        let complex = await prisma.complex.findFirst({
            where: { adminId: user.id },
            select: {
                id: true,
                name: true,
                settings: true,
                platformPaidUntil: true,
                createdAt: true,
            },
        });

        // 2. If not found, try to find by complexId from the user profile (for BOARD, GUARD, or dual-role ADMIN)
        if (!complex && user.id) {
            const userProfile = await prisma.user.findUnique({
                where: { id: user.id },
                select: { complexId: true }
            });

            if (userProfile?.complexId) {
                complex = await prisma.complex.findUnique({
                    where: { id: userProfile.complexId },
                    select: {
                        id: true,
                        name: true,
                        settings: true,
                        platformPaidUntil: true,
                        createdAt: true,
                    },
                });
            }
        }

        if (complex) {
            complexName = complex.name;
            complexId = complex.id;
            complexSettings = complex.settings;
            platformPaidUntil = complex.platformPaidUntil;
            complexCreatedAt = complex.createdAt;
        }
    }

    let platformSubscriptionBlocked = false;
    if (
        user?.role &&
        user.role !== Role.SUPER_ADMIN &&
        complexId &&
        complexCreatedAt
    ) {
        const graceDays = await getPlatformSubscriptionGraceDays();
        platformSubscriptionBlocked = !evaluatePlatformSubscriptionAccess({
            platformPaidUntil,
            complexCreatedAt,
            graceDays,
        }).allowed;
    }

    if (isUnassignedResident) {
        return (
            <NextIntlClientProvider locale={locale} messages={messages}>
                <div className="flex min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
                    <Toaster position="top-right" richColors />
                    <PwaPostLogoutNotificationPrompt />
                    <div className="flex-1 flex flex-col">
                        <Header isUnassigned={isUnassignedResident} />
                        <main className="flex-1 p-6 md:p-8 flex items-center justify-center">
                            <UnassignedResidentView />
                        </main>
                        <Footer />
                    </div>
                </div>
            </NextIntlClientProvider>
        );
    }
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <div className="flex min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
                <Toaster position="top-right" richColors />
                <PwaPostLogoutNotificationPrompt />
                <PWAInstallPrompt copy={pwaInstallCopy} />
                <MobileSidebarProvider>
                    {/* @ts-ignore */}
                    <Sidebar user={user} complexName={complexName} complexSettings={complexSettings} />
                    <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
                        <Header isUnassigned={isUnassignedResident} />
                        <main className="flex-1 p-6 md:p-8">
                            <div className="max-w-[1400px] mx-auto">
                                <PlatformSubscriptionGate
                                    blocked={platformSubscriptionBlocked}
                                    userRole={user?.role}
                                >
                                    <ModuleGuard userRole={user?.role} complexSettings={complexSettings}>
                                        <AnimatedPage>
                                            {children}
                                        </AnimatedPage>
                                    </ModuleGuard>
                                </PlatformSubscriptionGate>
                            </div>
                        </main>
                        <Footer />
                    </div>
                </MobileSidebarProvider>
            </div>
        </NextIntlClientProvider>
    );
}
