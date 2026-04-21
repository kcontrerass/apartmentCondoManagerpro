import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ComplexCreateSchema } from "@/lib/validations/complex";
import { Role } from "@/types/roles";
import type { ComplexType, Prisma } from "@prisma/client";
import { complexListApiSelect } from "@/lib/complex-list-select";
import { getPlatformSubscriptionGraceDays } from "@/lib/platform-subscription-access";
import { evaluatePlatformSubscriptionAccess } from "@/lib/platform-subscription-rules";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const type = searchParams.get("type");
        const complexId = searchParams.get("complexId"); // For filtering by specific complex

        const andConditions: Record<string, unknown>[] = [
            {
                OR: [
                    { name: { contains: search } },
                    { address: { contains: search } },
                ],
            },
        ];
        if (type) {
            andConditions.push({ type: type as ComplexType });
        }

        // If complexId is provided in query, filter by it (for RESIDENT search)
        if (complexId) {
            andConditions.push({ id: complexId });
        } else if (session.user.role === Role.ADMIN) {
            const adminComplex = await prisma.complex.findFirst({
                where: { adminId: session.user.id },
                select: { id: true },
            });

            if (!adminComplex) {
                return NextResponse.json([]);
            }

            andConditions.push({ id: adminComplex.id });
        } else if (session.user.role === Role.BOARD_OF_DIRECTORS || session.user.role === Role.GUARD) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true },
            });

            if (!user?.complexId) {
                return NextResponse.json([]);
            }

            andConditions.push({ id: user.complexId });
        }

        const whereClause = { AND: andConditions };

        const superSelect = {
            ...complexListApiSelect,
            platformPaidUntil: true,
        } satisfies Prisma.ComplexSelect;

        const complexes = await prisma.complex.findMany({
            where: whereClause,
            select:
                session.user.role === Role.SUPER_ADMIN ? superSelect : complexListApiSelect,
            orderBy: {
                createdAt: "desc",
            },
        });

        if (session.user.role === Role.SUPER_ADMIN) {
            const graceDays = await getPlatformSubscriptionGraceDays();
            type SuperRow = Prisma.ComplexGetPayload<{ select: typeof superSelect }>;
            const payload = (complexes as SuperRow[]).map((c) => {
                const pastDue = !evaluatePlatformSubscriptionAccess({
                    platformPaidUntil: c.platformPaidUntil ?? null,
                    complexCreatedAt: c.createdAt,
                    graceDays,
                }).allowed;
                return { ...c, platformSubscriptionPastDue: pastDue };
            });
            return NextResponse.json(payload);
        }

        return NextResponse.json(complexes);
    } catch (error) {
        console.error("Error fetching complexes:", error);
        const detail = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            {
                error: "Error al obtener los complejos",
                ...(process.env.NODE_ENV === "development" ? { detail } : {}),
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Role check: Only SUPER_ADMIN can create complexes
        if (session.user.role !== Role.SUPER_ADMIN) {
            return NextResponse.json({ error: "Solo el Super Administrador puede crear complejos" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = ComplexCreateSchema.parse(body);

        let adminIdToAssign = validatedData.adminId;


        const complex = await prisma.$transaction(async (tx) => {
            const newComplex = await tx.complex.create({
                data: {
                    name: validatedData.name,
                    address: validatedData.address,
                    type: validatedData.type,
                    logoUrl: validatedData.logoUrl,
                    bankAccount: validatedData.bankAccount,
                    phone: validatedData.phone,
                    settings: validatedData.settings || {},
                    adminId: adminIdToAssign,
                },
            });

            if (adminIdToAssign) {
                // Check if this complex already has other users with Rule.ADMIN (unlikely for new complex but for consistency)
                // Actually, for a new complex, there are no users yet.

                await tx.user.update({
                    where: { id: adminIdToAssign },
                    data: {
                        complexId: newComplex.id,
                        role: Role.ADMIN // Ensure they have the ADMIN role
                    }
                });
            }

            return newComplex;
        });

        return NextResponse.json(complex, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        // Prisma unique constraint violation
        if (error.code === 'P2002' && error.meta?.target?.includes('adminId')) {
            return NextResponse.json(
                { error: "El administrador seleccionado ya está asignado a otro complejo. Un administrador solo puede gestionar un complejo." },
                { status: 409 }
            );
        }
        console.error("Error creating complex:", error);
        return NextResponse.json(
            { error: "Error al crear el complejo" },
            { status: 500 }
        );
    }
}
