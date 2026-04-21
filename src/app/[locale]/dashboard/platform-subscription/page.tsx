import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Role } from "@/types/roles";
import { redirect } from "next/navigation";
import { PlatformSubscriptionClient } from "./PlatformSubscriptionClient";

export default async function PlatformSubscriptionPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const session = await auth();
    if (!session?.user) return null;

    if (
        session.user.role !== Role.ADMIN &&
        session.user.role !== Role.BOARD_OF_DIRECTORS
    ) {
        redirect(`/${locale}/dashboard`);
    }

    return (
        <MainLayout user={session.user}>
            <PlatformSubscriptionClient />
        </MainLayout>
    );
}
