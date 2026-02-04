import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import AnnouncementDetailClient from "./AnnouncementDetailClient";

export default async function AnnouncementDetailPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <AnnouncementDetailClient />
        </MainLayout>
    );
}
