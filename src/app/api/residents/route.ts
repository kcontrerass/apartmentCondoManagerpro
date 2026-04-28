import { NextResponse } from "next/server";
import { InvoiceCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { residentSchema } from "@/lib/validations/resident";
import { Role } from "@/types/roles";
import { generateInvoicesForComplex } from "@/lib/services/invoice-generation";
import { sendUserNotification, notifyStaffOfAirbnbGuestRegistration } from "@/lib/notifications";
import { pushDashboardUrl } from "@/lib/push-dashboard-paths";
import { findResidentIdsByTextSearch } from "@/lib/residents-search-raw";
import {
    roleCanAccessAirbnbStaffRoutes,
    roleCanStaffManageResidentAirbnbFields,
} from "@/lib/complex-airbnb-guests";

export const dynamic = "force-dynamic";

const residentInclude = {
    user: {
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
        },
    },
    unit: {
        include: {
            complex: {
                select: {
                    name: true,
                },
            },
        },
    },
} as const;

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unitId = searchParams.get("unitId");
        const userIdFilter = searchParams.get("userId");
        let complexId = searchParams.get("complexId");
        const searchQ = searchParams.get("search")?.trim() ?? "";
        const isAirbnbOnly = searchParams.get("isAirbnb") === "true";

        // Scope by complex: admins/junta/guardia se limitan a su complejo. SUPER_ADMIN solo filtra si envía ?complexId=.
        if (!complexId && session.user.role !== Role.SUPER_ADMIN) {
            if (session.user.role === Role.ADMIN) {
                const adminComplex = await prisma.complex.findFirst({
                    where: { adminId: session.user.id }
                });
                if (!adminComplex) {
                    return NextResponse.json([]);
                }
                complexId = adminComplex.id;
            } else if (session.user.role === Role.BOARD_OF_DIRECTORS || session.user.role === Role.GUARD) {
                const user = await (prisma as any).user.findUnique({
                    where: { id: session.user.id },
                    select: { complexId: true }
                });
                if (!user?.complexId) {
                    return NextResponse.json([]);
                }
                complexId = user.complexId;
            }
        }

        if (isAirbnbOnly && session.user.role !== Role.SUPER_ADMIN) {
            if (!complexId) {
                return NextResponse.json([]);
            }
            const complexForAirbnb = await prisma.complex.findUnique({
                where: { id: complexId },
                select: { settings: true },
            });
            if (!roleCanAccessAirbnbStaffRoutes(complexForAirbnb?.settings, session.user.role as Role)) {
                return NextResponse.json([]);
            }
        }

        if (searchQ) {
            const ids = await findResidentIdsByTextSearch({
                search: searchQ,
                isAirbnbOnly,
                complexId,
                unitId,
                userIdFilter,
            });
            if (ids.length === 0) {
                return NextResponse.json([]);
            }
            const residents = await prisma.resident.findMany({
                where: { id: { in: ids } },
                include: residentInclude,
            });
            const orderMap = new Map(ids.map((id, i) => [id, i]));
            residents.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
            return NextResponse.json(residents);
        }

        const andFilters: Record<string, unknown>[] = [];
        if (unitId) andFilters.push({ unitId });
        if (userIdFilter) andFilters.push({ userId: userIdFilter });
        if (complexId) andFilters.push({ unit: { complexId } } as any);
        if (isAirbnbOnly) andFilters.push({ isAirbnb: true });

        const residents = await prisma.resident.findMany({
            where: andFilters.length > 0 ? { AND: andFilters } : {},
            include: residentInclude,
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(residents);
    } catch (error) {
        console.error("Error fetching residents:", error);
        return NextResponse.json(
            { error: "Error al obtener los residentes" },
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

        if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN && session.user.role !== Role.BOARD_OF_DIRECTORS) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = residentSchema.parse(body);

        // Verify user exists
        const userExists = await prisma.user.findUnique({
            where: { id: validatedData.userId }
        });
        if (!userExists) {
            return NextResponse.json({ error: "El usuario especificado no existe" }, { status: 404 });
        }

        // Verify unit exists
        const unitExists = await prisma.unit.findUnique({
            where: { id: validatedData.unitId },
            include: { complex: true }
        });
        if (!unitExists) {
            return NextResponse.json({ error: "La unidad especificada no existe" }, { status: 404 });
        }

        // RBAC: Verify user has permission to manage residents in this complex
        if (session.user.role === Role.ADMIN) {
            if (unitExists.complex.adminId !== session.user.id) {
                return NextResponse.json({ error: "No tienes permisos para gestionar residentes en este complejo" }, { status: 403 });
            }
        } else if (session.user.role === Role.BOARD_OF_DIRECTORS) {
            const user = await (prisma as any).user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true }
            });
            if (user?.complexId !== unitExists.complexId) {
                return NextResponse.json({ error: "No tienes permisos para gestionar residentes en este complejo" }, { status: 403 });
            }
        }

        const wantsAirbnb =
            Boolean(validatedData.isAirbnb) || validatedData.type === "AIRBNB_GUEST";

        if (
            wantsAirbnb &&
            !roleCanStaffManageResidentAirbnbFields(unitExists.complex.settings, session.user.role as Role)
        ) {
            return NextResponse.json(
                { error: "No tienes permiso para registrar huéspedes o la función está desactivada para tu rol" },
                { status: 403 }
            );
        }

        // Check if user is already a resident
        const existingResident = await prisma.resident.findUnique({
            where: { userId: validatedData.userId }
        });
        if (existingResident) {
            return NextResponse.json({ error: "Este usuario ya está asignado como residente a una unidad" }, { status: 400 });
        }

        // Perform all updates in a single transaction
        const resident = await (prisma as any).$transaction(async (tx: any) => {
            const newResident = await tx.resident.create({
                data: {
                    type: validatedData.type,
                    startDate: validatedData.startDate,
                    endDate: validatedData.endDate,
                    emergencyContact: (validatedData.emergencyContact as any) || {},
                    userId: validatedData.userId,
                    unitId: validatedData.unitId,
                    isAirbnb: wantsAirbnb,
                    airbnbStartDate: wantsAirbnb ? validatedData.airbnbStartDate : null,
                    airbnbEndDate: wantsAirbnb ? validatedData.airbnbEndDate : null,
                    airbnbGuestName: wantsAirbnb ? validatedData.airbnbGuestName?.trim() || null : null,
                    airbnbReservationCode: wantsAirbnb
                        ? validatedData.airbnbReservationCode?.trim() || null
                        : null,
                    airbnbGuestPhone: wantsAirbnb
                        ? validatedData.airbnbGuestPhone?.trim() || null
                        : null,
                    airbnbGuestIdentification: wantsAirbnb
                        ? validatedData.airbnbGuestIdentification?.trim() || null
                        : null,
                },
            });

            // Update unit status to OCCUPIED
            await tx.unit.update({
                where: { id: validatedData.unitId },
                data: { status: "OCCUPIED" }
            });

            // Auto-generate invoice if billing for this month has already started in the complex
            const startDate = new Date(validatedData.startDate);
            const month = startDate.getMonth() + 1;
            const year = startDate.getFullYear();

            const existingInvoices = await tx.invoice.findFirst({
                where: {
                    complexId: unitExists.complexId,
                    month,
                    year,
                    category: InvoiceCategory.UNIT_BILLING,
                }
            });

            if (existingInvoices) {
                console.log(`Auto-generating invoice for new resident in unit ${unitExists.number} for ${month}/${year}`);
                await generateInvoicesForComplex(tx, unitExists.complexId, month, year, validatedData.unitId);
            }

            return newResident;
        }, {
            timeout: 15000 // 15 seconds should be enough for a single unit
        });

        await sendUserNotification(validatedData.userId, {
            title: "Asignación de residente",
            body: `Te asignaron a la unidad ${unitExists.number} en ${unitExists.complex.name}.`,
            url: pushDashboardUrl.home,
        });

        if (wantsAirbnb) {
            const host = await prisma.user.findUnique({
                where: { id: validatedData.userId },
                select: { name: true },
            });
            await notifyStaffOfAirbnbGuestRegistration({
                complexId: unitExists.complexId,
                unitNumber: unitExists.number,
                residentName: host?.name ?? "Residente",
                guestName: validatedData.airbnbGuestName?.trim() ?? "",
                guestIdentification: validatedData.airbnbGuestIdentification?.trim() ?? "",
            });
        }

        return NextResponse.json(resident, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error creating resident:", error);
        return NextResponse.json(
            { error: "Error al crear el residente" },
            { status: 500 }
        );
    }
}
