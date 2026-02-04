import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ProfilePage() {
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
                                select: { name: true }
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

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title="Mi Perfil"
                    subtitle="Gestiona tu información personal y configuración de cuenta."
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
                            <Badge variant="info">{user.role}</Badge>
                            <Badge variant={user.status === 'ACTIVE' ? 'success' : 'neutral'}>
                                {user.status}
                            </Badge>
                        </div>
                        <div className="w-full pt-6 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-500">Miembro desde</span>
                                <span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Complejo</span>
                                <span className="font-medium text-primary">{complexName || 'Global'}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Information Form Placeholder */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person</span>
                                Información Personal
                            </h3>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre Completo</label>
                                        <input
                                            type="text"
                                            defaultValue={user.name || ''}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            readOnly
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            defaultValue={user.email}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 focus:outline-none cursor-not-allowed"
                                            disabled
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
                                        <input
                                            type="text"
                                            placeholder="Introduce tu teléfono"
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <p className="text-xs text-slate-500 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px]">info</span>
                                        La edición del perfil estará disponible en las próximas actualizaciones.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-600">
                                <span className="material-symbols-outlined">security</span>
                                Seguridad
                            </h3>
                            <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Contraseña</p>
                                    <p className="text-sm text-slate-500">Cambia tu contraseña para mantener tu cuenta segura.</p>
                                </div>
                                <button className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                                    Cambiar
                                </button>
                            </div>
                            <div className="flex items-center justify-between py-4">
                                <div>
                                    <p className="font-medium text-slate-900 dark:text-white">Sesiones Activas</p>
                                    <p className="text-sm text-slate-500">Cierra sesión en todos tus dispositivos.</p>
                                </div>
                                <button className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
                                    Cerrar todo
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
