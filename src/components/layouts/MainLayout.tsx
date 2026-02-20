import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
import { Toaster } from "sonner";

import { UnassignedResidentView } from "@/components/dashboard/UnassignedResidentView";

interface MainLayoutProps {
    children: ReactNode;
    user?: any; // Session user
}

export async function MainLayout({ children, user }: MainLayoutProps) {
    let complexName: string | null = null;
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
        }
    } else if (user?.role === Role.ADMIN) {
        const complex = await prisma.complex.findFirst({
            where: { adminId: user.id },
            select: { name: true },
        });
        complexName = complex?.name ?? null;
    } else if (user?.role === Role.GUARD || user?.role === Role.BOARD_OF_DIRECTORS) {
        const staffUser = await (prisma as any).user.findUnique({
            where: { id: user.id },
            select: { assignedComplex: { select: { name: true } } }
        });
        complexName = staffUser?.assignedComplex?.name ?? null;
    }

    if (isUnassignedResident) {
        return (
            <div className="flex min-h-screen bg-background-dark font-sans text-white">
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
        <div className="flex min-h-screen bg-background-dark font-sans text-white">
            <Toaster position="top-right" richColors />
            <Sidebar user={user} complexName={complexName} />
            <div className="flex-1 flex flex-col ml-0 md:ml-64 transition-all duration-300">
                <Header isUnassigned={isUnassignedResident} />
                <main className="flex-1 p-6 md:p-8">
                    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
}
