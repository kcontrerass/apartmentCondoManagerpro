import { S3Client, PutObjectCommand, DeleteObjectCommand, ObjectCannedACL } from "@aws-sdk/client-s3";

function readEnv(name: string): string | undefined {
    const value = process.env[name];
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

const accessKeyId = readEnv("AWS_ACCESS_KEY_ID");
const secretAccessKey = readEnv("AWS_SECRET_ACCESS_KEY");
const region = readEnv("AWS_REGION") || "us-east-2";
const bucketName = readEnv("AWS_S3_BUCKET") || "ocr-facturas";

export const isS3Configured = Boolean(accessKeyId && secretAccessKey);

const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || "",
    },
});

type UploadInput = {
    buffer: Buffer;
    folder: string;
    originalFilename: string;
    mimeType: string;
};

export async function uploadFileToS3({
    buffer,
    folder,
    originalFilename,
    mimeType,
}: UploadInput) {
    if (!isS3Configured) {
        throw new Error("S3 is not configured. Please check your environment variables.");
    }

    const timestamp = Date.now();
    
    // Extraer extensión del nombre original si existe, sino usar el mimeType
    const extIndex = originalFilename.lastIndexOf('.');
    let ext = extIndex !== -1 ? originalFilename.substring(extIndex + 1).toLowerCase() : '';
    let baseName = extIndex !== -1 ? originalFilename.substring(0, extIndex) : originalFilename;
    
    // Si no tiene extensión, usar mimeType (ej: "image/jpeg" -> "jpeg", "application/pdf" -> "pdf")
    if (!ext && mimeType) {
        ext = mimeType.split('/')[1] || 'bin';
    }

    // Limpiar el nombre base
    const sanitizedBase = baseName.replace(/[^a-zA-Z0-9-]/g, "-").replace(/-+/g, "-").toLowerCase();
    
    // Crear el key asegurando que la extensión esté presente
    const key = `${folder}/${timestamp}-${sanitizedBase}.${ext}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        // We use public-read as requested for non-expiring URLs.
        // This requires the bucket to allow ACLs and public access.
        ACL: "public-read" as ObjectCannedACL,
    });

    await s3Client.send(command);

    // Construct the public URL
    const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    return {
        fileUrl,
        key,
        bucket: bucketName,
        region,
    };
}

export async function deleteS3Object(key: string) {
    if (!isS3Configured) return;

    const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
    });

    try {
        await s3Client.send(command);
    } catch (error) {
        console.error("Error deleting S3 object:", error);
    }
}

/**
 * Extracts the S3 Key from a full S3 URL.
 * Assumes format: https://bucket.s3.region.amazonaws.com/key
 */
export function extractKeyFromS3Url(fileUrl: string): string | null {
    try {
        const url = new URL(fileUrl);
        // Pathname starts with / and then the key
        return decodeURIComponent(url.pathname.substring(1));
    } catch {
        return null;
    }
}
