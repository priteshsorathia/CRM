"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import NotificationCard from './NotificationCard';
import RestaurantLoader from '@/components/RestaurantLoader';
import { getApiBase } from '@/utils/apiBase';

const notificationTypes = ['All', 'Assets', 'HR', 'Projects', 'Billing'];

const toRelativeTime = (dateValue) => {
    const dt = dateValue ? new Date(dateValue) : null;
    if (!dt || Number.isNaN(dt.getTime())) return '';

    const diffMs = Date.now() - dt.getTime();
    const diffSec = Math.max(0, Math.floor(diffMs / 1000));
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 45) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 14) return `${diffDay} days ago`;

    return dt.toLocaleDateString();
};

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState('All');
    const [sortOrder, setSortOrder] = useState('desc');
    const [notifications, setNotifications] = useState(null);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async (targetPage = page) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/notifications?page=${targetPage}&limit=10&type=${encodeURIComponent(activeTab)}&sort=${sortOrder}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json().catch(() => ({}));
            if (!data.success) throw new Error(data.message || 'Failed');
            const mapped = Array.isArray(data.data)
                ? data.data.map((n) => ({
                    id: n.id,
                    type: n.type || 'Billing',
                    title: n.title || 'Notification',
                    description: n.description || '',
                    time: toRelativeTime(n.createdAt),
                    read: Boolean(n.read),
                    severity: n.severity || 'info'
                }))
                : [];
            setNotifications(mapped);
            setPages(Number(data?.pagination?.pages) || 1);
            setTotal(Number(data?.pagination?.total) || 0);
            setUnread(Number(data?.pagination?.unread) || 0);
        } catch (e) {
            console.error('Error fetching notifications:', e);
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchNotifications(1);
    }, [activeTab, sortOrder]);

    useEffect(() => {
        // Only fetch if page changes and it's not the initial load (handled by activeTab useEffect)
        // Or if it's the first page and total is already known (e.g., after initial load)
        if (page > 1 || (total > 0 && page === 1 && notifications !== null && notifications.length === 0 && total > 0)) {
           fetchNotifications(page);
        }
    }, [page]);

    const handleRead = (id) => {
        setNotifications((prev) => Array.isArray(prev) ? prev.map((n) => n.id === id ? { ...n, read: true } : n) : prev);
        (async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                await fetch(`${getApiBase()}/api/services/notifications/${id}/read`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (e) {
                console.error('Mark read failed:', e);
            }
        })();
    };

    const markAllRead = () => {
        setNotifications((prev) => Array.isArray(prev) ? prev.map((n) => ({ ...n, read: true })) : prev);
        (async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                await fetch(`${getApiBase()}/api/services/notifications/mark-all-read?type=${encodeURIComponent(activeTab)}`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (e) {
                console.error('Mark all read failed:', e);
            }
        })();
    };

    const clearAll = () => {
        setNotifications([]);
        (async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                await fetch(`${getApiBase()}/api/services/notifications`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (e) {
                console.error('Clear notifications failed:', e);
            }
        })();
    };

    const dismissOne = async (id) => {
        setNotifications((prev) => Array.isArray(prev) ? prev.filter((n) => n.id !== id) : prev);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            await fetch(`${getApiBase()}/api/services/notifications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (e) {
            console.error('Dismiss notification failed:', e);
        }
    };

    const filtered = notifications || [];

    const unreadCount = unread;

    if (notifications === null) return <RestaurantLoader />;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage your alerts and stay updated with system activities.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={markAllRead}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
                    >
                        <CheckCheck size={16} className="text-indigo-600" />
                        Mark all read
                    </button>
                    <button
                        onClick={clearAll}
                        className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                        title="Clear all"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Tabs & Filter Info */}
            <div className="space-y-4">
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm overflow-x-auto scrollbar-hide">
                    {notificationTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setActiveTab(type)}
                            className={`px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === type
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            {type}
                            {type === 'All' && unreadCount > 0 && (
                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'All' ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between px-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {filtered.length} Notifications {activeTab !== 'All' ? `in ${activeTab}` : ''}
                    </p>
                    <div 
                        onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="flex items-center gap-1 text-xs text-indigo-600 font-bold cursor-pointer hover:underline select-none"
                    >
                        <Filter size={12} />
                        Sort by: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3 pb-8">
                {filtered.length > 0 ? (
                    filtered.map(notification => (
                        <NotificationCard
                            key={notification.id}
                            notification={notification}
                            onRead={handleRead}
                            onDismiss={dismissOne}
                        />
                    ))
                ) : (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Bell size={28} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">All caught up!</h3>
                        <p className="text-sm text-gray-500 max-w-xs mt-2">
                            No new notifications found in this category. We'll alert you when something happens.
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pages > 1 && (
                <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-8">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Showing <span className="text-gray-900">{filtered.length}</span> of {total} notifications
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page <= 1 || loading}
                            onClick={() => setPage(prv => prv - 1)}
                            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="px-4 text-sm font-bold text-gray-700">
                            Page {page} of {pages}
                        </div>
                        <button
                            disabled={page >= pages || loading}
                            onClick={() => setPage(nxt => nxt + 1)}
                            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
