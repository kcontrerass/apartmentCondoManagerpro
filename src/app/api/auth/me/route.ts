import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();

    if (!session || !session.user) {
        return new NextResponse(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401 }
        );
    }

    return NextResponse.json(session.user);
}
