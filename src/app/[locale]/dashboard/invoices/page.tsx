import { MainLayout } from "@/components/layouts/MainLayout";
import { InvoicesClient } from "./InvoicesClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function InvoicesPage() {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    return (
        <MainLayout user={session.user}>
            <InvoicesClient />
        </MainLayout>
    );
}
