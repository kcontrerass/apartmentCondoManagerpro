import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";

const patchBodySchema = z.object({
    name: z.string().min(1),
    phone: z.union([z.string(), z.null()]).optional(),
    email: z.string().email().optional(),
});

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                complexId: true,
                createdAt: true,
                managedComplexes: {
                    select: { id: true, name: true }
                },
                residentProfile: {
                    include: {
                        unit: {
                            include: {
                                complex: {
                                    select: { id: true, name: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[PROFILE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await req.json();
        const parsed = patchBodySchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
        }

        const { name, phone, email } = parsed.data;

        const data: { name: string; phone?: string | null; email?: string } = { name };
        if (phone !== undefined) {
            data.phone = phone;
        }

        if (email !== undefined) {
            if (session.user.role !== Role.SUPER_ADMIN) {
                return NextResponse.json(
                    { error: "Solo el súper administrador puede cambiar su correo aquí" },
                    { status: 403 }
                );
            }
            const normalized = email.trim().toLowerCase();
            const taken = await prisma.user.findFirst({
                where: { email: normalized, id: { not: session.user.id } },
                select: { id: true },
            });
            if (taken) {
                return NextResponse.json(
                    { error: "Este correo ya está en uso por otra cuenta" },
                    { status: 409 }
                );
            }
            data.email = normalized;
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data,
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[PROFILE_PATCH]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
