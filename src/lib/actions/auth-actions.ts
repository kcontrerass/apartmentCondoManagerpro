'use server';

import { auth, signIn, signOut } from '@/auth';
import { removeStoredPushSubscription } from '@/lib/notifications';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';
import { routing } from '@/i18n/routing';

const defaultAuthLocale = routing.defaultLocale;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function authenticate(prevState: string | undefined, formData: FormData) {
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

        const hashedPassword = await bcrypt.hash(password, 10);

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
