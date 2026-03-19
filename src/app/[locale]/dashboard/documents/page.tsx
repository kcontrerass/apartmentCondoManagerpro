import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { prisma } from "@/lib/db";
import { DocumentList } from "@/components/documents/DocumentList";
import { Role } from "@/types/roles";
import { getTranslations } from "next-intl/server";

export default async function DocumentsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Documents" });
    const session = await auth();
    if (!session?.user) return null;

    // Get current user's complexId
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            complexId: true,
            role: true,
            residentProfile: {
                select: { unit: { select: { complexId: true } } }
            }
        }
    });

    const userComplexId = user?.role === Role.RESIDENT
        ? user.residentProfile?.unit.complexId
        : user?.complexId;

    return (
        <MainLayout user={session.user}>
            <div className="space-y-8">
                <PageHeader
                    title={t("title")}
                    subtitle={t("subtitle")}
                />

                <DocumentList
                    userRole={(user?.role as Role) || Role.RESIDENT}
                    complexId={userComplexId || ""}
                />
            </div>
        </MainLayout>
    );
}
