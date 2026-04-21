import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import { isApiPathExemptFromPlatformSubscription } from "./lib/platform-subscription-rules";

const intlMiddleware = createMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
    const { nextUrl } = req;
    const pathname = nextUrl.pathname;

    if (pathname.startsWith("/api/")) {
        if (isApiPathExemptFromPlatformSubscription(pathname)) {
            return NextResponse.next();
        }
        const cookie = req.headers.get("cookie");
        if (!cookie) {
            return NextResponse.next();
        }
        const checkUrl = new URL("/api/platform-fee/access-for-session", nextUrl.origin);
        const res = await fetch(checkUrl, {
            headers: { cookie },
            cache: "no-store",
        });
        if (res.status === 403) {
            const body = await res.text();
            return new NextResponse(body, {
                status: 403,
                headers: {
                    "content-type": res.headers.get("content-type") || "application/json",
                },
            });
        }
        return NextResponse.next();
    }

    const isLoggedIn = !!req.auth;

    const isOnDashboard = pathname.includes("/dashboard");

    if (isOnDashboard && !isLoggedIn) {
        let signInUrl = "/login";
        const segments = pathname.split("/");
        if (segments.length > 1 && ["en", "es"].includes(segments[1])) {
            signInUrl = `/${segments[1]}/login`;
        }

        return Response.redirect(new URL(signInUrl, nextUrl));
    }

    return intlMiddleware(req);
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icon.svg|sw.js|uploads).*)"],
};
