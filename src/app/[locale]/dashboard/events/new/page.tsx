import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import NewEventClient from "./NewEventClient";

export default async function NewEventPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <NewEventClient />
        </MainLayout>
    );
}
