import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";

export default function DashboardPage() {
    const activities = [
        {
            reference: 'Unit 402',
            type: 'Maintenance Fee',
            status: { label: 'Paid', variant: 'success' as const },
            datetime: 'Today, 11:30 AM',
            details: '$250.00',
        },
        {
            reference: 'Unit 105',
            type: 'Amenity Reservation',
            status: { label: 'Pending', variant: 'warning' as const },
            datetime: 'Today, 09:15 AM',
            details: '$50.00',
        },
        {
            reference: 'Visitor Log',
            type: 'Access Control',
            status: { label: 'Logged', variant: 'info' as const },
            datetime: 'Today, 08:45 AM',
            details: 'John Doe',
        },
        {
            reference: 'Unit 203',
            type: 'Incident Report',
            status: { label: 'Urgent', variant: 'warning' as const },
            datetime: 'Yesterday, 16:20 PM',
            details: '#INC-2023-001',
        },
        {
            reference: 'Unit 501',
            type: 'Monthly Fee',
            status: { label: 'Paid', variant: 'success' as const },
            datetime: 'Yesterday, 10:00 AM',
            details: '$250.00',
        },
    ];

    const occupancyData = {
        owners: 120,
        tenants: 50,
        vacant: 30,
    };

    return (
        <MainLayout>
            <div className="space-y-8">
                {/* Page Header */}
                <PageHeader
                    title="Dashboard Overview"
                    subtitle="Welcome back, here's what's happening at Sunset Towers."
                    actions={
                        <>
                            <Button variant="secondary" icon="mail">Send Notice</Button>
                            <Button variant="secondary" icon="person_add">Register Visitor</Button>
                            <Button variant="primary" icon="warning">New Incident</Button>
                        </>
                    }
                />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon="payments"
                        label="Total Debt"
                        value="$12,450"
                        subtitle="Vs last month"
                        badge={{ text: '+2%', variant: 'success' }}
                    />
                    <StatCard
                        icon="warning"
                        iconBgColor="bg-orange-50 dark:bg-orange-900/20"
                        iconColor="text-orange-500"
                        label="Open Incidents"
                        value="3"
                        subtitle="Requires attention"
                        badge={{ text: '1 High Priority', variant: 'warning' }}
                    />
                    <StatCard
                        icon="event"
                        iconBgColor="bg-purple-50 dark:bg-purple-900/20"
                        iconColor="text-purple-500"
                        label="Events Today"
                        value="5"
                        subtitle="2 Amenity bookings"
                        badge={{ text: 'Active', variant: 'info' }}
                    />
                    <StatCard
                        icon="group"
                        iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
                        iconColor="text-emerald-600"
                        label="Active Residents"
                        value="573"
                        subtitle="+12 this month"
                        badge={{ text: '+2%', variant: 'success' }}
                    />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <ActivityTable activities={activities} />
                    </div>
                    <div className="lg:col-span-1 h-full">
                        <OccupancyChart data={occupancyData} totalUnits={200} />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
