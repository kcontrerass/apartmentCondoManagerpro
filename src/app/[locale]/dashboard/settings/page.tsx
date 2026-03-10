import { getTranslations } from "next-intl/server";
import { MainLayout } from "@/components/layouts/MainLayout";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/roles";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const isAuthorized = [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS].includes(session.user.role as Role);

    if (!isAuthorized) {
        redirect("/dashboard");
    }

    const t = await getTranslations("Common");

    return (
        <MainLayout user={session.user}>
            <SettingsClient user={session.user} />
        </MainLayout>
    );
}
