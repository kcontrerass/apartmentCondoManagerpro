import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@/types/roles";
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
        const queryComplexId = searchParams.get("complexId");

        // RBAC Visibility Logic:
        // 1. ADMINs can ONLY see staff for their managed complex.
        // 2. SUPER_ADMINs can see all staff OR filter by query param.

        let effectiveComplexId = queryComplexId;

        if (session.user.role === Role.ADMIN) {
            // Force complexId from session
            const adminComplexId = (session.user as any).complexId;

            if (!adminComplexId) {
                // Admin has no complex assigned/managed, return empty
                return NextResponse.json([]);
            }

            effectiveComplexId = adminComplexId;
        }

        // Use queryRaw to bypass stale Enum validation in the running dev server
        const staff: any[] = await prisma.$queryRaw`
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.phone, 
                u.role, 
                u.status, 
                u.complex_id as complexId,
                u.createdAt,
                c.name as assignedComplexName,
                mc.name as managedComplexName
            FROM users u
            LEFT JOIN complexes c ON u.complex_id = c.id
            LEFT JOIN complexes mc ON mc.adminId = u.id
            WHERE u.role IN ('GUARD', 'BOARD_OF_DIRECTORS', 'ADMIN')
            AND (${effectiveComplexId} IS NULL OR u.complex_id = ${effectiveComplexId})
            ORDER BY u.createdAt DESC
        `;

        // Map to structure expected by frontend
        const mappedStaff = staff.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            status: u.status,
            complexId: u.complexId,
            createdAt: u.createdAt,
            assignedComplex: u.assignedComplexName ? { name: u.assignedComplexName } :
                (u.managedComplexName ? { name: u.managedComplexName } : null)
        }));

        return NextResponse.json(mappedStaff);

    } catch (error: any) {
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
            // Force assignment to Admin's complex from session
            const adminComplexId = (session.user as any).complexId;

            if (!adminComplexId) {
                return NextResponse.json({ error: "No tienes un complejo asignado para administrar" }, { status: 403 });
            }

            // Add check: Admin cannot create another ADMIN, only GUARD/BOARD_OF_DIRECTORS
            if (validatedData.role === Role.ADMIN || validatedData.role === Role.SUPER_ADMIN) {
                return NextResponse.json({ error: "Solo súper administradores pueden crear otros administradores" }, { status: 403 });
            }

            targetComplexId = adminComplexId;
        } else {
            // Super Admins must specify complexId for staff

            // Complex ID is optional. If not provided, user is not assigned to any complex.
            // This is useful for creating Admins that might be assigned later, or unassigned staff.

            // However, regular staff (Guards/Operators) must usually be assigned to a complex to function.
            if (!targetComplexId && (validatedData.role === Role.GUARD || validatedData.role === Role.BOARD_OF_DIRECTORS)) {
                return NextResponse.json({ error: "Debes asignar un complejo a los guardias y miembros de la junta" }, { status: 400 });
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
