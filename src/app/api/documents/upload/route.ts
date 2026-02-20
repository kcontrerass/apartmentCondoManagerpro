import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@/types/roles";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
        }

        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: "El archivo supera el límite de 10 MB" }, { status: 400 });
        }

        const ext = ALLOWED_TYPES[file.type];
        if (!ext) {
            return NextResponse.json(
                { error: "Tipo de archivo no permitido. Solo se aceptan PDF e imágenes." },
                { status: 400 }
            );
        }

        const fileName = `${randomUUID()}.${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
        const filePath = path.join(uploadDir, fileName);

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/documents/${fileName}`;

        return NextResponse.json({
            fileUrl,
            fileSize: file.size,
            fileType: file.type,
        });
    } catch (error) {
        console.error("[DOCUMENTS_UPLOAD]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
