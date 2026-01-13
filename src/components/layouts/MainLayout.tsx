import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-white">
            <Sidebar />
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
