import nodemailer from 'nodemailer';

function getSmtpConfigured(): boolean {
    return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function buildMailParts(appName: string, resetUrl: string) {
    const subject = `${appName} — Reset your password`;
    const text = [
        `You requested to reset your password for ${appName}.`,
        '',
        `Open this link (valid for 1 hour):`,
        resetUrl,
        '',
        `If you did not request this, you can ignore this email.`,
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #334155;">
  <p>You requested to reset your password for <strong>${appName}</strong>.</p>
  <p><a href="${resetUrl.replace(/"/g, '&quot;')}" style="color: #2563eb;">Reset your password</a></p>
  <p style="font-size: 12px; color: #94a3b8;">This link expires in 1 hour. If you did not request this, ignore this email.</p>
</body>
</html>`.trim();

    return { subject, text, html };
}

async function sendViaSmtp(
    to: string,
    from: string,
    subject: string,
    text: string,
    html: string
): Promise<{ ok: true } | { ok: false; error: string }> {
    const port = Number(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    try {
        await transporter.sendMail({ from, to, subject, text, html });
        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'SMTP error';
        console.error('[SMTP]', e);
        return { ok: false, error: message };
    }
}

export type SendPasswordResetResult = { ok: true } | { ok: false; error: string };

/**
 * Sends password reset via SMTP (nodemailer). Configure SMTP_* and optionally EMAIL_FROM.
 */
export async function sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    appName = 'Condo Manager'
): Promise<SendPasswordResetResult> {
    const { subject, text, html } = buildMailParts(appName, resetUrl);

    if (getSmtpConfigured()) {
        const from = process.env.EMAIL_FROM || `"${appName}" <${process.env.SMTP_USER}>`;
        return sendViaSmtp(to, from, subject, text, html);
    }

    return {
        ok: false,
        error: 'No email provider configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.',
    };
}

export function canSendPasswordResetEmail(): boolean {
    return getSmtpConfigured();
}

/** @deprecated use canSendPasswordResetEmail */
export function isSmtpConfigured(): boolean {
    return getSmtpConfigured();
}
