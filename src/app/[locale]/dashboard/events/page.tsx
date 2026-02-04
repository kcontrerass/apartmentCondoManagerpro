import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import EventsClient from "./EventsClient";

export default async function EventsPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <EventsClient />
        </MainLayout>
    );
}
