import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";

const MIME_TO_EXTENSION: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
};

function sanitizeFileName(value: string): string {
    const normalized = value
        .normalize("NFKD")
        .replace(/[^\x00-\x7F]/g, "")
        .replace(/[^a-zA-Z0-9._-]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");

    if (!normalized) return "documento";
    return normalized.slice(0, 120);
}

function getExtensionFromMimeType(mimeType?: string | null): string | null {
    if (!mimeType) return null;
    const normalized = mimeType.split(";")[0]?.trim().toLowerCase();
    if (!normalized) return null;
    return MIME_TO_EXTENSION[normalized] ?? null;
}

function getExtensionFromUrl(fileUrl: string): string | null {
    try {
        const url = new URL(fileUrl);
        const pathname = url.pathname;
        const lastSegment = pathname.split("/").filter(Boolean).pop();
        if (!lastSegment) return null;

        const dotIndex = lastSegment.lastIndexOf(".");
        if (dotIndex <= 0) return null;

        const extension = lastSegment.slice(dotIndex).toLowerCase();
        if (!/^\.[a-z0-9]{1,8}$/i.test(extension)) return null;
        return extension;
    } catch {
        return null;
    }
}

function ensureExtension(fileName: string, extension?: string | null): string {
    if (!extension) return fileName;
    if (fileName.toLowerCase().endsWith(extension.toLowerCase())) {
        return fileName;
    }
    return `${fileName}${extension}`;
}

function buildDownloadFileName(params: {
    title: string;
    dbFileType?: string | null;
    responseContentType?: string | null;
    fileUrl: string;
}): string {
    const baseName = sanitizeFileName(params.title || "documento");
    const extension =
        getExtensionFromMimeType(params.dbFileType) ??
        getExtensionFromMimeType(params.responseContentType) ??
        getExtensionFromUrl(params.fileUrl) ??
        ".bin";

    return ensureExtension(baseName, extension);
}

function toDownloadSourceUrl(fileUrl: string, requestUrl: string): string {
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    if (fileUrl.startsWith("/")) {
        return new URL(fileUrl, requestUrl).toString();
    }
    return new URL(`/${fileUrl}`, requestUrl).toString();
}

async function canAccessDocument(userId: string, userRole: string, documentComplexId: string): Promise<boolean> {
    if (userRole === Role.SUPER_ADMIN) return true;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            role: true,
            complexId: true,
            residentProfile: {
                select: {
                    unit: {
                        select: { complexId: true },
                    },
                },
            },
        },
    });

    if (!user) return false;

    const userComplexId =
        user.role === Role.RESIDENT
            ? user.residentProfile?.unit.complexId
            : user.complexId;

    return userComplexId === documentComplexId;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const requestUrl = new URL(request.url);
        const dispositionParam = requestUrl.searchParams.get("disposition");
        const dispositionType = dispositionParam === "inline" ? "inline" : "attachment";

        const document = await prisma.document.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                fileUrl: true,
                fileType: true,
                complexId: true,
            },
        });

        if (!document) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const hasAccess = await canAccessDocument(
            session.user.id,
            session.user.role,
            document.complexId
        );

        if (!hasAccess) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const sourceUrl = toDownloadSourceUrl(document.fileUrl, request.url);
        const upstream = await fetch(sourceUrl, { cache: "no-store" });

        if (!upstream.ok) {
            console.error("[DOCUMENT_DOWNLOAD_FETCH_ERROR]", {
                id: document.id,
                sourceUrl,
                status: upstream.status,
            });
            return NextResponse.json(
                { error: "No fue posible descargar el archivo" },
                { status: 502 }
            );
        }

        const responseContentType = upstream.headers.get("content-type");
        const contentType =
            responseContentType ??
            document.fileType ??
            "application/octet-stream";

        const fileName = buildDownloadFileName({
            title: document.title,
            dbFileType: document.fileType,
            responseContentType,
            fileUrl: sourceUrl,
        });

        const body = await upstream.arrayBuffer();
        const contentLength = String(body.byteLength);
        const fallbackFileName = fileName.replace(/"/g, "");
        const encodedFileName = encodeURIComponent(fileName);

        return new NextResponse(body, {
            status: 200,
            headers: {
                "Content-Type": contentType,
                "Content-Length": contentLength,
                "Content-Disposition": `${dispositionType}; filename="${fallbackFileName}"; filename*=UTF-8''${encodedFileName}`,
                "Cache-Control": "private, no-store, max-age=0",
            },
        });
    } catch (error) {
        console.error("[DOCUMENT_DOWNLOAD]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
