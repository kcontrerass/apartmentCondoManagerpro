import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
import { Toaster } from "sonner";
import { ModuleGuard } from "./ModuleGuard";
import { MobileSidebarProvider } from "./MobileSidebarContext";

import { UnassignedResidentView } from "@/components/dashboard/UnassignedResidentView";
import { AnimatedPage } from "@/components/animations/AnimatedPage";

interface MainLayoutProps {
    children: ReactNode;
    user?: any; // Session user
}

export async function MainLayout({ children, user }: MainLayoutProps) {
    let complexName: string | null = null;
    let complexId: string | null = null;
    let complexSettings: any = null;
    let isUnassignedResident = false;

    if (user?.role === Role.RESIDENT) {
        const resident = await prisma.resident.findUnique({
            where: { userId: user.id },
            include: {
                unit: {
                    include: {
                        complex: true
                    }
                }
            }
        });

        if (!resident) {
            isUnassignedResident = true;
        } else {
            complexName = resident.unit.complex.name;
            complexId = resident.unit.complexId;
            complexSettings = resident.unit.complex.settings;
        }
    } else {
        // For ADMIN, GUARD, BOARD_OF_DIRECTORS
        // 1. Try to find complex by adminId (for ADMINs)
        let complex = await prisma.complex.findFirst({
            where: { adminId: user.id },
            select: { id: true, name: true, settings: true },
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
                    select: { id: true, name: true, settings: true },
                });
            }
        }

        if (complex) {
            complexName = complex.name;
            complexId = complex.id;
            complexSettings = complex.settings;
        }
    }

    if (isUnassignedResident) {
        return (
            <div className="flex min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
                <Toaster position="top-right" richColors />
                <div className="flex-1 flex flex-col">
                    <Header isUnassigned={isUnassignedResident} />
                    <main className="flex-1 p-6 md:p-8 flex items-center justify-center">
                        <UnassignedResidentView />
                    </main>
                    <Footer />
                </div>
            </div>
        );
    }
    return (
        <div className="flex min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
            <Toaster position="top-right" richColors />
            <MobileSidebarProvider>
                {/* @ts-ignore */}
                <Sidebar user={user} complexName={complexName} complexSettings={complexSettings} />
                <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
                    <Header isUnassigned={isUnassignedResident} />
                    <main className="flex-1 p-6 md:p-8">
                        <div className="max-w-[1400px] mx-auto">
                            <ModuleGuard userRole={user?.role} complexSettings={complexSettings}>
                                <AnimatedPage>
                                    {children}
                                </AnimatedPage>
                            </ModuleGuard>
                        </div>
                    </main>
                    <Footer />
                </div>
            </MobileSidebarProvider>
        </div>
    );
}
