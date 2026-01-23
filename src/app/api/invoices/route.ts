import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Role } from "@prisma/client";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const complexId = searchParams.get("complexId");
        const unitId = searchParams.get("unitId");
        const status = searchParams.get("status");
        const month = searchParams.get("month");
        const year = searchParams.get("year");

        let whereClause: any = {};

        if (complexId) whereClause.complexId = complexId;
        if (unitId) whereClause.unitId = unitId;
        if (status) whereClause.status = status;
        if (month) whereClause.month = parseInt(month);
        if (year) whereClause.year = parseInt(year);

        // RBAC filtering
        if (session.user.role === Role.ADMIN) {
            const complex = await prisma.complex.findFirst({
                where: { adminId: session.user.id }
            });
            if (!complex) return NextResponse.json([]);
            whereClause.complexId = complex.id;
        } else if (session.user.role === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id }
            });
            if (!resident) return NextResponse.json([]);
            whereClause.unitId = resident.unitId;
        } else if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.OPERATOR) {
            // Guards or other roles might not have access to billing list
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const invoices = await (prisma as any).invoice.findMany({
            where: whereClause,
            include: {
                unit: {
                    select: { number: true }
                },
                complex: {
                    select: { name: true }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return NextResponse.json(
            { error: "Error al obtener facturas" },
            { status: 500 }
        );
    }
}
