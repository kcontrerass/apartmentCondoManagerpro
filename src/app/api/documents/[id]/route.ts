import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { title, description, category } = body;

        const document = await prisma.document.findUnique({
            where: { id }
        });

        if (!document) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Permission check: Only author, Super Admin, or Complex Admin can edit
        const isAuthor = document.authorId === session.user.id;
        const isSuperAdmin = session.user.role === Role.SUPER_ADMIN;
        const isAdmin = session.user.role === Role.ADMIN && document.complexId === session.user.complexId;

        if (!isAuthor && !isSuperAdmin && !isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updatedDocument = await prisma.document.update({
            where: { id },
            data: {
                title,
                description,
                category,
            }
        });

        return NextResponse.json(updatedDocument);
    } catch (error) {
        console.error("[DOCUMENT_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const document = await prisma.document.findUnique({
            where: { id }
        });

        if (!document) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Permission check: Only author, Super Admin, or Complex Admin can delete
        const isAuthor = document.authorId === session.user.id;
        const isSuperAdmin = session.user.role === Role.SUPER_ADMIN;
        const isAdmin = session.user.role === Role.ADMIN && document.complexId === session.user.complexId;

        if (!isAuthor && !isSuperAdmin && !isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.document.delete({
            where: { id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[DOCUMENT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
