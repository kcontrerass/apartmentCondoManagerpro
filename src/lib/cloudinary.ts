import { UploadApiErrorResponse, UploadApiOptions, UploadApiResponse, v2 as cloudinary } from "cloudinary";

function readEnv(name: string): string | undefined {
    const value = process.env[name];
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function parseCloudinaryUrl(cloudinaryUrl?: string): {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
} | null {
    if (!cloudinaryUrl) return null;

    try {
        const parsed = new URL(cloudinaryUrl);
        if (parsed.protocol !== "cloudinary:") return null;

        const cloudName = parsed.hostname?.trim();
        const apiKey = decodeURIComponent(parsed.username || "").trim();
        const apiSecret = decodeURIComponent(parsed.password || "").trim();

        if (!cloudName || !apiKey || !apiSecret) return null;

        return { cloudName, apiKey, apiSecret };
    } catch {
        return null;
    }
}

const fromUrl = parseCloudinaryUrl(readEnv("CLOUDINARY_URL"));
const cloudName =
    fromUrl?.cloudName ??
    readEnv("CLOUDINARY_CLOUD_NAME") ??
    readEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
const apiKey =
    fromUrl?.apiKey ??
    readEnv("CLOUDINARY_API_KEY") ??
    readEnv("NEXT_PUBLIC_CLOUDINARY_API_KEY");
const apiSecret = fromUrl?.apiSecret ?? readEnv("CLOUDINARY_API_SECRET");

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });
}

type SupportedResourceType = "image" | "video" | "raw";

type UploadInput = {
    buffer: Buffer;
    folder: string;
    originalFilename: string;
    mimeType: string;
};

function toCloudinaryResourceType(mimeType: string): SupportedResourceType {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    return "raw";
}

export async function uploadFileToCloudinary({
    buffer,
    folder,
    originalFilename,
    mimeType,
}: UploadInput): Promise<UploadApiResponse> {
    const resourceType = toCloudinaryResourceType(mimeType);
    const baseName = originalFilename.replace(/\.[^/.]+$/, "");

    const options: UploadApiOptions = {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: baseName,
    };

    return await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                if (error || !result) {
                    reject(error ?? new Error("Cloudinary upload failed"));
                    return;
                }
                resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
}

function extractPublicIdFromCloudinaryUrl(fileUrl: string): {
    publicIdWithoutExtension: string;
    publicIdWithExtension: string;
    resourceType: SupportedResourceType;
} | null {
    try {
        const url = new URL(fileUrl);
        if (url.hostname !== "res.cloudinary.com") {
            return null;
        }

        const parts = url.pathname.split("/").filter(Boolean);
        const uploadIndex = parts.indexOf("upload");
        if (uploadIndex === -1 || uploadIndex < 1 || uploadIndex + 1 >= parts.length) {
            return null;
        }

        const resourceType = parts[uploadIndex - 1];
        if (resourceType !== "image" && resourceType !== "video" && resourceType !== "raw") {
            return null;
        }

        const afterUpload = parts.slice(uploadIndex + 1);
        if (afterUpload[0] && /^v\d+$/.test(afterUpload[0])) {
            afterUpload.shift();
        }

        if (afterUpload.length === 0) {
            return null;
        }

        const publicIdWithExtension = afterUpload.join("/");
        const publicIdWithoutExtension = publicIdWithExtension.replace(/\.[^/.]+$/, "");

        return {
            publicIdWithoutExtension,
            publicIdWithExtension,
            resourceType,
        };
    } catch {
        return null;
    }
}

export async function deleteCloudinaryAssetByUrl(fileUrl: string): Promise<void> {
    if (!isCloudinaryConfigured) return;

    const parsed = extractPublicIdFromCloudinaryUrl(fileUrl);
    if (!parsed) return;

    const candidates: Array<{ publicId: string; resourceType: SupportedResourceType }> = [
        { publicId: parsed.publicIdWithoutExtension, resourceType: parsed.resourceType },
        { publicId: parsed.publicIdWithoutExtension, resourceType: "raw" },
        { publicId: parsed.publicIdWithExtension, resourceType: "raw" },
    ];

    const seen = new Set<string>();
    for (const candidate of candidates) {
        const key = `${candidate.resourceType}:${candidate.publicId}`;
        if (seen.has(key)) continue;
        seen.add(key);

        try {
            const result = await cloudinary.uploader.destroy(candidate.publicId, {
                resource_type: candidate.resourceType,
                invalidate: true,
            });

            if (result?.result === "ok") {
                return;
            }
        } catch {
            // Best effort cleanup; continue with other candidates.
        }
    }
}

