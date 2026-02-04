import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name } = body;

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[PROFILE_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
