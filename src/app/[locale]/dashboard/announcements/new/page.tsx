import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import NewAnnouncementClient from "./NewAnnouncementClient";

export default async function NewAnnouncementPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <NewAnnouncementClient />
        </MainLayout>
    );
}
