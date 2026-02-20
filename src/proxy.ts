import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;

    const isOnDashboard = nextUrl.pathname.includes('/dashboard');

    if (isOnDashboard && !isLoggedIn) {
        // Build the sign-in URL. By default NextAuth would use /login, 
        // but we want to make it locale-aware if possible.
        let signInUrl = '/login';
        const segments = nextUrl.pathname.split('/');
        if (segments.length > 1 && ['en', 'es'].includes(segments[1])) {
            signInUrl = `/${segments[1]}/login`;
        }

        return Response.redirect(new URL(signInUrl, nextUrl));
    }

    return intlMiddleware(req);
});

export const config = {
    // Skip all internal paths (_next, static files, etc.)
    // Except for the ones we want to internationalize
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads).*)'],
};
