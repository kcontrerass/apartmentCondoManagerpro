import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import AnnouncementsClient from "./AnnouncementsClient";

export default async function AnnouncementsPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <AnnouncementsClient />
        </MainLayout>
    );
}
