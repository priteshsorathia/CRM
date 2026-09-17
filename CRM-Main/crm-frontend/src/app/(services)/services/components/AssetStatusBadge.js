"use client";
import React from 'react';

export default function AssetStatusBadge({ status }) {
    const getStyle = (s) => {
        switch (s?.toLowerCase()) {
            case 'available': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case 'assigned': return 'bg-blue-50 text-blue-700 border border-blue-200';
            case 'maintenance': return 'bg-amber-50 text-amber-700 border border-amber-200';
            case 'retired': return 'bg-gray-100 text-gray-700 border border-gray-200';
            case 'expiring soon': return 'bg-rose-50 text-rose-700 border border-rose-200';
            case 'critical': return 'bg-rose-100 text-rose-800 border border-rose-300 font-bold';
            case 'warning': return 'bg-amber-100 text-amber-800 border border-amber-300 font-bold';
            case 'upcoming': return 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold';
            default: return 'bg-gray-50 text-gray-600 border border-gray-100';
        }
    };

    return (
        <span className={`px-2.5 py-1 uppercase tracking-widest text-[10px] font-bold rounded-lg whitespace-nowrap ${getStyle(status)}`}>
            {status}
        </span>
    );
}
