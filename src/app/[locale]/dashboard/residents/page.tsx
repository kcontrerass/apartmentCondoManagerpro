import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ResidentsClient } from "./ResidentsClient";
import { Role } from "@prisma/client";

export default async function ResidentsPage({ params }: { params: Promise<{ locale: string }> }) {
    await params; // Await params for Next 15 compatibility
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <ResidentsClient userRole={session.user.role as Role} />
        </MainLayout>
    );
}
