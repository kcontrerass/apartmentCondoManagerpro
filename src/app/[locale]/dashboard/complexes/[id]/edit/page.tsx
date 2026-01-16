import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ComplexForm } from "@/components/complexes/ComplexForm";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export default async function EditComplexPage({ params }: RouteParams) {
    const session = await auth();
    if (!session?.user) return null;

    const { id } = await params;

    const complex = await prisma.complex.findUnique({
        where: { id },
    });

    if (!complex) {
        notFound();
    }

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title={`Editar: ${complex.name}`}
                    subtitle="Actualiza la información del complejo habitacional."
                />

                <Card className="p-8">
                    <ComplexForm
                        isEditing
                        id={id}
                        initialData={{
                            name: complex.name,
                            address: complex.address,
                            type: complex.type,
                            logoUrl: complex.logoUrl,
                            settings: complex.settings as any,
                            adminId: complex.adminId,
                        }}
                    />
                </Card>
            </div>
        </MainLayout>
    );
}
