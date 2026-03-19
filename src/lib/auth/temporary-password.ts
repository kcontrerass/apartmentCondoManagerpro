import { randomBytes } from "crypto";

/** Readable temp password for admin to share (avoids confusing 0/O, 1/l). */
const CHARSET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateTemporaryPassword(length = 12): string {
    const bytes = randomBytes(length);
    let out = "";
    for (let i = 0; i < length; i++) {
        out += CHARSET[bytes[i] % CHARSET.length];
    }
    return out;
}
