import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Role } from "@/types/roles";
import { redirect } from "next/navigation";
import { PlatformRecurrenteClient } from "./PlatformRecurrenteClient";

export default async function PlatformRecurrentePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const session = await auth();
    if (!session?.user) return null;

    if (session.user.role !== Role.SUPER_ADMIN) {
        redirect(`/${locale}/dashboard`);
    }

    return (
        <MainLayout user={session.user}>
            <PlatformRecurrenteClient />
        </MainLayout>
    );
}
