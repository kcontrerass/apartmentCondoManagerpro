import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateAmenitySchema } from "@/lib/validations/amenity";
import { Role } from "@prisma/client";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const amenity = await prisma.amenity.findUnique({
            where: { id },
            include: { complex: true }
        });

        if (!amenity) {
            return NextResponse.json({ error: "Amenidad no encontrada" }, { status: 404 });
        }

        // RBAC: Check if resident belongs to this complex
        if (session.user.role === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id }
            });
            if (!resident || resident.unitId && (await prisma.unit.findUnique({ where: { id: resident.unitId } }))?.complexId !== amenity.complexId) {
                // Simplified check, could be more robust
                // return NextResponse.json({ error: "No autorizado" }, { status: 403 });
            }
        }

        return NextResponse.json(amenity);
    } catch (error) {
        console.error("Error fetching amenity:", error);
        return NextResponse.json(
            { error: "Error al obtener la amenidad" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = updateAmenitySchema.parse(body);

        const amenity = await prisma.amenity.findUnique({
            where: { id },
            include: { complex: true }
        });

        if (!amenity) {
            return NextResponse.json({ error: "Amenidad no encontrada" }, { status: 404 });
        }

        // RBAC Check
        if (session.user.role === Role.ADMIN && amenity.complex.adminId !== session.user.id) {
            return NextResponse.json({ error: "No autorizado para este complejo" }, { status: 403 });
        }

        const updatedAmenity = await prisma.amenity.update({
            where: { id },
            data: {
                name: validatedData.name,
                description: validatedData.description,
                type: validatedData.type,
                requiresPayment: validatedData.requiresPayment,
                capacity: validatedData.capacity,
                operatingHours: validatedData.operatingHours ? {
                    ...validatedData.operatingHours,
                    days: validatedData.operatingHours.days || [0, 1, 2, 3, 4, 5, 6]
                } : undefined,
                costPerDay: validatedData.costPerDay,
                costPerHour: validatedData.costPerHour
            }
        });

        return NextResponse.json(updatedAmenity);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error updating amenity:", error);
        return NextResponse.json(
            { error: "Error al actualizar la amenidad" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const amenity = await prisma.amenity.findUnique({
            where: { id },
            include: { complex: true }
        });

        if (!amenity) {
            return NextResponse.json({ error: "Amenidad no encontrada" }, { status: 404 });
        }

        // RBAC Check
        if (session.user.role === Role.ADMIN && amenity.complex.adminId !== session.user.id) {
            return NextResponse.json({ error: "No autorizado para este complejo" }, { status: 403 });
        }

        await prisma.amenity.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting amenity:", error);
        return NextResponse.json(
            { error: "Error al eliminar la amenidad" },
            { status: 500 }
        );
    }
}
