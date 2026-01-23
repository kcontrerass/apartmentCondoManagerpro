import { MainLayout } from "@/components/layouts/MainLayout";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReservationsClient } from "./ReservationsClient";

export default async function ReservationsPage() {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    return (
        <MainLayout user={session.user}>
            <ReservationsClient />
        </MainLayout>
    );
}
