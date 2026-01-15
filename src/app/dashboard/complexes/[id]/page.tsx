import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export default async function ComplexDetailPage({ params }: RouteParams) {
    const session = await auth();
    if (!session?.user) return null;

    const { id } = await params;

    const complex = await prisma.complex.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    units: true,
                    amenities: true,
                },
            },
            admin: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            units: {
                take: 5,
                orderBy: { number: 'asc' },
            },
            amenities: {
                take: 5,
                orderBy: { name: 'asc' },
            },
        },
    });

    if (!complex) {
        notFound();
    }

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title={complex.name}
                    subtitle={`Detalle del complejo habitacional`}
                    actions={
                        <div className="flex gap-3">
                            <Link href={`/dashboard/complexes/${id}/edit`}>
                                <Button variant="secondary" icon="edit">Editar</Button>
                            </Link>
                            <Button variant="primary" icon="add">Agregar Unidad</Button>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Información General</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Dirección</p>
                                    <p className="text-slate-900 dark:text-white">{complex.address}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Tipo</p>
                                    <Badge variant="info">{complex.type}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Administrador</p>
                                    <p className="text-slate-900 dark:text-white">{complex.admin?.name || "No asignado"}</p>
                                    <p className="text-xs text-slate-500">{complex.admin?.email}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold">Unidades</h3>
                                <Link href={`/dashboard/units?complexId=${id}`}>
                                    <Button variant="secondary" size="sm">Ver todas</Button>
                                </Link>
                            </div>

                            {complex.units.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {complex.units.map((unit) => (
                                        <div key={unit.id} className="py-3 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">Unidad {unit.number}</p>
                                                <p className="text-xs text-slate-500">{unit.bedrooms} hab / {unit.bathrooms} baños</p>
                                            </div>
                                            <Badge variant={unit.status === 'OCCUPIED' ? 'success' : 'neutral'}>
                                                {unit.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                                    <p className="text-slate-500">No hay unidades registradas</p>
                                </div>
                            )}
                        </Card>

                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold">Amenidades</h3>
                                <Button variant="secondary" size="sm">Gestionar</Button>
                            </div>

                            {complex.amenities.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {complex.amenities.map((amenity) => (
                                        <div key={amenity.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {amenity.type === 'POOL' ? 'pool' : amenity.type === 'GYM' ? 'fitness_center' : 'meeting_room'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{amenity.name}</p>
                                                <p className="text-xs text-slate-500">{amenity.type}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                                    <p className="text-slate-500">No hay amenidades registradas</p>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Sidebar Stats */}
                    <div className="space-y-8">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-6">Métricas rápidas</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                                            <span className="material-symbols-rounded">apartment</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Total Unidades</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-bold">{complex._count.units}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                                            <span className="material-symbols-rounded">pool</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Amenidades</p>
                                        </div>
                                    </div>
                                    <span className="text-xl font-bold">{complex._count.amenities}</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Configuración</h3>
                            <p className="text-sm text-slate-500">
                                Personaliza las reglas y apariencia de este complejo.
                            </p>
                            <Button variant="secondary" className="w-full mt-4">Configurar complejo</Button>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
