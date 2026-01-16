import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { UnitsClient } from "./UnitsClient";

export default async function UnitsPage({ params }: { params: Promise<{ locale: string }> }) {
    await params; // Await params for Next 15 compatibility
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <UnitsClient />
        </MainLayout>
    );
}
