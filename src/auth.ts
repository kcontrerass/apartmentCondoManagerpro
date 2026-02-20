import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

import { prisma } from '@/lib/db';

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                managedComplexes: { select: { id: true } },
                residentProfile: {
                    include: {
                        unit: {
                            select: { complexId: true }
                        }
                    }
                }
            }
        });

        if (!user) return null;

        // Flatten complexId for easier access in JWT/Session
        let complexId: string | null = user.complexId; // From assignedComplex (Staff)

        if (!complexId && user.managedComplexes) {
            complexId = user.managedComplexes.id; // From managedComplexes (Admin)
        }

        if (!complexId && user.residentProfile?.unit) {
            complexId = user.residentProfile.unit.complexId; // From residentProfile -> Unit (Resident)
        }

        return { ...user, complexId };
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) return user;
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
});
