import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@/types/roles";
import bcrypt from "bcrypt";
import { residentAdminResetBodySchema } from "@/lib/validations/resident-password-reset";
import { generateTemporaryPassword } from "@/lib/auth/temporary-password";

async function assertCanManageResident(
    sessionUserId: string,
    sessionRole: Role,
    resident: { unit: { complexId: string; complex: { adminId: string | null } } }
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
    if (sessionRole === Role.SUPER_ADMIN) {
        return { ok: true };
    }

    if (sessionRole === Role.ADMIN) {
        if (resident.unit.complex.adminId !== sessionUserId) {
            return {
                ok: false,
                status: 403,
                error: "No tienes permisos para gestionar residentes en este complejo",
            };
        }
        return { ok: true };
    }

    if (sessionRole === Role.BOARD_OF_DIRECTORS) {
        const user = await prisma.user.findUnique({
            where: { id: sessionUserId },
            select: { complexId: true },
        });
        if (user?.complexId !== resident.unit.complexId) {
            return {
                ok: false,
                status: 403,
                error: "No tienes permisos para gestionar residentes en este complejo",
            };
        }
        return { ok: true };
    }

    return { ok: false, status: 403, error: "Permisos insuficientes" };
}

/**
 * Admin sets password for the resident's user: `mode: "generate"` returns a one-time plain password;
 * `mode: "manual"` uses the provided password (not returned).
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: residentId } = await params;
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const role = session.user.role as Role;
        if (role !== Role.SUPER_ADMIN && role !== Role.ADMIN && role !== Role.BOARD_OF_DIRECTORS) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        const resident = await prisma.resident.findUnique({
            where: { id: residentId },
            include: {
                unit: {
                    include: { complex: true },
                },
            },
        });

        if (!resident) {
            return NextResponse.json({ error: "Residente no encontrado" }, { status: 404 });
        }

        const allowed = await assertCanManageResident(session.user.id, role, resident);
        if (!allowed.ok) {
            return NextResponse.json({ error: allowed.error }, { status: allowed.status });
        }

        const body = await request.json();
        const parsed = residentAdminResetBodySchema.safeParse(body);
        if (!parsed.success) {
            const first = parsed.error.flatten();
            return NextResponse.json(
                { error: "Datos inválidos", details: first.fieldErrors },
                { status: 400 }
            );
        }

        const plain =
            parsed.data.mode === "generate"
                ? generateTemporaryPassword(12)
                : parsed.data.newPassword;

        const hashed = await bcrypt.hash(plain, 10);

        await prisma.user.update({
            where: { id: resident.userId },
            data: {
                password: hashed,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });

        if (parsed.data.mode === "generate") {
            return NextResponse.json({
                success: true,
                temporaryPassword: plain,
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[residents/reset-password]", error);
        return NextResponse.json({ error: "Error al actualizar la contraseña" }, { status: 500 });
    }
}
