import { auth } from '@/auth';
import IncidentDetailClient from './IncidentDetailClient';
import { MainLayout } from '@/components/layouts/MainLayout';

export default async function IncidentDetailPage({
    params
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    if (!session?.user) return null;

    const { id } = await params;

    return (
        <MainLayout user={session.user}>
            <IncidentDetailClient
                incidentId={id}
                userRole={session.user.role}
            />
        </MainLayout>
    );
}
