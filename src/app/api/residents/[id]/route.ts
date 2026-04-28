import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { residentPatchSchema } from "@/lib/validations/resident";
import { Role } from "@/types/roles";
import type { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { notifyStaffOfAirbnbGuestRegistration } from "@/lib/notifications";
import { roleCanStaffManageResidentAirbnbFields } from "@/lib/complex-airbnb-guests";

const AIRBNB_PATCH_KEYS = [
    "isAirbnb",
    "airbnbStartDate",
    "airbnbEndDate",
    "airbnbGuestName",
    "airbnbReservationCode",
    "airbnbGuestPhone",
    "airbnbGuestIdentification",
] as const;

function patchTouchesAirbnbFields(body: Record<string, unknown>): boolean {
    if (body.type === "AIRBNB_GUEST") return true;
    return AIRBNB_PATCH_KEYS.some((k) => body[k] !== undefined);
}

/** PATCH puede enviar `null`; evita `.trim()` sobre null (lanzaba 500). */
function toNullableTrimmed(v: unknown): string | null {
    if (v == null) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const resident = await prisma.resident.findUnique({
            where: { id },
            include: {
                user: true,
                unit: {
                    include: {
                        complex: true,
                    },
                },
            },
        });

        if (!resident) {
            return NextResponse.json({ error: "Residente no encontrado" }, { status: 404 });
        }

        return NextResponse.json(resident);
    } catch (error) {
        return NextResponse.json(
            { error: "Error al obtener el residente" },
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

        if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN && session.user.role !== Role.BOARD_OF_DIRECTORS) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        // Get resident to check complex permission
        const residentToCheck = await prisma.resident.findUnique({
            where: { id },
            include: { unit: { include: { complex: true } } }
        });

        if (!residentToCheck) {
            return NextResponse.json({ error: "Residente no encontrado" }, { status: 404 });
        }

        // RBAC: Verify user has permission to manage residents in this complex
        if (session.user.role === Role.ADMIN) {
            if (residentToCheck.unit.complex.adminId !== session.user.id) {
                return NextResponse.json({ error: "No tienes permisos para gestionar residentes en este complejo" }, { status: 403 });
            }
        } else if (session.user.role === Role.BOARD_OF_DIRECTORS) {
            const user = await (prisma as any).user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true }
            });
            if (user?.complexId !== residentToCheck.unit.complexId) {
                return NextResponse.json({ error: "No tienes permisos para gestionar residentes en este complejo" }, { status: 403 });
            }
        }

        const body = await request.json();
        const validatedData = residentPatchSchema.parse(body);

        const airbnbEnabled = roleCanStaffManageResidentAirbnbFields(
            residentToCheck.unit.complex.settings,
            session.user.role as Role
        );
        if (!airbnbEnabled) {
            if (validatedData.isAirbnb === true || validatedData.type === "AIRBNB_GUEST") {
                return NextResponse.json(
                    { error: "No tienes permiso para registrar huéspedes o la función está desactivada para tu rol" },
                    { status: 403 }
                );
            }
            if (validatedData.isAirbnb !== false && patchTouchesAirbnbFields(validatedData as Record<string, unknown>)) {
                return NextResponse.json(
                    { error: "No tienes permiso para registrar huéspedes o la función está desactivada para tu rol" },
                    { status: 403 }
                );
            }
        }

        const {
            userId,
            unitId,
            type,
            startDate,
            endDate,
            emergencyContact,
            isAirbnb,
            airbnbStartDate,
            airbnbEndDate,
            airbnbGuestName,
            airbnbReservationCode,
            airbnbGuestPhone,
            airbnbGuestIdentification,
        } = validatedData;

        // Verify user exists if provided
        if (validatedData.userId) {
            const userExists = await prisma.user.findUnique({
                where: { id: validatedData.userId }
            });
            if (!userExists) {
                return NextResponse.json({ error: "El usuario especificado no existe" }, { status: 404 });
            }

            // Check if user is already a resident (and not the same record)
            const existingResident = await prisma.resident.findUnique({
                where: { userId: validatedData.userId }
            });
            if (existingResident && existingResident.id !== id) {
                return NextResponse.json({ error: "Este usuario ya está asignado como residente a otra unidad" }, { status: 400 });
            }
        }

        // Verify unit exists if provided
        if (validatedData.unitId) {
            const unitExists = await prisma.unit.findUnique({
                where: { id: validatedData.unitId }
            });
            if (!unitExists) {
                return NextResponse.json({ error: "La unidad especificada no existe" }, { status: 404 });
            }
        }

        const data: Prisma.ResidentUncheckedUpdateInput = {};

        if (userId !== undefined) data.userId = userId;
        if (unitId !== undefined) data.unitId = unitId;
        if (type !== undefined) data.type = type;
        if (startDate !== undefined) data.startDate = startDate;
        if (endDate !== undefined) data.endDate = endDate;
        if (emergencyContact !== undefined) data.emergencyContact = emergencyContact as object;

        if (
            type !== undefined &&
            type !== "AIRBNB_GUEST" &&
            residentToCheck.type === "AIRBNB_GUEST"
        ) {
            data.isAirbnb = false;
            data.airbnbStartDate = null;
            data.airbnbEndDate = null;
            data.airbnbGuestName = null;
            data.airbnbReservationCode = null;
            data.airbnbGuestPhone = null;
            data.airbnbGuestIdentification = null;
        }

        if (isAirbnb !== undefined) {
            data.isAirbnb = isAirbnb;
            if (isAirbnb === false) {
                data.airbnbStartDate = null;
                data.airbnbEndDate = null;
                data.airbnbGuestName = null;
                data.airbnbReservationCode = null;
                data.airbnbGuestPhone = null;
                data.airbnbGuestIdentification = null;
            }
        }

        if (type === "AIRBNB_GUEST") {
            data.isAirbnb = true;
        }

        if (isAirbnb !== false) {
            if (airbnbStartDate !== undefined) data.airbnbStartDate = airbnbStartDate;
            if (airbnbEndDate !== undefined) data.airbnbEndDate = airbnbEndDate;
            if (airbnbGuestName !== undefined) data.airbnbGuestName = toNullableTrimmed(airbnbGuestName);
            if (airbnbReservationCode !== undefined)
                data.airbnbReservationCode = toNullableTrimmed(airbnbReservationCode);
            if (airbnbGuestPhone !== undefined) data.airbnbGuestPhone = toNullableTrimmed(airbnbGuestPhone);
            if (airbnbGuestIdentification !== undefined)
                data.airbnbGuestIdentification = toNullableTrimmed(airbnbGuestIdentification);
        }

        if (Object.keys(data).length === 0) {
            const unchanged = await prisma.resident.findUnique({
                where: { id },
                include: {
                    user: true,
                    unit: { include: { complex: true } },
                },
            });
            if (!unchanged) {
                return NextResponse.json({ error: "Residente no encontrado" }, { status: 404 });
            }
            return NextResponse.json(unchanged);
        }

        const resident = await prisma.resident.update({
            where: { id },
            data,
        });

        if (resident.isAirbnb) {
            const ctx = await prisma.resident.findUnique({
                where: { id: resident.id },
                include: { unit: true, user: { select: { name: true } } },
            });
            if (ctx?.unit?.complexId && ctx.user) {
                await notifyStaffOfAirbnbGuestRegistration({
                    complexId: ctx.unit.complexId,
                    unitNumber: ctx.unit.number,
                    residentName: ctx.user.name,
                    guestName: ctx.airbnbGuestName?.trim() ?? "",
                    guestIdentification: ctx.airbnbGuestIdentification?.trim() ?? "",
                });
            }
        }

        return NextResponse.json(resident);
    } catch (error: unknown) {
        if (error instanceof ZodError) {
            return NextResponse.json({ error: error.flatten() }, { status: 400 });
        }
        console.error("[residents PATCH]", error);
        return NextResponse.json(
            { error: "Error al actualizar el residente" },
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

        if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN && session.user.role !== Role.BOARD_OF_DIRECTORS) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        // Get resident to find unitId and check complex permission
        const resident = await prisma.resident.findUnique({
            where: { id },
            include: { unit: { include: { complex: true } } }
        });

        if (!resident) {
            return NextResponse.json({ error: "Residente no encontrado" }, { status: 404 });
        }

        // RBAC: Verify user has permission to manage residents in this complex
        if (session.user.role === Role.ADMIN) {
            if (resident.unit.complex.adminId !== session.user.id) {
                return NextResponse.json({ error: "No tienes permisos para gestionar residentes en este complejo" }, { status: 403 });
            }
        } else if (session.user.role === Role.BOARD_OF_DIRECTORS) {
            const user = await (prisma as any).user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true }
            });
            if (user?.complexId !== resident.unit.complexId) {
                return NextResponse.json({ error: "No tienes permisos para gestionar residentes en este complejo" }, { status: 403 });
            }
        }

        const unitId = resident.unitId;

        // Delete the resident
        await prisma.resident.delete({
            where: { id },
        });

        // Check if there are any other active residents for this unit
        const remainingResidents = await prisma.resident.count({
            where: { unitId }
        });

        // If no residents left, mark unit as VACANT
        if (remainingResidents === 0) {
            await prisma.unit.update({
                where: { id: unitId },
                data: { status: "VACANT" }
            });
        }

        return NextResponse.json({ message: "Residente eliminado exitosamente" });
    } catch (error) {
        console.error("Error deleting resident:", error);
        return NextResponse.json(
            { error: "Error al eliminar el residente" },
            { status: 500 }
        );
    }
}
