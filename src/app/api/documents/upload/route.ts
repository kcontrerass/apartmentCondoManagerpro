import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@/types/roles";
import { isS3Configured, uploadFileToS3 } from "@/lib/s3";

const ALLOWED_TYPES = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);

const MAX_SIZE_BYTES = 50 * 1024 * 1024; // Increased to 50 MB for documents

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (
            session.user.role !== Role.ADMIN &&
            session.user.role !== Role.SUPER_ADMIN &&
            session.user.role !== Role.BOARD_OF_DIRECTORS
        ) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        if (!isS3Configured) {
            return NextResponse.json(
                {
                    error: "AWS S3 no está configurado. Revisa las variables de entorno AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION y AWS_S3_BUCKET.",
                },
                { status: 500 }
            );
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
        }

        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: "El archivo supera el límite de 50 MB" }, { status: 400 });
        }

        if (!ALLOWED_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: "Tipo de archivo no permitido. Solo se aceptan PDF e imágenes." },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await uploadFileToS3({
            buffer,
            folder: "documents",
            originalFilename: file.name,
            mimeType: file.type,
        });

        return NextResponse.json({
            fileUrl: uploaded.fileUrl,
            fileSize: file.size,
            fileType: file.type,
            s3Key: uploaded.key,
            s3Bucket: uploaded.bucket,
        });
    } catch (error) {
        console.error("[DOCUMENTS_UPLOAD]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
