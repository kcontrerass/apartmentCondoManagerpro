import { auth } from "@/auth";
import { MainLayout } from "@/components/layouts/MainLayout";
import { AccessControlClient } from "./AccessControlClient";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";

export default async function AccessControlPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const session = await auth();
    if (!session?.user) return null;

    const t = await getTranslations({ locale, namespace: "AccessControl" });

    // Fetch initial data based on role
    let complexes: any[] = [];
    let units: any[] = [];
    let residentUnit: any = null;

    if (session.user.role === Role.SUPER_ADMIN) {
        complexes = await prisma.complex.findMany({ select: { id: true, name: true } });
    } else if (session.user.role === Role.ADMIN) {
        complexes = await prisma.complex.findMany({
            where: { adminId: session.user.id },
            select: { id: true, name: true }
        });
    } else if (session.user.role === Role.BOARD_OF_DIRECTORS || session.user.role === Role.GUARD) {
        const user = await (prisma as any).user.findUnique({
            where: { id: session.user.id },
            select: { complexId: true }
        });
        if (user?.complexId) {
            complexes = await prisma.complex.findMany({
                where: { id: user.complexId },
                select: { id: true, name: true }
            });
        }
    } else if (session.user.role === Role.RESIDENT) {
        const resident = await prisma.resident.findUnique({
            where: { userId: session.user.id },
            include: { unit: { include: { complex: true } } }
        });
        if (resident) {
            residentUnit = resident.unit;
            complexes = [resident.unit.complex];
            units = [resident.unit];
        }
    }

    return (
        <MainLayout user={session.user}>
            <AccessControlClient
                userRole={session.user.role as Role}
                initialComplexes={complexes}
                residentUnit={residentUnit}
            />
        </MainLayout>
    );
}
