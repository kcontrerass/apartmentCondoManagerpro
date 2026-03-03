import { auth } from '@/auth';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PollList } from '@/components/polls/PollList';
import { prisma } from '@/lib/db';

export default async function PollsPage() {
    const session = await auth();
    if (!session?.user) return null;

    let complexId = (session.user as any).complexId;

    // If resident, we might need to fetch the complexId from the profile if not in session
    if (!complexId && session.user.role === 'RESIDENT') {
        const resident = await prisma.resident.findUnique({
            where: { userId: session.user.id },
            include: { unit: true }
        });
        complexId = resident?.unit?.complexId;
    }

    return (
        <MainLayout user={session.user}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white items-center flex gap-3">
                        <span className="material-symbols-outlined text-3xl text-primary">ballot</span>
                        Votaciones y Encuestas
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Participa en las decisiones de tu comunidad de forma digital.
                    </p>
                </div>

                <PollList
                    complexId={complexId || ''}
                    userRole={session.user.role}
                />
            </div>
        </MainLayout>
    );
}
