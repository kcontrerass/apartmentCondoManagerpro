import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
import { sendComplexNotification } from "@/lib/notifications";
import { pushDashboardUrl } from "@/lib/push-dashboard-paths";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const complexId = searchParams.get("complexId");

        let where: any = {};

        // Residents, Guards, and Board Members only see their own complex's documents
        const isLimitedUser = ([Role.RESIDENT, Role.GUARD, Role.BOARD_OF_DIRECTORS] as string[]).includes(session.user.role);

        if (isLimitedUser) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    complexId: true,
                    role: true,
                    residentProfile: {
                        select: { unit: { select: { complexId: true } } }
                    }
                }
            });

            const userComplexId = user?.role === Role.RESIDENT
                ? user.residentProfile?.unit.complexId
                : user?.complexId;

            if (!userComplexId) return NextResponse.json([]);
            where.complexId = userComplexId;
        } else if (complexId) {
            where.complexId = complexId;
        } else if (session.user.role !== Role.SUPER_ADMIN) {
            // For Admin/Operator, default to their complex
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true }
            });
            if (user?.complexId) where.complexId = user.complexId;
        }

        const documents = await prisma.document.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                author: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error("[DOCUMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Only Admin, Super Admin, or Board of Directors can upload documents
        if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.BOARD_OF_DIRECTORS) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { title, description, category, fileUrl, fileSize, fileType, complexId } = body;

        if (!title || !fileUrl) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        // Handle case where complexId might be empty (e.g. SUPER_ADMIN viewing all)
        let finalComplexId = complexId;
        if (!finalComplexId) {
            if (session.user.role === Role.SUPER_ADMIN) {
                const firstComplex = await prisma.complex.findFirst();
                if (firstComplex) finalComplexId = firstComplex.id;
            } else {
                // For Admin/Board, get their assigned complex
                const user = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    select: { complexId: true }
                });
                finalComplexId = user?.complexId;
            }

            if (!finalComplexId) {
                return new NextResponse("Missing complexId and no complex found", { status: 400 });
            }
        }

        // RBAC: Verify user has permission for this complex
        if (session.user.role !== Role.SUPER_ADMIN) {
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true }
            });
            if (user?.complexId !== finalComplexId) {
                return new NextResponse("Forbidden - Not your complex", { status: 403 });
            }
        }

        const document = await prisma.document.create({
            data: {
                title,
                description,
                category,
                fileUrl,
                fileSize,
                fileType,
                complexId: finalComplexId,
                authorId: session.user.id,
            }
        });

        await sendComplexNotification(
            finalComplexId,
            ["RESIDENT", "ADMIN"],
            {
                title: "Nuevo documento",
                body: document.title,
                url: pushDashboardUrl.documents,
            }
        );

        return NextResponse.json(document);
    } catch (error) {
        console.error("[DOCUMENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
