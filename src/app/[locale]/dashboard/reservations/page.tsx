import { MainLayout } from "@/components/layouts/MainLayout";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReservationsClient } from "./ReservationsClient";

export default async function ReservationsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const session = await auth();
    if (!session) {
        redirect(`/${locale}/login`);
    }

    return (
        <MainLayout user={session.user}>
            <ReservationsClient user={session.user} />
        </MainLayout>
    );
}
