import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { reservationSchema } from "@/lib/validations/reservation";

// Local Constants to avoid Prisma enum import issues in some environments
const Role = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    BOARD_OF_DIRECTORS: 'BOARD_OF_DIRECTORS',
    RESIDENT: 'RESIDENT'
} as const;

const ReservationStatus = {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    CANCELLED: 'CANCELLED',
    REJECTED: 'REJECTED',
    COMPLETED: 'COMPLETED'
} as const;

type ReservationStatus = keyof typeof ReservationStatus;
type Role = keyof typeof Role;

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const amenityId = searchParams.get("amenityId");
        const userId = searchParams.get("userId");
        const status = searchParams.get("status") as ReservationStatus | null;
        const complexId = searchParams.get("complexId");

        const where: any = {};
        if (amenityId) where.amenityId = amenityId;
        if (userId) where.userId = userId;
        if (status) where.status = status;

        // RBAC: Residents can only see their own reservations
        if (session.user.role === Role.RESIDENT) {
            where.userId = session.user.id;
        } else if (session.user.role === Role.ADMIN) {
            // Admins can only see their complex's reservations
            where.amenity = {
                complex: {
                    adminId: session.user.id
                }
            };
        } else if (session.user.role === Role.BOARD_OF_DIRECTORS || session.user.role === Role.SUPER_ADMIN) {
            // SUPER_ADMIN and OPERATOR (if global) can see everything or filter by complex
            if (complexId) {
                where.amenity = { complexId };
            }
        }

        const reservations = await (prisma as any).reservation.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
                amenity: {
                    select: {
                        name: true,
                        complex: { select: { name: true } }
                    }
                }
            },
            orderBy: { startTime: 'desc' }
        });

        return NextResponse.json(reservations);
    } catch (error) {
        console.error("Error fetching reservations [API]:", error);
        return NextResponse.json(
            { error: "Error al obtener las reservaciones", details: error instanceof Error ? error.message : String(error) },
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

        // RBAC: Only Residents can create reservations
        if (session.user.role !== Role.RESIDENT) {
            return NextResponse.json({ error: "Solo los residentes pueden crear reservaciones" }, { status: 403 });
        }

        const body = await request.json();

        // Validation - Default userId to session if missing
        const userId = body.userId || session.user.id;

        const validatedData = reservationSchema.parse({
            ...body,
            userId
        });

        // 1. Check if amenity exists
        const amenity = await prisma.amenity.findUnique({
            where: { id: validatedData.amenityId }
        });

        if (!amenity) {
            return NextResponse.json({ error: "Amenidad no encontrada" }, { status: 404 });
        }

        // 1.5. Check Operating Hours
        if (amenity.operatingHours) {
            const hours = amenity.operatingHours as any;
            if (hours.open && hours.close) {
                const start = new Date(validatedData.startTime);
                const end = new Date(validatedData.endTime);

                const isWithinHours = (date: Date) => {
                    const h = date.getHours();
                    const m = date.getMinutes();
                    const timeMinutes = h * 60 + m;

                    const [openH, openM] = hours.open.split(':').map(Number);
                    const [closeH, closeM] = hours.close.split(':').map(Number);
                    const openMinutes = openH * 60 + openM;
                    const closeMinutes = closeH * 60 + closeM;

                    // Support for overnight hours (e.g. 22:00 to 02:00)
                    if (openMinutes <= closeMinutes) {
                        return timeMinutes >= openMinutes && timeMinutes <= closeMinutes;
                    } else {
                        return timeMinutes >= openMinutes || timeMinutes <= closeMinutes;
                    }
                };

                const isWithinDays = (date: Date) => {
                    if (!hours.days || !Array.isArray(hours.days) || hours.days.length === 0) return true;
                    return hours.days.includes(date.getDay());
                };

                if (!isWithinHours(start) || !isWithinHours(end) || !isWithinDays(start) || !isWithinDays(end)) {
                    let dayError = "";
                    if (!isWithinDays(start) || !isWithinDays(end)) {
                        dayError = " en los días seleccionados";
                    }
                    return NextResponse.json(
                        { error: `La amenidad no está disponible en este horario${dayError}. Horario: ${hours.open} - ${hours.close}` },
                        { status: 400 }
                    );
                }
            }
        }

        // 2. Cross-Complex Prevention for Residents
        if (session.user.role === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id },
                include: { unit: true }
            });
            if (!resident || !resident.unit || resident.unit.complexId !== amenity.complexId) {
                return NextResponse.json({ error: "No puedes reservar amenidades fuera de tu complejo" }, { status: 403 });
            }
        }

        // 3. Conflict Detection
        const conflictingReservations = await (prisma as any).reservation.findFirst({
            where: {
                amenityId: validatedData.amenityId,
                status: {
                    in: [ReservationStatus.PENDING, ReservationStatus.APPROVED]
                },
                OR: [
                    {
                        AND: [
                            { startTime: { lte: validatedData.startTime } },
                            { endTime: { gt: validatedData.startTime } }
                        ]
                    },
                    {
                        AND: [
                            { startTime: { lt: validatedData.endTime } },
                            { endTime: { gte: validatedData.endTime } }
                        ]
                    },
                    {
                        AND: [
                            { startTime: { gte: validatedData.startTime } },
                            { endTime: { lte: validatedData.endTime } }
                        ]
                    }
                ]
            }
        });

        if (conflictingReservations) {
            return NextResponse.json(
                { error: "La amenidad ya está reservada en este horario" },
                { status: 409 }
            );
        }

        // 4. Calculate Cost
        let totalCost = 0;
        const start = new Date(validatedData.startTime);
        const end = new Date(validatedData.endTime);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        const days = Math.ceil(hours / 24);

        if (amenity.costPerHour) {
            totalCost = hours * Number(amenity.costPerHour);
        } else if (amenity.costPerDay) {
            totalCost = days * Number(amenity.costPerDay);
        }

        // 4. Create reservation
        const reservation = await (prisma as any).reservation.create({
            data: {
                startTime: validatedData.startTime,
                endTime: validatedData.endTime,
                notes: validatedData.notes,
                userId: validatedData.userId,
                amenityId: validatedData.amenityId,
                totalCost: totalCost,
                paymentMethod: (body as any).paymentMethod,
                status: session.user.role === Role.RESIDENT ? ReservationStatus.PENDING : ReservationStatus.APPROVED
            }
        });

        // 5. Create Invoice if cost > 0
        let invoiceId = null;
        if (totalCost > 0) {
            const resident = await prisma.resident.findUnique({
                where: { userId: validatedData.userId },
                include: { unit: true }
            });

            if (resident && resident.unit) {
                const now = new Date();
                const invoiceNumber = `RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                const invoice = await (prisma as any).invoice.create({
                    data: {
                        number: invoiceNumber,
                        month: now.getMonth() + 1,
                        year: now.getFullYear(),
                        dueDate: now, // Due immediately
                        totalAmount: totalCost,
                        status: ReservationStatus.PENDING, // Initial status
                        unitId: resident.unit.id,
                        complexId: resident.unit.complexId,
                        paymentMethod: (body as any).paymentMethod,
                        items: {
                            create: {
                                description: `Reserva Amenidad: ${amenity.name}`,
                                amount: totalCost
                            }
                        }
                    }
                });
                invoiceId = invoice.id;

                // Link Invoice to Reservation
                await (prisma as any).reservation.update({
                    where: { id: reservation.id },
                    data: { invoiceId: invoice.id }
                });
            }
        }

        return NextResponse.json({ ...reservation, invoiceId }, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error creating reservation:", error);
        return NextResponse.json(
            { error: "Error al crear la reservación" },
            { status: 500 }
        );
    }
}
