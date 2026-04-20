import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { AirbnbGuestsClient } from "./AirbnbGuestsClient";
import { Role } from "@/types/roles";
import { redirect } from "next/navigation";

const ALLOWED = new Set([
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.BOARD_OF_DIRECTORS,
    Role.GUARD,
]);

export default async function AirbnbGuestsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const session = await auth();
    if (!session?.user) return null;

    if (!ALLOWED.has(session.user.role as Role)) {
        redirect(`/${locale}/dashboard`);
    }

    return (
        <MainLayout user={session.user}>
            <AirbnbGuestsClient userRole={session.user.role as Role} />
        </MainLayout>
    );
}
