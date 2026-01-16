import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
        newUser: '/register',
        error: '/login', // Error code passed in url query string
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const pathname = nextUrl.pathname;

            // Regex to match /dashboard or /es/dashboard, /en/dashboard
            const isOnDashboard = pathname.startsWith('/dashboard') ||
                /^\/(es|en)\/dashboard/.test(pathname);

            // Regex to match /login, /register or /es/login, /en/register etc
            const isOnAuth = pathname.startsWith('/login') ||
                pathname.startsWith('/register') ||
                /^\/(es|en)\/(login|register)/.test(pathname);

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && isOnAuth) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
        jwt({ token, user }) {
            if (user) { // User is available during sign-in
                token.role = (user.role as string) || 'RESIDENT';
                token.id = user.id as string;
            }
            return token;
        },
        session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
