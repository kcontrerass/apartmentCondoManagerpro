import { NextResponse } from "next/server";
import { InvoiceCategory, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@/types/roles";
import { getSuperAdminBillingScopeComplexIdFromRequest } from "@/lib/super-admin-scope";

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
        const search = searchParams.get("search")?.trim();

        const andParts: Prisma.InvoiceWhereInput[] = [
            { category: InvoiceCategory.UNIT_BILLING },
        ];

        if (complexId) andParts.push({ complexId });
        if (unitId) andParts.push({ unitId });
        if (status) andParts.push({ status: status as "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "PROCESSING" });
        if (month) andParts.push({ month: parseInt(month, 10) });
        if (year) andParts.push({ year: parseInt(year, 10) });

        if (search) {
            andParts.push({
                OR: [
                    { number: { contains: search } },
                    {
                        unit: {
                            residents: {
                                some: {
                                    user: {
                                        name: { contains: search },
                                    },
                                },
                            },
                        },
                    },
                    {
                        items: {
                            some: {
                                description: { contains: search },
                            },
                        },
                    },
                ],
            });
        }

        // RBAC filtering
        if (session.user.role === Role.ADMIN) {
            const complex = await prisma.complex.findFirst({
                where: { adminId: session.user.id },
            });
            if (!complex) return NextResponse.json([]);
            andParts.push({ complexId: complex.id });
        } else if (session.user.role === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id },
            });
            if (!resident) return NextResponse.json([]);
            andParts.push({ unitId: resident.unitId });

            const startDate = new Date(resident.startDate);
            const startYear = startDate.getFullYear();
            const startMonth = startDate.getMonth() + 1;

            andParts.push({
                OR: [
                    { year: { gt: startYear } },
                    {
                        AND: [{ year: startYear }, { month: { gte: startMonth } }],
                    },
                ],
            });
        } else if (session.user.role === Role.BOARD_OF_DIRECTORS) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true },
            });
            if (!user?.complexId) return NextResponse.json([]);
            andParts.push({ complexId: user.complexId });
        } else if (session.user.role === Role.SUPER_ADMIN) {
            const scoped = await getSuperAdminBillingScopeComplexIdFromRequest(request);
            if (scoped) andParts.push({ complexId: scoped });
        } else {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const whereClause: Prisma.InvoiceWhereInput = { AND: andParts };

        await prisma.invoice.updateMany({
            where: {
                status: "PENDING",
                dueDate: { lt: new Date() },
                category: InvoiceCategory.UNIT_BILLING,
                number: { not: { startsWith: "RES-" } },
            },
            data: { status: "OVERDUE" },
        });

        const invoices = await prisma.invoice.findMany({
            where: whereClause,
            include: {
                unit: {
                    include: {
                        residents: {
                            include: {
                                user: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                },
                complex: {
                    select: { name: true, phone: true, bankAccount: true, address: true }
                },
                reservation: {
                    select: { id: true, paymentMethod: true }
                },
                items: {
                    select: {
                        description: true,
                        amount: true,
                        serviceId: true
                    }
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
