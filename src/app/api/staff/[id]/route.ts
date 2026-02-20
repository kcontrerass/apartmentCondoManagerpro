import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@/types/roles";
import { staffUpdateSchema } from "@/lib/validations/staff";
import bcrypt from "bcrypt";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = staffUpdateSchema.parse(body);

        // Fetch user to update using raw SQL to bypass enum validation
        const users: any[] = await prisma.$queryRaw`
            SELECT id, name, email, role, status, complex_id as complexId FROM users WHERE id = ${id} LIMIT 1
        `;
        const userToUpdate = users[0];

        if (!userToUpdate) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Check Permissions
        if (session.user.role === Role.ADMIN) {
            // Only update staff in their managed complex
            const adminComplexId = (session.user as any).complexId;

            if (!adminComplexId || userToUpdate.complexId !== adminComplexId) {
                return NextResponse.json({ error: "No tienes permiso sobre este usuario" }, { status: 403 });
            }

            // Prevent Admin from modifying Super Admins or other Admins
            if (userToUpdate.role === Role.SUPER_ADMIN || userToUpdate.role === Role.ADMIN) {
                if (userToUpdate.id !== session.user.id) {
                    return NextResponse.json({ error: "No puedes modificar a otros administradores" }, { status: 403 });
                }
            }
        }

        const updateData: any = { ...validatedData };
        if (validatedData.password) {
            updateData.password = await bcrypt.hash(validatedData.password, 10);
        }

        // Build dynamic UPDATE query for MySQL
        const setStatements = [];
        const values = [];
        for (const [key, value] of Object.entries(updateData)) {
            if (value === undefined) continue;
            // Map camelCase to snake_case for DB
            const dbKey = key === 'complexId' ? 'complex_id' : key;
            setStatements.push(`${dbKey} = ?`);
            values.push(value);
        }

        if (setStatements.length > 0) {
            values.push(id);
            const query = `UPDATE users SET ${setStatements.join(', ')}, updatedAt = NOW() WHERE id = ?`;
            await prisma.$executeRawUnsafe(query, ...values);
        }

        // Fetch updated user to return (again using raw SQL)
        const updatedUsers: any[] = await prisma.$queryRaw`
            SELECT id, name, email, role, status, complex_id as complexId FROM users WHERE id = ${id} LIMIT 1
        `;
        return NextResponse.json(updatedUsers[0]);

    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error updating staff:", error);
        return NextResponse.json({ error: "Error al actualizar el usuario", details: error.message }, { status: 500 });
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

        if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        const { id } = await params;

        // Fetch user using raw SQL
        const users: any[] = await prisma.$queryRaw`
            SELECT id, role, complex_id as complexId FROM users WHERE id = ${id} LIMIT 1
        `;
        const userToDelete = users[0];

        if (!userToDelete) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // RBAC Checks for Delete (same as Update)
        if (session.user.role === Role.ADMIN) {
            const adminComplexId = (session.user as any).complexId;

            if (!adminComplexId || userToDelete.complexId !== adminComplexId) {
                return NextResponse.json({ error: "No tienes permiso sobre este usuario" }, { status: 403 });
            }

            if (userToDelete.role === Role.SUPER_ADMIN || userToDelete.role === Role.ADMIN) {
                return NextResponse.json({ error: "No puedes eliminar administradores" }, { status: 403 });
            }
        }

        try {
            await prisma.$executeRaw`DELETE FROM users WHERE id = ${id}`;
        } catch (dbError: any) {
            // Check for foreign key constraint (Prisma might wrap this differently for raw SQL, but we'll try)
            if (dbError.message?.includes('foreign key constraint') || dbError.code === 'P2003') {
                return NextResponse.json({
                    error: "No se puede eliminar el usuario porque tiene registros asociados. Intenta desactivarlo en su lugar."
                }, { status: 409 });
            }
            throw dbError;
        }

        return NextResponse.json({ message: "Usuario eliminado correctamente" });

    } catch (error: any) {
        console.error("Error deleting staff:", error);
        return NextResponse.json({ error: "Error al eliminar el usuario", details: error.message }, { status: 500 });
    }
}
