import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
import {
    LEGACY_SUPER_ADMIN_SCOPE_COOKIE,
    SUPER_ADMIN_BILLING_SCOPE_COOKIE,
} from "@/lib/super-admin-scope";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
            return NextResponse.json({ error: "Solo el súper administrador puede definir el alcance de cobros" }, { status: 403 });
        }

        const body = (await request.json().catch(() => ({}))) as { complexId?: string | null };
        const raw = body.complexId;
        const cookieStore = await cookies();

        if (raw === null || raw === undefined || raw === "") {
            cookieStore.delete(SUPER_ADMIN_BILLING_SCOPE_COOKIE);
            cookieStore.delete(LEGACY_SUPER_ADMIN_SCOPE_COOKIE);
            return NextResponse.json({ ok: true, complexId: null });
        }

        const id = String(raw).trim();
        const exists = await prisma.complex.findUnique({ where: { id }, select: { id: true } });
        if (!exists) {
            return NextResponse.json({ error: "Complejo no encontrado" }, { status: 404 });
        }

        cookieStore.delete(LEGACY_SUPER_ADMIN_SCOPE_COOKIE);
        cookieStore.set(SUPER_ADMIN_BILLING_SCOPE_COOKIE, id, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
        });

        return NextResponse.json({ ok: true, complexId: id });
    } catch (e) {
        console.error("[super-admin-scope]", e);
        return NextResponse.json({ error: "Error al guardar el alcance" }, { status: 500 });
    }
}
