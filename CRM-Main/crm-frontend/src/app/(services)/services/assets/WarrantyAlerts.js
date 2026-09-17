"use client";
import React, { useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

const getDaysStyle = (days) => {
    if (days < 0) return { badge: 'bg-gray-50 text-gray-500 border border-gray-200', dot: 'bg-gray-400', label: 'Expired' };
    if (days < 7) return { badge: 'bg-red-50 text-red-700 border border-red-200', dot: 'bg-red-500', label: 'Critical' };
    if (days < 30) return { badge: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500', label: 'Warning' };
    return { badge: 'bg-green-50 text-green-700 border border-green-200', dot: 'bg-green-500', label: 'Protected' };
};

export default function WarrantyAlerts({ assets = [] }) {
    const [page, setPage] = useState(1);

    const alerts = assets
        .filter(a => a.warrantyExpiry)
        .map(a => {
            const expiry = new Date(a.warrantyExpiry);
            const now = new Date();
            const diffTime = expiry - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const day = String(expiry.getDate()).padStart(2, '0');
            const month = String(expiry.getMonth() + 1).padStart(2, '0');
            const year = expiry.getFullYear();
            const formattedExpiry = `${day}-${month}-${year}`;

            return {
                id: a.id,
                assetName: a.name,
                type: a.category,
                expiryDate: formattedExpiry,
                daysLeft: diffDays
            };
        })
        .filter(alert => alert.id)
        .sort((a, b) => a.daysLeft - b.daysLeft);

    const totalEntries = alerts.length;
    const totalPages = Math.ceil(totalEntries / PAGE_SIZE);
    const startEntry = (page - 1) * PAGE_SIZE;
    const displayedAlerts = alerts.slice(startEntry, startEntry + PAGE_SIZE);

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className=" border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-50 border border-red-100">
                        <AlertTriangle size={18} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Warranty & License Alerts</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Upcoming expiry notifications</p>
                    </div>
                </div>
                <div className="divide-y divide-gray-100">
                    {displayedAlerts.length === 0 ? (
                        <div className="px-5 py-8 text-center text-gray-400 font-medium text-sm">
                            No upcoming warranty expirations
                        </div>
                    ) : displayedAlerts.map(alert => {
                        const style = getDaysStyle(alert.daysLeft);
                        return (
                            <div key={alert.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${style.dot} flex-shrink-0`} />
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{alert.assetName}</p>
                                        <p className="text-xs text-gray-500 font-medium mt-0.5">{alert.type} · Expires {alert.expiryDate}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${style.badge}`}>{alert.daysLeft} days</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination Footer */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <p className="text-xs text-gray-500 font-medium">
                        Showing <span>{totalEntries > 0 ? startEntry + 1 : 0}</span> to <span>{Math.min(startEntry + PAGE_SIZE, totalEntries)}</span> of <span>{totalEntries}</span> entries
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all font-bold"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || totalPages === 0}
                            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all font-bold"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            
        </div>
    );
}
