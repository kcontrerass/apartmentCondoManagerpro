import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { ServicesClient } from "./ServicesClient";
import { Role } from "@/types/roles";

export default async function ServicesPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <MainLayout user={session.user}>
            <ServicesClient userRole={session.user.role as Role} userId={session.user.id!} />
        </MainLayout>
    );
}
