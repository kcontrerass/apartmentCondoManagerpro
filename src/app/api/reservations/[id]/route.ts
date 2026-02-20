import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { ReservationStatus } from "@prisma/client";
import { Role } from "@/types/roles";
import { reservationSchema, updateReservationSchema } from "@/lib/validations/reservation";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const reservation = await prisma.reservation.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true } },
                amenity: {
                    select: {
                        id: true,
                        name: true,
                        complexId: true,
                        complex: { select: { name: true, adminId: true } }
                    }
                }
            }
        });

        if (!reservation) {
            return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 });
        }

        // RBAC Check
        const isOwner = reservation.userId === session.user.id;
        const isAdminOfComplex = reservation.amenity.complex.adminId === session.user.id;
        const isSuperAdmin = session.user.role === Role.SUPER_ADMIN;

        if (!isOwner && !isAdminOfComplex && !isSuperAdmin) {
            return NextResponse.json({ error: "No tienes permiso para ver esta reservación" }, { status: 403 });
        }

        return NextResponse.json(reservation);
    } catch (error) {
        console.error("Error fetching reservation:", error);
        return NextResponse.json(
            { error: "Error al obtener la reservación" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const existing = await prisma.reservation.findUnique({
            where: { id },
            include: { amenity: { select: { complex: { select: { adminId: true } } } } }
        });

        if (!existing) {
            return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 });
        }

        // RBAC Check refined
        const isSuperAdmin = session.user.role === Role.SUPER_ADMIN;
        const isAdminOfComplex = session.user.role === Role.ADMIN && existing.amenity.complex.adminId === session.user.id;
        const isOperator = session.user.role === Role.BOARD_OF_DIRECTORS;
        const isOwner = existing.userId === session.user.id;

        if (!isSuperAdmin && !isAdminOfComplex && !isOperator && !isOwner) {
            console.warn(`403: User ${session.user.id} (${session.user.role}) attempted to update reservation ${id}`);
            return NextResponse.json({ error: "No tienes permiso para modificar esta reservación" }, { status: 403 });
        }

        // Validation
        const validatedData = updateReservationSchema.parse(body);

        // Check Operating Hours if time is being changed
        if (validatedData.startTime || validatedData.endTime) {
            const amenity = await prisma.amenity.findUnique({
                where: { id: existing.amenityId }
            });

            if (amenity && amenity.operatingHours) {
                const hours = amenity.operatingHours as any;
                if (hours.open && hours.close) {
                    const start = new Date(validatedData.startTime || existing.startTime);
                    const end = new Date(validatedData.endTime || existing.endTime);

                    const isWithinHours = (date: Date) => {
                        const h = date.getHours();
                        const m = date.getMinutes();
                        const timeMinutes = h * 60 + m;

                        const [openH, openM] = hours.open.split(':').map(Number);
                        const [closeH, closeM] = hours.close.split(':').map(Number);
                        const openMinutes = openH * 60 + openM;
                        const closeMinutes = closeH * 60 + closeM;

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
        }

        // Security: Residents can ONLY cancel their own reservations
        if (session.user.role === Role.RESIDENT) {
            if (Object.keys(body).length > 1 || body.status !== ReservationStatus.CANCELLED) {
                return NextResponse.json({ error: "Solo puedes cancelar tu propia reservación" }, { status: 403 });
            }
        }

        // --- CONFLICT DETECTION ON APPROVAL ---
        if (validatedData.status === ReservationStatus.APPROVED) {
            const startTime = validatedData.startTime || existing.startTime;
            const endTime = validatedData.endTime || existing.endTime;

            const conflict = await (prisma as any).reservation.findFirst({
                where: {
                    id: { not: id },
                    amenityId: existing.amenityId,
                    status: ReservationStatus.APPROVED,
                    OR: [
                        {
                            AND: [
                                { startTime: { lte: startTime } },
                                { endTime: { gt: startTime } }
                            ]
                        },
                        {
                            AND: [
                                { startTime: { lt: endTime } },
                                { endTime: { gte: endTime } }
                            ]
                        },
                        {
                            AND: [
                                { startTime: { gte: startTime } },
                                { endTime: { lte: endTime } }
                            ]
                        }
                    ]
                }
            });

            if (conflict) {
                return NextResponse.json(
                    { error: "No se puede aprobar: ya existe una reservación aprobada en este horario." },
                    { status: 409 }
                );
            }
        }

        console.log(`Updating reservation ${id} with data:`, validatedData);

        const reservation = await (prisma as any).reservation.update({
            where: { id },
            data: validatedData
        });

        return NextResponse.json(reservation);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error updating reservation [API]:", error);
        return NextResponse.json(
            { error: "Error al actualizar la reservación", details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const existing = await prisma.reservation.findUnique({
            where: { id },
            include: { amenity: { select: { complex: { select: { adminId: true } } } } }
        });

        if (!existing) {
            return NextResponse.json({ error: "Reservación no encontrada" }, { status: 404 });
        }

        // RBAC Check: Only Admin or Super Admin can delete (hard delete)
        const isAdminOfComplex = existing.amenity.complex.adminId === session.user.id;
        const isSuperAdmin = session.user.role === Role.SUPER_ADMIN;

        if (!isAdminOfComplex && !isSuperAdmin) {
            return NextResponse.json({ error: "No tienes permiso para eliminar esta reservación" }, { status: 403 });
        }

        await prisma.reservation.delete({
            where: { id }
        });

        return new Response(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting reservation:", error);
        return NextResponse.json(
            { error: "Error al eliminar la reservación" },
            { status: 500 }
        );
    }
}
