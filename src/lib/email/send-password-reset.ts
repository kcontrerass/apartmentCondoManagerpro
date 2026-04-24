import nodemailer from 'nodemailer';

/** Marca usada en plantillas y respaldos (sin “Condo Manager”). */
const DEFAULT_BRAND = 'ADESSO-365';

function smtpUser(): string | undefined {
    return process.env.SMTP_USER?.trim() || undefined;
}

function smtpPassword(): string | undefined {
    return process.env.SMTP_PASSWORD?.trim() || undefined;
}

function getSmtpConfigured(): boolean {
    return Boolean(process.env.SMTP_HOST && smtpUser() && smtpPassword());
}

function brevoApiKey(): string | undefined {
    return process.env.BREVO_API_KEY?.trim() || undefined;
}

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Alineado con `globals.css` (@theme) y el layout (auth) de ADESSO-365. */
const BR = {
    primary: '#59BA47',
    primaryDark: '#1a1e1c',
    secondary: '#005780',
    bg: '#F8FAFC',
    bgApp: '#FDFDFD',
    foreground: '#0F172A',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    slate600: '#475569',
    slate500: '#64748B',
    slate400: '#94A3B8',
    font:
        "Inter, 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
} as const;

/**
 * Título de cabecera: como el hero de login (ADESSO + guión verde -365) u otro nombre de complejo.
 */
function brandHeaderTitleHtml(brand: string): string {
    if (brand.trim() === 'ADESSO-365') {
        return `ADESSO<span style="color:${BR.primary}">-</span>365`;
    }
    return escapeHtml(brand);
}

/**
 * Nombre y correo “From” (debe ser un remitente verificado en Brevo).
 */
function getSender(
    brandName: string
): { name: string; email: string } | null {
    const fromLine = process.env.EMAIL_FROM?.trim();
    if (fromLine) {
        const quoted = fromLine.match(/^"([^"]*)"\s*<([^>]+)>\s*$/);
        if (quoted) {
            const name = (quoted[1] || brandName).trim();
            const email = quoted[2].trim();
            if (email.includes('@')) return { name, email };
        }
        const m = fromLine.match(/^(?:([^<]+)\s+)?<([^>]+)>\s*$/);
        if (m) {
            const name = m[1]?.trim() || brandName;
            const email = m[2].trim();
            if (email.includes('@')) return { name, email };
        }
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromLine)) {
            return { name: brandName, email: fromLine };
        }
    }
    const only = process.env.BREVO_SENDER_EMAIL?.trim();
    if (only && only.includes('@')) {
        return { name: brandName, email: only };
    }
    return null;
}

function getBrevoApiConfigured(): boolean {
    return Boolean(brevoApiKey() && getSender(DEFAULT_BRAND));
}

