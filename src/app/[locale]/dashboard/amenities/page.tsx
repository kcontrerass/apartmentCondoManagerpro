import { MainLayout } from "@/components/layouts/MainLayout";
import { AmenitiesClient } from "./AmenitiesClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AmenitiesPage({
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
            <AmenitiesClient user={session.user} />
        </MainLayout>
    );
}
