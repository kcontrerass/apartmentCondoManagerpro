import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth((req) => {
    return intlMiddleware(req);
});

export const config = {
    // Skip all internal paths (_next, static files, etc.)
    // Except for the ones we want to internationalize
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