function buildMailParts(brandName: string, resetUrl: string) {
    const safeBrand = escapeHtml(brandName);
    const href = resetUrl.replace(/"/g, '&quot;');

    const subject = `${brandName} — Recupera tu contraseña`;

    const text = [
        `${brandName} — Recuperación de contraseña`,
        '',
        'Recibimos una solicitud para restablecer el acceso a tu cuenta.',
        '',
        'Abre este enlace (válido 1 hora):',
        resetUrl,
        '',
        'Si no lo solicitaste, ignora este mensaje.',
    ].join('\n');

    const isAdessoBrand = brandName.trim() === 'ADESSO-365';
    const brandTitle = brandHeaderTitleHtml(brandName);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!-- Línea gráfica: tokens de apps/globals.css (primary #59BA47, primary-dark, secondary) -->
</head>
<body style="margin:0;padding:0;background-color:${BR.bg};font-family:${BR.font};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;">Solicitud de recuperación de contraseña — ${safeBrand}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BR.bgApp};padding:32px 16px 48px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;border:1px solid ${BR.cardBorder};border-collapse:separate;border-spacing:0;border-radius:16px;overflow:hidden;background-color:${BR.card};box-shadow:0 1px 3px rgba(15,23,42,0.08),0 8px 24px rgba(15,23,42,0.06);">
          <tr>
            <td style="background:linear-gradient(180deg,#0f172a 0%,${BR.primaryDark} 100%);padding:0;text-align:center;">
              <div style="padding:36px 28px 28px;border-bottom:1px solid rgba(255,255,255,0.06);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
                  <td align="center" style="padding-bottom:20px;">
                    <div style="display:inline-block;width:64px;height:64px;border-radius:24px;border:1px solid rgba(255,255,255,0.2);background-color:rgba(255,255,255,0.08);line-height:64px;font-size:32px;text-align:center;vertical-align:middle;" aria-hidden="true">&#127970;</div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 12px;">
                    <h1 style="margin:0;font-size:${isAdessoBrand ? '36px' : '26px'};font-weight:800;letter-spacing:${isAdessoBrand ? '-0.02em' : '-0.01em'};line-height:1.15;color:#ffffff;${isAdessoBrand ? 'text-transform:uppercase;' : ''}">${brandTitle}</h1>
                    <div style="width:48px;height:6px;margin:20px auto 0;border-radius:9999px;background-color:${BR.primary};box-shadow:0 0 0 1px rgba(255,255,255,0.1);"></div>
                    <p style="margin:20px 0 0;font-size:15px;font-weight:500;line-height:1.5;color:#cbd5e1;">Recupera tu acceso al portal</p>
                  </td>
                </tr></table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:${BR.card};padding:32px 28px 8px;border-top:1px solid ${BR.cardBorder};">
              <p style="margin:0 0 18px;font-size:16px;line-height:1.65;font-weight:500;color:${BR.foreground};">Hola,</p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:${BR.slate600};">Recibimos una solicitud para restablecer la contraseña vinculada a <strong style="color:${BR.foreground};font-weight:600;">${safeBrand}</strong>. Usa el botón; el enlace <strong>caduca en 1 hora</strong>.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:${BR.card};padding:0 28px 32px;text-align:center;">
              <a href="${href}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff !important;text-decoration:none;background-color:${BR.primary};border-radius:12px;box-shadow:0 4px 16px rgba(89,186,71,0.35),inset 0 1px 0 rgba(255,255,255,0.2);">Establecer nueva contraseña</a>
            </td>
          </tr>
          <tr>
            <td style="background-color:${BR.bg};border-top:1px solid ${BR.cardBorder};padding:24px 28px 28px;">
              <p style="margin:0 0 12px;font-size:12px;line-height:1.6;color:${BR.slate400};text-align:center;">Si el botón no responde, copia y pega este enlace en tu navegador:</p>
              <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.5;font-weight:500;text-align:center;"><a href="${href}" target="_blank" rel="noopener noreferrer" style="color:${BR.secondary};text-decoration:underline;">${escapeHtml(resetUrl)}</a></p>
            </td>
          </tr>
        </table>
        <p style="margin:24px 0 0;max-width:500px;padding:0 8px;font-size:12px;line-height:1.55;color:${BR.slate500};text-align:center;">No solicitaste este correo. Ignóralo y tu contraseña no cambiará. Aviso automático; no es necesario responder.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return { subject, text, html };
}

async function sendViaBrevoApi(
    to: string,
    sender: { name: string; email: string },
    subject: string,
    text: string,
    html: string
): Promise<{ ok: true } | { ok: false; error: string }> {
    const key = brevoApiKey();
    if (!key) {
        return { ok: false, error: 'BREVO_API_KEY missing' };
    }
    try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'api-key': key,
            },
            body: JSON.stringify({
                sender: { name: sender.name, email: sender.email },
                to: [{ email: to }],
                subject,
                textContent: text,
                htmlContent: html,
            }),
        });
        if (!res.ok) {
            const errBody = (await res.text()).slice(0, 500);
            const message = `Brevo API ${res.status}: ${errBody || res.statusText}`;
            console.error('[Brevo API]', message);
            return { ok: false, error: message };
        }
        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Brevo API request failed';
        console.error('[Brevo API]', e);
        return { ok: false, error: message };
    }
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
    const user = smtpUser();
    const pass = smtpPassword();
    if (!user || !pass) {
        return { ok: false, error: 'SMTP user or password missing' };
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        requireTLS: !secure,
        connectionTimeout: 20_000,
        greetingTimeout: 20_000,
        auth: { user, pass },
    });

    try {
        await transporter.sendMail({ from, to, subject, text, html });
        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'SMTP error';
        console.error('[SMTP] send failed:', message, e);
        return { ok: false, error: message };
    }
}

export type SendPasswordResetResult = { ok: true } | { ok: false; error: string };

const defaultBrandName = () => DEFAULT_BRAND;

/**
 * Recuperar contraseña: primero Brevo API (HTTPS) si `BREVO_API_KEY` está definida, si no SMTP.
 * Vercel y algunas redes bloquean o fallan con SMTP: la API no usa el puerto 587.
 */
export async function sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    brandName: string = defaultBrandName()
): Promise<SendPasswordResetResult> {
    const { subject, text, html } = buildMailParts(brandName, resetUrl);

    const apiSender = getSender(brandName);
    if (brevoApiKey() && apiSender) {
        return sendViaBrevoApi(to, apiSender, subject, text, html);
    }

    if (getSmtpConfigured()) {
        const fromRaw = process.env.EMAIL_FROM?.trim();
        const from = fromRaw || `"${brandName}" <${smtpUser()}>`;
        return sendViaSmtp(to, from, subject, text, html);
    }

    return {
        ok: false,
        error: 'Ningún envío configurado. Pon BREVO_API_KEY (y EMAIL_FROM) o SMTP_HOST + SMTP_USER + SMTP_PASSWORD.',
    };
}

export function canSendPasswordResetEmail(): boolean {
    return getBrevoApiConfigured() || getSmtpConfigured();
}

/** @deprecated use canSendPasswordResetEmail */
export function isSmtpConfigured(): boolean {
    return getSmtpConfigured();
}
