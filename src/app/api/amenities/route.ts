import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { createAmenitySchema } from "@/lib/validations/amenity";
import { Role } from "@/types/roles";
import { sendComplexNotification } from "@/lib/notifications";
import { pushDashboardUrl } from "@/lib/push-dashboard-paths";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const complexId = searchParams.get("complexId");
        const searchQ = searchParams.get("search")?.trim() ?? "";

        const baseWhere: any = {};

        // RBAC:
        // Residents can ONLY see amenities of their own complex
        // Admins see by default their own complex's amenities
        // SUPER_ADMIN and OPERATOR can see everything or filter
        if (session.user.role === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id },
                include: { unit: true }
            });

            if (!resident?.unit) {
                console.warn(`Resident user ${session.user.id} has no assigned unit/complex.`);
                return NextResponse.json([]); // Return empty list instead of error
            }

            baseWhere.complexId = resident.unit.complexId;
            console.log(`[API Amenities] Resident ${session.user.id} filtering by complex: ${baseWhere.complexId}`);
        } else if (session.user.role === Role.ADMIN || session.user.role === Role.BOARD_OF_DIRECTORS || session.user.role === Role.GUARD) {
            const userComplexId = (session.user as any).complexId;
            if (!userComplexId) {
                return NextResponse.json([]);
            }
            if (complexId && complexId !== userComplexId) {
                return NextResponse.json({ error: "No tienes permiso para ver amenidades de este complejo" }, { status: 403 });
            }
            baseWhere.complexId = userComplexId;
            console.log(`[API Amenities] Managed user ${session.user.id} filtering by complex: ${baseWhere.complexId}`);
        } else if (complexId) {
            // Other roles (SUPER_ADMIN) filter by complex if provided
            baseWhere.complexId = complexId;
            console.log(`[API Amenities] Other role filtering by complex: ${baseWhere.complexId}`);
        }

        const where: any =
            searchQ
                ? {
                      AND: [
                          ...(Object.keys(baseWhere).length > 0 ? [baseWhere] : []),
                          {
                              OR: [
                                  { name: { contains: searchQ } },
                                  { description: { contains: searchQ } },
                                  { complex: { name: { contains: searchQ } } },
                              ],
                          },
                      ],
                  }
                : baseWhere;

        console.log("[API Amenities] Where clause:", JSON.stringify(where, null, 2));

        const amenities = await prisma.amenity.findMany({
            where,
            include: {
                complex: {
                    select: { name: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(amenities);
    } catch (error) {
        console.error("Error fetching amenities:", error);
        return NextResponse.json(
            { error: "Error al obtener las amenidades" },
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

        // RBAC Check
        if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.BOARD_OF_DIRECTORS) {
            return NextResponse.json({ error: "No tienes permiso para crear amenidades" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = createAmenitySchema.parse(body);

        // RBAC Check per complex
        if (session.user.role === Role.ADMIN || session.user.role === Role.BOARD_OF_DIRECTORS) {
            const userComplexId = (session.user as any).complexId;
            if (!userComplexId || userComplexId !== validatedData.complexId) {
                return NextResponse.json({ error: "No tienes permiso para gestionar amenidades en este complejo" }, { status: 403 });
            }
        }

        const amenity = await prisma.amenity.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                type: validatedData.type,
                requiresPayment: validatedData.requiresPayment,
                capacity: validatedData.capacity,
                operatingHours: validatedData.operatingHours ? {
                    ...validatedData.operatingHours,
                    days: (validatedData.operatingHours as any).days || [0, 1, 2, 3, 4, 5, 6]
                } : undefined,
                costPerDay: validatedData.costPerDay,
                costPerHour: validatedData.costPerHour,
                securityDeposit: validatedData.securityDeposit,
                complexId: validatedData.complexId
            }
        });

        await sendComplexNotification(
            validatedData.complexId,
            ["RESIDENT", "GUARD", "BOARD_OF_DIRECTORS", "ADMIN"],
            {
                title: "Nueva amenidad",
                body: amenity.name,
                url: pushDashboardUrl.amenities,
            }
        );

        return NextResponse.json(amenity, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error creating amenity:", error);
        return NextResponse.json(
            { error: "Error al crear la amenidad" },
            { status: 500 }
        );
    }
}
