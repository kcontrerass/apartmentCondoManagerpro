import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ComplexesClient } from "./ComplexesClient";

export default async function ComplexesPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title="Complejos Habitacionales"
                    subtitle="Gestiona los edificios y residenciales del sistema."
                    actions={
                        session.user.role === "SUPER_ADMIN" ? (
                            <Link href="/dashboard/complexes/new">
                                <Button variant="primary" icon="add">Nuevo Complejo</Button>
                            </Link>
                        ) : null
                    }
                />

                <ComplexesClient />
            </div>
        </MainLayout>
    );
}
