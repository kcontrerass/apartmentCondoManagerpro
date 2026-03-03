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

    if (
        session.user.role !== Role.SUPER_ADMIN &&
        session.user.role !== Role.ADMIN &&
        session.user.role !== Role.BOARD_OF_DIRECTORS
    ) {
        redirect("/dashboard");
    }

    const t = await getTranslations("Common");

    return (
        <MainLayout user={session.user}>
            <SettingsClient user={session.user} />
        </MainLayout>
    );
}
