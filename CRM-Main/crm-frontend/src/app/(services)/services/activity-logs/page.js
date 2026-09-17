"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, History, X } from 'lucide-react';
import ActivityLogTable from './ActivityLogTable';
import AccessDenied from '@/components/AccessDenied';
import { useRole } from '@/app/(services)/context/RoleContext';

// ─── Inner component (all hooks are safe here – no early returns above them) ──
function ActivityLogsContent() {
    const [stats, setStats] = useState({ total: 0, failed: 0, success: 0, staff: 0 });
    const [statusFilter, setStatusFilter] = useState("All");

    const statCards = useMemo(() => {
        return [
            { key: 'All', label: 'Total Logs', value: stats.total.toLocaleString('en-IN'), icon: History, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100', activeRing: 'ring-indigo-500' },
            { key: 'Failed', label: 'Failed', value: stats.failed.toLocaleString('en-IN'), icon: ShieldCheck, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-100', activeRing: 'ring-rose-500' },
            { key: 'Success', label: 'Success', value: stats.success.toLocaleString('en-IN'), icon: ShieldCheck, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', activeRing: 'ring-emerald-500' },
            { key: 'Staff', label: 'Staff', value: stats.staff.toLocaleString('en-IN'), icon: ShieldCheck, color: 'text-sky-700', bg: 'bg-sky-50 border-sky-100', activeRing: 'ring-sky-500' },
        ];
    }, [stats]);

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <History className="text-indigo-700" size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Review detailed system activities, security events, and audit trails.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {statCards.map((stat, i) => {
                        const isActive = statusFilter === stat.key;
                        return (
                            <div
                                key={i}
                                onClick={() => setStatusFilter(stat.key)}
                                className={`rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md group ${stat.bg} ${isActive
                                        ? `ring-2 ${stat.activeRing} border-transparent scale-102 shadow-md z-10`
                                        : 'hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-white/70 border border-white flex items-center justify-center shrink-0">
                                        <stat.icon size={16} className={stat.color} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 uppercase tracking-widest transition-colors">{stat.label}</p>
                                        <p className="text-2xl font-extrabold text-gray-900 mt-1 leading-none">{stat.value}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4">
                {statusFilter !== 'All' && (
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Status: {statusFilter}
                            <button onClick={() => setStatusFilter('All')} className="hover:text-indigo-900 transition-colors">
                                <X size={14} />
                            </button>
                        </span>
                    </div>
                )}
                <ActivityLogTable
                    onMeta={setStats}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                />
            </div>

            <div className="bg-gray-50 rounded-2xl border border-dotted border-gray-300 p-4 text-center">
                <p className="text-xs text-gray-500 font-medium">
                    Audit logs are retained for <span className="text-indigo-600 font-bold">365 days</span> as per enterprise compliance policy.
                    To request older data, contact the IT compliance team.
                </p>
            </div>
        </div>
    );
}

// ─── Page wrapper – role-based access guard runs first ────────────────────────
export default function ActivityLogsPage() {
    const { can, loading } = useRole();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh] text-gray-500 text-sm font-medium">
                Verifying access…
            </div>
        );
    }

    if (!can('ACTIVITY_LOGS', 'READ')) {
        return (
            <AccessDenied
                homeHref="/services"
                homeLabel="Go to Services Dashboard"
            />
        );
    }

    return <ActivityLogsContent />;
}
