import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Role } from "@/types/roles";
import { redirect } from "next/navigation";
import { PlatformPaymentsAdminClient } from "./PlatformPaymentsAdminClient";
import { prisma } from "@/lib/db";

export default async function PlatformPaymentsAdminPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const session = await auth();
    if (!session?.user) return null;

    if (session.user.role === Role.SUPER_ADMIN) {
        return (
            <MainLayout user={session.user}>
                <PlatformPaymentsAdminClient mode="super" />
            </MainLayout>
        );
    }

    if (session.user.role === Role.ADMIN) {
        const complex = await prisma.complex.findFirst({
            where: { adminId: session.user.id },
            select: { id: true, name: true },
        });
        if (!complex) {
            redirect(`/${locale}/dashboard`);
        }
        return (
            <MainLayout user={session.user}>
                <PlatformPaymentsAdminClient mode="complex" complexName={complex.name} />
            </MainLayout>
        );
    }

    redirect(`/${locale}/dashboard`);
}
