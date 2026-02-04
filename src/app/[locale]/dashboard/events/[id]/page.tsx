import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import EventDetailClient from "./EventDetailClient";

export default async function EventDetailPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <EventDetailClient />
        </MainLayout>
    );
}
