import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { staffCreateSchema } from "@/lib/validations/staff";
import bcrypt from "bcrypt";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Only ADMIN and SUPER_ADMIN can manage staff
        if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            // Note: In prisma schema it is SUPER_ADMIN, checking lower case just in case but usually consistent. 
            // Wait, the enum is Role.SUPER_ADMIN. Let's stick to the enum.
        }

        // Re-check role enum usage. The user session role might be string or enum. 
        // Best to use the Prisma imported Role enum.

        if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const complexId = searchParams.get("complexId");

        // Admins can only see staff for their managed/assigned complex
        // Super Admins can see all, or filter by complexId

        let whereClause: any = {
            role: {
                in: [Role.GUARD, Role.OPERATOR, Role.ADMIN] // Staff roles
            }
        };

        if (session.user.role === Role.ADMIN) {
            // Find the complex this admin manages
            const complex = await prisma.complex.findFirst({
                where: { adminId: session.user.id }
            });

            if (!complex) {
                // If admin has no complex, maybe return empty or error?
                // Or maybe they are an ADMIN but assigned to a complex (unlikely based on schema, adminId is on Complex)
                // Let's assume complex.adminId is the robust way.
                return NextResponse.json([]);
            }
            whereClause.complexId = complex.id;
        } else if (complexId) {
            whereClause.complexId = complexId;
        }

        const staff = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                complexId: true,
                assignedComplex: {
                    select: { name: true }
                },
                managedComplexes: {
                    select: { name: true }
                },
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map to flat structure for frontend if needed, or just let frontend handle it.
        // Frontend expects "assignedComplex" object. Let's merge them.
        const mappedStaff = staff.map(user => ({
            ...user,
            assignedComplex: user.assignedComplex || (user.managedComplexes.length > 0 ? { name: user.managedComplexes[0].name } : null)
        }));

        return NextResponse.json(mappedStaff);

    } catch (error) {
        console.error("Error fetching staff:", error);
        return NextResponse.json({ error: "Error al obtener el personal" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = staffCreateSchema.parse(body);

        // RBAC: Logic for complex association
        let targetComplexId = validatedData.complexId || null;

        if (session.user.role === Role.ADMIN) {
            // Force assignment to Admin's complex
            const complex = await prisma.complex.findFirst({
                where: { adminId: session.user.id }
            });
            if (!complex) {
                return NextResponse.json({ error: "No tienes un complejo asignado para administrar" }, { status: 403 });
            }
            // Add check: Admin cannot create another ADMIN, only GUARD/OPERATOR (usually)
            // But let's allow flexibility for now or restrict?
            if (validatedData.role === Role.ADMIN) {
                return NextResponse.json({ error: "Solo súper administradores pueden crear otros administradores" }, { status: 403 });
            }

            targetComplexId = complex.id;
        } else {
            // Super Admins must specify complexId for staff

            // Complex ID is optional. If not provided, user is not assigned to any complex.
            // This is useful for creating Admins that might be assigned later, or unassigned staff.

            // However, regular staff (Guards/Operators) must usually be assigned to a complex to function.
            if (!targetComplexId && (validatedData.role === Role.GUARD || validatedData.role === Role.OPERATOR)) {
                return NextResponse.json({ error: "Debes asignar un complejo a los guardias y operadores" }, { status: 400 });
            }
        }

        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        const newUser = await prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                phone: validatedData.phone,
                password: hashedPassword,
                role: validatedData.role,
                complexId: targetComplexId,
                status: "ACTIVE"
            }
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json(userWithoutPassword, { status: 201 });

    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "El correo electrónico ya está registrado" }, { status: 409 });
        }
        console.error("Error creating staff:", error);
        return NextResponse.json({ error: "Error al crear el usuario" }, { status: 500 });
    }
}
