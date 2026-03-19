import type { NextAuthConfig } from 'next-auth';
import { routing } from '@/i18n/routing';

const defaultLocale = routing.defaultLocale;

function localeFromPathname(pathname: string): string {
    const seg = pathname.split('/').filter(Boolean)[0];
    return routing.locales.includes(seg as (typeof routing.locales)[number]) ? seg : defaultLocale;
}

export const authConfig = {
    pages: {
        signIn: `/${defaultLocale}/login`,
        newUser: `/${defaultLocale}/register`,
        error: `/${defaultLocale}/login`,
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const pathname = nextUrl.pathname;

            // Match /dashboard or /locale/dashboard and all subpaths
            const isOnDashboard = pathname.includes('/dashboard');

            // Match /login, /register, etc. and their translated versions
            const isOnAuth =
                pathname.includes('/login') ||
                pathname.includes('/register') ||
                pathname.includes('/forgot-password') ||
                pathname.includes('/reset-password');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && isOnAuth) {
                const locale = localeFromPathname(pathname);
                return Response.redirect(new URL(`/${locale}/dashboard`, nextUrl));
            }
            return true;
        },
        jwt({ token, user, trigger, session: sessionData }) {
            if (user) { // User is available during sign-in
                token.role = (user.role as string) || 'RESIDENT';
                token.id = user.id as string;
                token.complexId = (user as any).complexId;
                token.name = user.name;
            }
            // Handle client-side session.update() calls (e.g. after profile update)
            if (trigger === 'update' && sessionData?.name) {
                token.name = sessionData.name;
            }
            return token;
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
                (session.user as any).complexId = token.complexId as string;
            }
            return session;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
