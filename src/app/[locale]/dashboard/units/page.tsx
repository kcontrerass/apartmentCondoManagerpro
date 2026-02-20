import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { UnitsClient } from "./UnitsClient";
import { Role } from "@/types/roles";

export default async function UnitsPage({ params }: { params: Promise<{ locale: string }> }) {
    await params; // Await params for Next 15 compatibility
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <UnitsClient userRole={session.user.role as Role} />
        </MainLayout>
    );
}
