import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PasswordForm } from "@/components/profile/PasswordForm";

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

                    {/* Interactive Forms */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person</span>
                                Información Personal
                            </h3>
                            <ProfileForm user={user} />
                        </Card>

                        <Card className="p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-600">
                                <span className="material-symbols-outlined">security</span>
                                Seguridad
                            </h3>
                            <PasswordForm />
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
