import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user || (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unassignedOnly = searchParams.get("unassigned") === "true";
        const currentComplexId = searchParams.get("currentComplexId");

        const where: any = {
            role: Role.ADMIN,
        };

        if (unassignedOnly && !currentComplexId) {
            where.managedComplexes = {
                none: {}
            };
        } else if (currentComplexId) {
            where.OR = [
                { managedComplexes: { none: {} } },
                { managedComplexes: { some: { id: currentComplexId } } }
            ];
        }

        const admins = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(admins);
    } catch (error) {
        console.error("Error fetching admins:", error);
        return NextResponse.json(
            { error: "Error fetching administrators" },
            { status: 500 }
        );
    }
}
