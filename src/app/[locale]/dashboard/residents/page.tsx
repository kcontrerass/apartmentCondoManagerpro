import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ResidentsClient } from "./ResidentsClient";

export default async function ResidentsPage({ params }: { params: Promise<{ locale: string }> }) {
    await params; // Await params for Next 15 compatibility
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <ResidentsClient />
        </MainLayout>
    );
}
