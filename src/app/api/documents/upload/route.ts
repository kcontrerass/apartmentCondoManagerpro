import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Role } from "@/types/roles";
import { isCloudinaryConfigured, uploadFileToCloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

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

        if (!isCloudinaryConfigured) {
            return NextResponse.json(
                {
                    error: "Cloudinary no está configurado. Define CLOUDINARY_URL o CLOUDINARY_CLOUD_NAME/NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY/NEXT_PUBLIC_CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET.",
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
            return NextResponse.json({ error: "El archivo supera el límite de 10 MB" }, { status: 400 });
        }

        if (!ALLOWED_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: "Tipo de archivo no permitido. Solo se aceptan PDF e imágenes." },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await uploadFileToCloudinary({
            buffer,
            folder: "adesso-365/documents",
            originalFilename: file.name,
            mimeType: file.type,
        });

        return NextResponse.json({
            fileUrl: uploaded.secure_url,
            fileSize: file.size,
            fileType: file.type,
            cloudinaryPublicId: uploaded.public_id,
            cloudinaryResourceType: uploaded.resource_type,
        });
    } catch (error) {
        console.error("[DOCUMENTS_UPLOAD]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
