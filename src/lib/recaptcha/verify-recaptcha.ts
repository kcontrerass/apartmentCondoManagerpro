import 'server-only';

import { headers } from 'next/headers';

const SITE_VERIFY = 'https://www.google.com/recaptcha/api/siteverify';

export function isRecaptchaConfigured(): boolean {
    return Boolean(
        process.env.RECAPTCHA_SECRET_KEY?.trim() &&
            process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim()
    );
}

export async function getRecaptchaRemoteIp(): Promise<string | undefined> {
    const h = await headers();
    const xff = h.get('x-forwarded-for');
    if (xff) {
        const first = xff.split(',')[0]?.trim();
        if (first) return first;
    }
    const realIp = h.get('x-real-ip')?.trim();
    if (realIp) return realIp;
    return undefined;
}

export async function verifyRecaptchaToken(
    token: string,
    remoteip?: string
): Promise<boolean> {
    const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
    if (!secret) return true;

    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', token);
    if (remoteip) body.set('remoteip', remoteip);

    try {
        const res = await fetch(SITE_VERIFY, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body,
        });
        const data = (await res.json()) as { success?: boolean };
        return data.success === true;
    } catch (e) {
        console.error('[reCAPTCHA] siteverify failed:', e);
        return false;
    }
}

export type RecaptchaFormResult =
    | { ok: true }
    | { ok: false; code: 'missing' | 'invalid' };

export async function checkRecaptchaForm(formData: FormData): Promise<RecaptchaFormResult> {
    if (!isRecaptchaConfigured()) return { ok: true };

    const token = String(formData.get('recaptchaToken') ?? '').trim();
    if (!token) return { ok: false, code: 'missing' };

    const ip = await getRecaptchaRemoteIp();
    const valid = await verifyRecaptchaToken(token, ip);
    if (!valid) return { ok: false, code: 'invalid' };

    return { ok: true };
}
