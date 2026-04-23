/**
 * Decodifica la clave pública VAPID (URL-safe base64, sin PEM) para `PushManager.subscribe`.
 * Las claves válidas suelen decodificar a 65 bytes (P-256 sin comprimir) o 33 (comprimidas).
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const trimmed = base64String
        .trim()
        .replace(/^\uFEFF/, "")
        .replace(/^["']|["']$/g, "");

    if (!trimmed) {
        throw new Error("VAPID_PUBLIC_KEY_EMPTY");
    }

    const padding = "=".repeat((4 - (trimmed.length % 4)) % 4);
    const base64 = (trimmed + padding).replace(/-/g, "+").replace(/_/g, "/");

    let rawData: string;
    try {
        rawData = atob(base64);
    } catch {
        throw new Error("VAPID_PUBLIC_KEY_BASE64_INVALID");
    }

    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function assertValidVapidApplicationServerKey(bytes: Uint8Array): void {
    if (bytes.length !== 65 && bytes.length !== 33) {
        throw new Error("VAPID_PUBLIC_KEY_WRONG_LENGTH");
    }
}
