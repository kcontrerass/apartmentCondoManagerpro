import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import Link from "next/link";

export default async function CommunicationsPage() {
    const session = await auth();
    if (!session?.user) return null;

    const modules = [
        {
            title: "Avisos",
            description: "Consulta y gestiona los comunicados oficiales del complejo.",
            href: "/dashboard/announcements",
            icon: "campaign",
            color: "bg-blue-500",
            lightColor: "bg-blue-50",
            textColor: "text-blue-600"
        },
        {
            title: "Eventos",
            description: "Descubre y participa en las actividades comunitarias y asambleas.",
            href: "/dashboard/events",
            icon: "event",
            color: "bg-purple-500",
            lightColor: "bg-purple-50",
            textColor: "text-purple-600"
        }
    ];

    return (
        <MainLayout user={session.user}>
            <div className="space-y-10">
                <PageHeader
                    title="Comunicaciones"
                    subtitle="Mantente informado y participa activamente en tu comunidad"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {modules.map((mod) => (
                        <Link
                            key={mod.href}
                            href={mod.href}
                            className="group bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden"
                        >
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-full blur-3xl group-hover:bg-primary/5 transition-colors"></div>

                            <div className={`${mod.color} w-20 h-20 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-current/30 group-hover:scale-110 transition-transform duration-500`}>
                                <span className="material-symbols-outlined text-4xl">{mod.icon}</span>
                            </div>

                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-primary transition-colors">
                                {mod.title}
                            </h2>

                            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed mb-10">
                                {mod.description}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className={`flex items-center font-black text-sm uppercase tracking-widest ${mod.textColor} group-hover:text-primary transition-colors gap-3`}>
                                    Entrar al módulo
                                    <span className="material-symbols-outlined text-xl group-hover:translate-x-2 transition-transform">arrow_forward</span>
                                </div>

                                <div className={`w-12 h-12 rounded-2xl ${mod.lightColor} dark:bg-slate-800 flex items-center justify-center`}>
                                    <span className={`material-symbols-outlined ${mod.textColor}`}>{mod.icon}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}
