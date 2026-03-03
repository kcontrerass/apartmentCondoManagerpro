import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@/types/roles";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();

        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Only SUPER_ADMIN, ADMIN, or BOARD_OF_DIRECTORS can update complex settings
        const allowedRoles = [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS];
        if (!allowedRoles.includes(session.user.role as Role)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Validate that ADMIN or BOARD belongs to this complex
        if (session.user.role !== Role.SUPER_ADMIN) {
            if (session.user.role === Role.ADMIN) {
                const isOwner = await prisma.complex.findFirst({
                    where: { id, adminId: session.user.id }
                });
                if (!isOwner) return new NextResponse("Forbidden", { status: 403 });
            } else if (session.user.role === Role.BOARD_OF_DIRECTORS) {
                const userObj = await prisma.user.findUnique({ where: { id: session.user.id } });
                if (userObj?.complexId !== id) return new NextResponse("Forbidden", { status: 403 });
            }
        }

        const body = await req.json();
        // Get existing settings to merge with the new ones
        const existingComplex = await prisma.complex.findUnique({
            where: { id },
            select: { settings: true }
        });

        if (!existingComplex) {
            return new NextResponse("Complex not found", { status: 404 });
        }

        const existingSettings: any = existingComplex.settings || {};
        const incomingPermissions = body.settings?.permissions;

        // Hardening: Filter incoming permissions based on session user role hierarchy
        const sanitizedPermissions = { ...(existingSettings.permissions || {}) };

        if (incomingPermissions) {
            if (session.user.role === Role.SUPER_ADMIN) {
                // Super admin can update all roles
                Object.assign(sanitizedPermissions, incomingPermissions);
            } else if (session.user.role === Role.BOARD_OF_DIRECTORS) {
                // Board can update Admin, Resident, Guard
                if (incomingPermissions[Role.ADMIN]) sanitizedPermissions[Role.ADMIN] = incomingPermissions[Role.ADMIN];
                if (incomingPermissions[Role.RESIDENT]) sanitizedPermissions[Role.RESIDENT] = incomingPermissions[Role.RESIDENT];
                if (incomingPermissions[Role.GUARD]) sanitizedPermissions[Role.GUARD] = incomingPermissions[Role.GUARD];
            } else if (session.user.role === Role.ADMIN) {
                // Admin can update Resident and Guard only
                if (incomingPermissions[Role.RESIDENT]) sanitizedPermissions[Role.RESIDENT] = incomingPermissions[Role.RESIDENT];
                if (incomingPermissions[Role.GUARD]) sanitizedPermissions[Role.GUARD] = incomingPermissions[Role.GUARD];
            }
        }

        const updatedComplex = await prisma.complex.update({
            where: { id },
            data: {
                settings: {
                    ...existingSettings,
                    permissions: sanitizedPermissions,
                },
            },
        });

        return NextResponse.json(updatedComplex);
    } catch (error) {
        console.error("[COMPLEX_SETTINGS_UPDATE]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
