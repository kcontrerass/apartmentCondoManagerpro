import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export default async function ResidentDetailPage({ params }: RouteParams) {
    const session = await auth();
    if (!session?.user) return null;

    const { id } = await params;

    const resident = await prisma.resident.findUnique({
        where: { id },
        include: {
            user: true,
            unit: {
                include: {
                    complex: true,
                },
            },
        },
    });

    if (!resident) notFound();

    const emergency = resident.emergencyContact as any;

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title={resident.user.name}
                    subtitle={`Perfil de residente - Edificio ${resident.unit.complex.name}`}
                    actions={
                        <Link href="/dashboard/residents">
                            <Button variant="secondary" icon="arrow_back">Volver</Button>
                        </Link>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-6">Información Personal</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Nombre Completo</p>
                                    <p className="font-medium">{resident.user.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Email</p>
                                    <p className="font-medium">{resident.user.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Teléfono</p>
                                    <p className="font-medium">{resident.user.phone || "No registrado"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Tipo de Residencia</p>
                                    <Badge variant={resident.type === 'OWNER' ? 'info' : 'neutral'}>
                                        {resident.type}
                                    </Badge>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-6">Contacto de Emergencia</h3>
                            {emergency?.name ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">Nombre</p>
                                        <p className="font-medium">{emergency.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">Teléfono</p>
                                        <p className="font-medium">{emergency.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-500 mb-1">Parentesco</p>
                                        <p className="font-medium">{emergency.relation}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-slate-500 italic">No hay contacto de emergencia registrado.</p>
                            )}
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-6">Ubicación Actual</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Complejo</p>
                                    <p className="font-medium">{resident.unit.complex.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Unidad</p>
                                    <Link href={`/dashboard/units/${resident.unitId}`} className="text-primary hover:underline font-medium">
                                        Unidad {resident.unit.number}
                                    </Link>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 mb-1">Periodo</p>
                                    <p className="text-sm">
                                        Desde: {new Date(resident.startDate).toLocaleDateString()}
                                        {resident.endDate && ` hasta ${new Date(resident.endDate).toLocaleDateString()}`}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
