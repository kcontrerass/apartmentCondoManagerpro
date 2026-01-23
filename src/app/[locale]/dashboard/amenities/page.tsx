import { MainLayout } from "@/components/layouts/MainLayout";
import { AmenitiesClient } from "./AmenitiesClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AmenitiesPage() {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    return (
        <MainLayout user={session.user}>
            <AmenitiesClient />
        </MainLayout>
    );
}
