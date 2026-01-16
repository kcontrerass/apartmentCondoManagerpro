import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

interface MainLayoutProps {
    children: ReactNode;
    user?: any; // Session user
}

export async function MainLayout({ children, user }: MainLayoutProps) {
    let complexName: string | null = null;
    if (user?.role === Role.ADMIN) {
        const complex = await prisma.complex.findFirst({
            where: { adminId: user.id },
            select: { name: true },
        });
        complexName = complex?.name ?? null;
    }
    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-white">
            <Sidebar user={user} complexName={complexName} />
            <div className="flex-1 flex flex-col ml-0 md:ml-64 transition-all duration-300">
                <Header />
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
