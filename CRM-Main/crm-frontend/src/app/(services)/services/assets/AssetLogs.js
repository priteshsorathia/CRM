"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '@/utils/apiClient';

const PAGE_SIZE = 10;

const actionStyle = {
    'Available': 'bg-green-50 text-green-700 border border-green-200',
    'Returned': 'bg-green-50 text-green-700 border border-green-200',
    'Assigned': 'bg-blue-50 text-blue-700 border border-blue-200',
    'Maintenance': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Asset Created': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
};

export default function AssetLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [page, setPage] = useState(1);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await apiClient.get('/api/assets/logs');
                if (response.data.success) {
                    setLogs(response.data.data.map(log => {
                        const date = new Date(log.date);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return {
                            ...log,
                            date: `${day}-${month}-${year}`
                        };
                    }));
                }
            } catch (error) {
                console.error('Error fetching logs:', error);
                if (error.response?.status === 403) {
                    setAccessDenied(true);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const totalEntries = logs.length;
    const totalPages = Math.ceil(totalEntries / PAGE_SIZE);
    const startEntry = (page - 1) * PAGE_SIZE;
    const displayedLogs = logs.slice(startEntry, startEntry + PAGE_SIZE);

    if (accessDenied) return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Audit Access Denied</h3>
            <p className="text-xs text-gray-400 font-semibold max-w-xs leading-relaxed uppercase tracking-tight italic">Your account does not have permission to view the global activity logs.</p>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Activity Log</h3>
                <p className="text-sm text-gray-500 mt-0.5">Full audit trail of asset operations</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                            {['Activity', 'Asset', 'User', 'Date', 'Notes'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-400">Loading activity logs...</td></tr>
                        ) : displayedLogs.length === 0 ? (
                            <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-400">No activity logs found</td></tr>
                        ) : displayedLogs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${actionStyle[log.activity] || 'bg-gray-100 text-gray-600'}`}>{log.activity}</span>
                                </td>
                                <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap text-sm">{log.asset}</td>
                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-sm">{log.user}</td>
                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs font-medium">{log.date}</td>
                                <td className="px-4 py-3 text-gray-500 text-sm max-w-[200px] truncate">{log.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/10 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Showing <span className="text-gray-400">{totalEntries > 0 ? startEntry + 1 : 0}</span> to <span className="text-gray-400">{Math.min(startEntry + PAGE_SIZE, totalEntries)}</span> of <span className="text-gray-400">{totalEntries}</span> entries
                </p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 bg-white text-[10px] font-black text-gray-600 uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || totalPages === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 bg-white text-[10px] font-black text-gray-600 uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm group"
                    >
                        Next
                        <ChevronLeft size={16} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
