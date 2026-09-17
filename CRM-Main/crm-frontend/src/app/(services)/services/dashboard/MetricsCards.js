"use client";
import { useMemo, useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import { useRouter } from 'next/navigation';
import { getApiBase } from '@/utils/apiBase';

export default function MetricsCards() {
    const router = useRouter();
    const [metrics, setMetrics] = useState([]);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const res = await fetch(`${getApiBase()}/api/services/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json().catch(() => ({}));
                if (!data.success) {
                    setMetrics([]);
                    return;
                }
                setMetrics(Array.isArray(data.metrics) ? data.metrics : []);
            } catch (e) {
                console.error('Failed to fetch services dashboard metrics:', e);
                setMetrics([]);
            }
        };
        fetchMetrics();
    }, []);

    const navForType = (type) => {
        if (type === 'projects') return '/services/projects';
        if (type === 'clients') return '/services/clients';
        if (type === 'employees') return '/services/hrms/staff';
        if (type === 'assets') return '/services/assets';
        if (type === 'revenue' || type === 'pending' || type === 'overdue') return '/services/billing';
        if (type === 'expenses') return '/services/expenses';
        if (type === 'profit') return '/services/reports';
        return null;
    };

    const metricsWithNav = useMemo(() => {
        return (Array.isArray(metrics) ? metrics : []).map((m) => {
            const href = navForType(m.type);
            return {
                ...m,
                onClick: href ? () => router.push(href) : undefined
            };
        });
    }, [metrics, router]);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5 mb-6">
            {metricsWithNav.map((m, idx) => <MetricCard key={m.id} metric={m} delay={idx * 0.05} />)}
            {metricsWithNav.length === 0 && (
                <div className="col-span-full bg-white rounded-xl border border-gray-200 p-6 text-sm font-semibold text-gray-500">
                    No metrics yet.
                </div>
            )}
        </div>
    );
}
