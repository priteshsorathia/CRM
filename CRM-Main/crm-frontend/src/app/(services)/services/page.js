import MetricsCards from './dashboard/MetricsCards';
import RevenueCharts from './dashboard/RevenueCharts';
import QuickActions from './dashboard/QuickActions';
import RecentActivities from './dashboard/RecentActivities';
import VersionCheck from '@/components/VersionCheck';

export default function ServicesDashboard() {
    return (
        <div>
            {/* Version & Status Banner */}
            <div className="mb-6">
                <VersionCheck />
            </div>

            {/* Welcome Bar */}

            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Good morning, CRM 👋</h2>
                <p className="text-sm text-gray-500 mt-1">Here's what's happening with your business today.</p>
            </div>

            <MetricsCards />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-5 mt-6">
                <div className="xl:col-span-2 space-y-4 lg:space-y-5">
                    <RevenueCharts />
                </div>
                <div className="xl:col-span-1 space-y-4 lg:space-y-5">
                    <QuickActions />
                    <RecentActivities />
                </div>
            </div>
        </div>
    );
}