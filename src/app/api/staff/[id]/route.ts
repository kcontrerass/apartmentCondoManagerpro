import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Role } from "@prisma/client";
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

        // Fetch user to update
        const userToUpdate = await prisma.user.findUnique({
            where: { id }
        });

        if (!userToUpdate) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Check Permissions
        if (session.user.role === Role.ADMIN) {
            // Only update staff in their managed complex
            // Check if userToUpdate belongs to the same complex
            const adminComplex = await prisma.complex.findFirst({
                where: { adminId: session.user.id }
            });

            if (!adminComplex || userToUpdate.complexId !== adminComplex.id) {
                return NextResponse.json({ error: "No tienes permiso sobre este usuario" }, { status: 403 });
            }

            // Prevent Admin from modifying Super Admins or other Admins (maybe?)
            if (userToUpdate.role === Role.SUPER_ADMIN || userToUpdate.role === Role.ADMIN) {
                // Usually admin shouldn't edit other admins unless logic allows
                // Let's restrict for safety: Admin can only edit GUARD/OPERATOR
                // Exception: Maybe they can edit themselves? 
                if (userToUpdate.id !== session.user.id) {
                    return NextResponse.json({ error: "No puedes modificar a otros administradores" }, { status: 403 });
                }
            }
        }

        const updateData: any = { ...validatedData };
        if (validatedData.password) {
            updateData.password = await bcrypt.hash(validatedData.password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        const { password: _, ...userWithoutPassword } = updatedUser;
        return NextResponse.json(userWithoutPassword);

    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error updating staff:", error);
        return NextResponse.json({ error: "Error al actualizar el usuario" }, { status: 500 });
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

        // Fetch user
        const userToDelete = await prisma.user.findUnique({
            where: { id }
        });

        if (!userToDelete) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // RBAC Checks for Delete (same as Update)
        if (session.user.role === Role.ADMIN) {
            const adminComplex = await prisma.complex.findFirst({
                where: { adminId: session.user.id }
            });

            if (!adminComplex || userToDelete.complexId !== adminComplex.id) {
                return NextResponse.json({ error: "No tienes permiso sobre este usuario" }, { status: 403 });
            }

            if (userToDelete.role === Role.SUPER_ADMIN || userToDelete.role === Role.ADMIN) {
                return NextResponse.json({ error: "No puedes eliminar administradores" }, { status: 403 });
            }
        }

        // Soft delete? Or hard delete?
        // Usually safer to mark as INACTIVE or SUSPENDED if historical data exists (like VisitorLogs)
        // Let's use hard delete for now, but handle constraint errors? 
        // Or actually, schema has UserStatus. Let's just update status to SUSPENDED/INACTIVE?
        // But user asked for delete. Let's try Delete, if it fails due to relations, suggest deactivate.
        // Actually for Staff management, "Delete" usually implies removal. 
        // BUT if they created logs, we might have issues. 
        // Schema: visitorLogs createdBy User. No onDelete: Cascade (usually default restrict). 
        // Let's try DELETE. If it fails, return 409.

        try {
            await prisma.user.delete({
                where: { id }
            });
        } catch (dbError: any) {
            // Check for foreign key constraint
            if (dbError.code === 'P2003') {
                // Foreign key constraint failed
                return NextResponse.json({
                    error: "No se puede eliminar el usuario porque tiene registros asociados. Intenta desactivarlo en su lugar."
                }, { status: 409 });
            }
            throw dbError;
        }

        return NextResponse.json({ message: "Usuario eliminado correctamente" });

    } catch (error: any) {
        console.error("Error deleting staff:", error);
        return NextResponse.json({ error: "Error al eliminar el usuario" }, { status: 500 });
    }
}
