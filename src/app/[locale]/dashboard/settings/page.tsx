import { MainLayout } from "@/components/layouts/MainLayout";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/roles";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect(`/${locale}/login`);
    }

    const isAuthorized = [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS].includes(session.user.role as Role);

    if (!isAuthorized) {
        redirect(`/${locale}/dashboard`);
    }

    return (
        <MainLayout user={session.user}>
            <SettingsClient user={session.user} />
        </MainLayout>
    );
}
