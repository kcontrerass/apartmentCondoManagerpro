import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ServicesClient } from "./ServicesClient";

export default async function ServicesPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <ServicesClient />
        </MainLayout>
    );
}
