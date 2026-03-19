import { MainLayout } from "@/components/layouts/MainLayout";
import { InvoicesClient } from "./InvoicesClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function InvoicesPage({
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
            <InvoicesClient user={session.user} />
        </MainLayout>
    );
}
