import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            role: string;
            complexId?: string | null;
        } & DefaultSession['user'];
    }

    interface User {
        role: string;
        complexId?: string | null;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role: string;
        id: string;
        complexId?: string | null;
    }
}
