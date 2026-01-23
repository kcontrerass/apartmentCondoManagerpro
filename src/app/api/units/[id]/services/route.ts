import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { assignServiceSchema } from "@/lib/validations/service";
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

        const { id: unitId } = await params;

        const unitServices = await prisma.unitService.findMany({
            where: { unitId },
            include: {
                service: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(unitServices);
    } catch (error) {
        console.error("Error fetching unit services:", error);
        return NextResponse.json(
            { error: "Error al obtener los servicios de la unidad" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id: unitId } = await params;
        const body = await request.json();
        const validatedData = assignServiceSchema.parse(body);

        const unit = await prisma.unit.findUnique({
            where: { id: unitId },
            include: { complex: true },
        });

        if (!unit) {
            return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
        }

        // RBAC: Only SUPER_ADMIN or the ADMIN of the complex
        if (session.user.role === Role.ADMIN && unit.complex.adminId !== session.user.id) {
            return NextResponse.json(
                { error: "No tiene permiso para asignar servicios a esta unidad" },
                { status: 403 }
            );
        } else if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            return NextResponse.json(
                { error: "Solo administradores pueden asignar servicios" },
                { status: 403 }
            );
        }

        // Check if service belongs to the same complex as the unit
        const service = await prisma.service.findUnique({
            where: { id: validatedData.serviceId },
        });

        if (!service) {
            return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
        }

        if (service.complexId !== unit.complexId) {
            return NextResponse.json(
                { error: "El servicio debe pertenecer al mismo complejo que la unidad" },
                { status: 400 }
            );
        }

        const unitService = await prisma.unitService.create({
            data: {
                unitId,
                serviceId: validatedData.serviceId,
                customPrice: validatedData.customPrice,
                status: validatedData.status,
                startDate: validatedData.startDate,
                endDate: validatedData.endDate,
            },
        });

        return NextResponse.json(unitService, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        // Handle unique constraint violation (unitId, serviceId)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Esta unidad ya tiene asignado este servicio" }, { status: 409 });
        }
        console.error("Error assigning service to unit:", error);
        return NextResponse.json(
            { error: "Error al asignar el servicio" },
            { status: 500 }
        );
    }
}
