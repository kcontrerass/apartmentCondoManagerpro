import { MainLayout } from "@/components/layouts/MainLayout";
import { InvoicesClient } from "./InvoicesClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Role } from "@/types/roles";
import { getSuperAdminBillingScopeComplexIdFromCookies } from "@/lib/super-admin-scope";

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

    const billingScopeComplexId =
        session.user.role === Role.SUPER_ADMIN
            ? await getSuperAdminBillingScopeComplexIdFromCookies()
            : null;

    return (
        <MainLayout user={session.user}>
            <InvoicesClient user={session.user} billingScopeComplexId={billingScopeComplexId} />
        </MainLayout>
    );
}
