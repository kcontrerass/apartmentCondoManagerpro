import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { residentAirbnbSelfSchema } from "@/lib/validations/resident";
import { Role } from "@/types/roles";
import type { Prisma } from "@prisma/client";
import { notifyStaffOfAirbnbGuestRegistration } from "@/lib/notifications";
import { roleCanResidentUseAirbnbSelfService } from "@/lib/complex-airbnb-guests";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (session.user.role !== Role.RESIDENT) {
            return NextResponse.json({ error: "Solo los residentes pueden actualizar esta información" }, { status: 403 });
        }

        const resident = await prisma.resident.findUnique({
            where: { userId: session.user.id },
            include: {
                unit: {
                    include: {
                        complex: { select: { settings: true } },
                    },
                },
            },
        });

        if (!resident) {
            return NextResponse.json({ error: "No tienes una unidad asignada" }, { status: 404 });
        }

        const body = await request.json();
        const data = residentAirbnbSelfSchema.parse(body);

        if (data.isAirbnb && !roleCanResidentUseAirbnbSelfService(resident.unit?.complex?.settings)) {
            return NextResponse.json(
                { error: "El registro de huéspedes no está disponible para residentes en tu complejo" },
                { status: 403 }
            );
        }

        const update: Prisma.ResidentUncheckedUpdateInput = {
            isAirbnb: data.isAirbnb,
        };

        if (!data.isAirbnb) {
            update.airbnbStartDate = null;
            update.airbnbEndDate = null;
            update.airbnbGuestName = null;
            update.airbnbReservationCode = null;
            update.airbnbGuestPhone = null;
            update.airbnbGuestIdentification = null;
        } else {
            update.airbnbStartDate = data.airbnbStartDate ?? null;
            update.airbnbEndDate = data.airbnbEndDate ?? null;
            update.airbnbGuestName = data.airbnbGuestName?.trim() || null;
            update.airbnbReservationCode = data.airbnbReservationCode?.trim() || null;
            update.airbnbGuestPhone = data.airbnbGuestPhone?.trim() || null;
            update.airbnbGuestIdentification = data.airbnbGuestIdentification?.trim() || null;
        }

        const updated = await prisma.resident.update({
            where: { id: resident.id },
            data: update,
        });

        if (updated.isAirbnb) {
            const ctx = await prisma.resident.findUnique({
                where: { id: updated.id },
                include: { unit: true, user: { select: { name: true } } },
            });
            if (ctx?.unit?.complexId && ctx.user) {
                await notifyStaffOfAirbnbGuestRegistration({
                    complexId: ctx.unit.complexId,
                    unitNumber: ctx.unit.number,
                    residentName: ctx.user.name,
                    guestName: updated.airbnbGuestName?.trim() ?? "",
                    guestIdentification: updated.airbnbGuestIdentification?.trim() ?? "",
                });
            }
        }

        return NextResponse.json(updated);
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("PATCH /api/residents/me/airbnb:", error);
        return NextResponse.json({ error: "Error al guardar la información" }, { status: 500 });
    }
}
