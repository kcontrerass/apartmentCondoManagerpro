import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { UnitServicesManager } from "@/components/units/UnitServicesManager";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export default async function UnitDetailPage({ params }: RouteParams) {
    const session = await auth();
    if (!session?.user) return null;

    const { id } = await params;

    const unit = await prisma.unit.findUnique({
        where: { id },
        include: {
            complex: true,
            residents: {
                include: {
                    user: true,
                },
                orderBy: {
                    startDate: 'desc'
                }
            },
        },
    });

    if (!unit) notFound();

    const currentResident = unit.residents.find(r => !r.endDate || new Date(r.endDate) > new Date());

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title={`Unidad ${unit.number}`}
                    subtitle={`${unit.complex.name} - ${unit.type || "Residencial"}`}
                    actions={
                        <div className="flex gap-3">
                            <Link href={`/dashboard/units?complexId=${unit.complexId}`}>
                                <Button variant="secondary" icon="arrow_back">Volver a lista</Button>
                            </Link>
                            {session.user.role !== 'GUARD' && session.user.role !== 'OPERATOR' && (
                                <Button variant="primary" icon="edit">Editar Unidad</Button>
                            )}
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Detalles de la Unidad</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Estado</p>
                                    <Badge variant={unit.status === 'OCCUPIED' ? 'success' : 'neutral'}>
                                        {unit.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Habitaciones</p>
                                    <p className="font-medium">{unit.bedrooms}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Baños</p>
                                    <p className="font-medium">{unit.bathrooms}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Área</p>
                                    <p className="font-medium">{unit.area || 0} m²</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Parqueos</p>
                                    <p className="font-medium">{unit.parkingSpots}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-6">Historial de Residentes</h3>
                            {unit.residents.length > 0 ? (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {unit.residents.map((resident) => (
                                        <div key={resident.id} className="py-4 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">{resident.user.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {resident.type} • {new Date(resident.startDate).toLocaleDateString()}
                                                    {resident.endDate ? ` - ${new Date(resident.endDate).toLocaleDateString()}` : " - Actual"}
                                                </p>
                                            </div>
                                            <Badge variant={!resident.endDate || new Date(resident.endDate) > new Date() ? "success" : "neutral"}>
                                                {!resident.endDate || new Date(resident.endDate) > new Date() ? "Activo" : "Pasado"}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                    <p className="text-slate-500">No hay historial de residentes.</p>
                                </div>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-6">Residente Actual</h3>
                            {currentResident ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {currentResident.user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium">{currentResident.user.name}</p>
                                            <p className="text-xs text-slate-500">{currentResident.user.email}</p>
                                        </div>
                                    </div>
                                    <Link href={`/dashboard/residents/${currentResident.id}`} className="block">
                                        <Button variant="outline" className="w-full">Ver Perfil</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-slate-500">Sin residente activo</p>
                                    {session.user.role !== 'GUARD' && session.user.role !== 'OPERATOR' && (
                                        <Link href={`/dashboard/residents?unitId=${unit.id}`}>
                                            <Button variant="secondary" size="sm" className="mt-2">Asignar uno</Button>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </Card>

                        <UnitServicesManager
                            unitId={unit.id}
                            complexId={unit.complexId}
                            userRole={session.user.role as any}
                        />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
