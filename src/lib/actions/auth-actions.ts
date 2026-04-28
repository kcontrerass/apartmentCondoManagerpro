'use server';

import { randomBytes } from 'crypto';
import { auth, signIn, signOut } from '@/auth';
import { removeStoredPushSubscription } from '@/lib/notifications';
import { sendPasswordResetEmail, canSendPasswordResetEmail } from '@/lib/email/send-password-reset';
import { getPublicAppUrl } from '@/lib/public-app-url';
import { checkRecaptchaForm } from '@/lib/recaptcha/verify-recaptcha';
import { AuthError } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';
import { routing } from '@/i18n/routing';
import { Role } from '@prisma/client';

const defaultAuthLocale = routing.defaultLocale;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Nombre que aparece en el correo de recuperación: complejo, o ADESSO-365 si es plataforma. */
function brandNameForPasswordEmail(u: {
    role: Role;
    assignedComplex: { name: string } | null;
    managedComplexes: { name: string } | null;
    residentProfile: { unit: { complex: { name: string } } } | null;
}): string {
    if (u.role === Role.SUPER_ADMIN) {
        return 'ADESSO-365';
    }
    return (
        u.assignedComplex?.name ??
        u.managedComplexes?.name ??
        u.residentProfile?.unit?.complex?.name ??
        'ADESSO-365'
    );
}

export type RequestPasswordResetState = { success?: boolean; messageKey?: string } | undefined;

/**
 * Cualquier usuario (incl. SUPER_ADMIN) con email en el sistema. Requiere SMTP y NEXTAUTH_URL en el servidor.
 */
export async function requestPasswordResetAction(
    _prev: RequestPasswordResetState,
    formData: FormData
): Promise<RequestPasswordResetState> {
    if (!canSendPasswordResetEmail()) {
        return { success: false, messageKey: 'smtpNotConfigured' };
    }

    const recaptcha = await checkRecaptchaForm(formData);
    if (!recaptcha.ok) {
        return {
            success: false,
            messageKey:
                recaptcha.code === 'missing' ? 'captchaRequired' : 'captchaFailed',
        };
    }

    const email = String(formData.get('email') ?? '')
        .trim()
        .toLowerCase();
    const loc = String(formData.get('locale') ?? defaultAuthLocale);
    const safeLocale = routing.locales.includes(loc as (typeof routing.locales)[number]) ? loc : defaultAuthLocale;

    if (!email) {
        return { success: false, messageKey: 'missingEmail' };
    }
    if (!EMAIL_RE.test(email)) {
        return { success: false, messageKey: 'emailInvalid' };
    }

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            assignedComplex: { select: { name: true } },
            managedComplexes: { select: { name: true } },
            residentProfile: {
                select: {
                    unit: { select: { complex: { select: { name: true } } } },
                },
            },
        },
    });

    if (!user) {
        return { success: true, messageKey: 'checkEmail' };
    }

    const token = randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: token, resetPasswordExpires },
    });

    const base = getPublicAppUrl();
    const resetUrl = `${base}/${safeLocale}/reset-password?token=${encodeURIComponent(token)}`;
    const brandName = brandNameForPasswordEmail(user);
    const result = await sendPasswordResetEmail(user.email, resetUrl, brandName);

    if (!result.ok) {
        console.error(
            '[password-reset] Envío fallido. Si usas Brevo: BREVO_API_KEY (pestaña Claves API) y remitente en EMAIL_FROM; o SMTP: usuario …@smtp-brevo.com y clave SMTP. Detalle:',
            result.error
        );
        await prisma.user.update({
            where: { id: user.id },
            data: { resetPasswordToken: null, resetPasswordExpires: null },
        });
        return { success: false, messageKey: 'emailSendFailed' };
    }

    return { success: true, messageKey: 'checkEmail' };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function authenticate(prevState: string | undefined, formData: FormData) {
    const recaptcha = await checkRecaptchaForm(formData);
    if (!recaptcha.ok) {
        const t = await getTranslations('Auth');
        return recaptcha.code === 'missing' ? t('captchaRequired') : t('captchaFailed');
    }

    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function register(prevState: string | undefined, formData: FormData) {
    const recaptcha = await checkRecaptchaForm(formData);
    if (!recaptcha.ok) {
        const t = await getTranslations('Auth');
        return recaptcha.code === 'missing' ? t('captchaRequired') : t('captchaFailed');
    }

    const { name, email, password, phone } = Object.fromEntries(formData);

    if (!name || !email || !password) return 'Missing fields.';

    try {
        const hashedPassword = await bcrypt.hash(password as string, 10);

        const initials = name.toString().split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name as string)}&background=random&color=fff&size=128`;

        await prisma.user.create({
            data: {
                name: name as string,
                email: email as string,
                password: hashedPassword,
                phone: phone ? (phone as string) : null,
                image: avatarUrl,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        return 'Failed to register user.';
    }

    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export type AuthState = {
    message?: string;
    success?: boolean;
} | undefined;

export async function resetPasswordAction(prevState: AuthState, formData: FormData): Promise<AuthState> {
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!token || !password || !confirmPassword) {
        return { success: false, message: 'Missing fields.' };
    }

    if (password !== confirmPassword) {
        return { success: false, message: 'Passwords do not match.' };
    }

    if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters.' };
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { gt: new Date() },
            },
        });

        if (!user) {
            return { success: false, message: 'Invalid or expired token.' };
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });

        return { success: true, message: 'Password reset successfully. You can now login.' };
    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, message: 'Something went wrong.' };
    }
}

export async function signOutAction() {
    const session = await auth();
    if (session?.user?.id) {
        await removeStoredPushSubscription(session.user.id);
    }
    await signOut({ redirectTo: `/${defaultAuthLocale}/login` });
}
