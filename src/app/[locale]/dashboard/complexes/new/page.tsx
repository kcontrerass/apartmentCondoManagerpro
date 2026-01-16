import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ComplexForm } from "@/components/complexes/ComplexForm";
import { Card } from "@/components/ui/Card";

export default async function NewComplexPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title="Nuevo Complejo"
                    subtitle="Registra un nuevo edificio o residencial en la plataforma."
                />

                <Card className="p-8">
                    <ComplexForm />
                </Card>
            </div>
        </MainLayout>
    );
}
