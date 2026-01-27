import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { reservationSchema } from "@/lib/validations/reservation";

// Local Constants to avoid Prisma enum import issues in some environments
const Role = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    OPERATOR: 'OPERATOR',
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
        } else if (session.user.role === Role.OPERATOR || session.user.role === Role.SUPER_ADMIN) {
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

        // 3. Create reservation
        const reservation = await (prisma as any).reservation.create({
            data: {
                startTime: validatedData.startTime,
                endTime: validatedData.endTime,
                notes: validatedData.notes,
                userId: validatedData.userId,
                amenityId: validatedData.amenityId,
                totalCost: 0,
                status: session.user.role === Role.RESIDENT ? ReservationStatus.PENDING : ReservationStatus.APPROVED
            }
        });

        return NextResponse.json(reservation, { status: 201 });
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
