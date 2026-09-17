"use client";
import { useEffect, useMemo, useState } from 'react';
import ActivityItem from './ActivityItem';
import { FaClock } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { getApiBase } from '@/utils/apiBase';

const relativeTime = (value) => {
    try {
        const d = new Date(value);
        const ms = Date.now() - d.getTime();
        if (!Number.isFinite(ms)) return '';
        const mins = Math.floor(ms / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins} mins ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} hours ago`;
        const days = Math.floor(hrs / 24);
        return `${days} days ago`;
    } catch {
        return '';
    }
};

export default function RecentActivities() {
    const router = useRouter();
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const res = await fetch(`${getApiBase()}/api/services/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json().catch(() => ({}));
                if (data.success && Array.isArray(data.recentActivities)) {
                    setActivities(data.recentActivities);
                } else {
                    setActivities([]);
                }
            } catch (e) {
                console.error('Failed to fetch recent activities:', e);
                setActivities([]);
            }
        };
        fetchRecent();
    }, []);

    const viewItems = useMemo(() => {
        return (Array.isArray(activities) ? activities : []).map((a) => ({
            ...a,
            timestamp: relativeTime(a.timestamp)
        }));
    }, [activities]);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FaClock className="text-gray-700" size={16} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Recent Activity</h2>
                        <p className="text-xs text-gray-600">Latest updates and actions</p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/services/activity-logs')}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-xs lg:text-sm transition-colors"
                >
                    View All &rarr;
                </button>
            </div>
            <div className="divide-y divide-gray-100 p-2 lg:p-4">
                {viewItems.length === 0 ? (
                    <div className="py-8 text-center text-sm text-gray-400 font-semibold">No recent activity.</div>
                ) : viewItems.map(a => <ActivityItem key={a.id} activity={a} />)}
            </div>
        </div>
    );
}
