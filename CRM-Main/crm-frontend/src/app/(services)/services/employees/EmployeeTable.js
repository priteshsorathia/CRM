"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useRole } from '@/app/(services)/context/RoleContext';

const PAGE_SIZE = 5;

const statusStyle = {
    active: 'bg-green-50 text-green-700 border border-green-200',
    on_leave: 'bg-amber-50 text-amber-700 border border-amber-200',
    probation: 'bg-blue-50 text-blue-700 border border-blue-200',
    resigned: 'bg-red-50 text-red-700 border border-red-200',
    inactive: 'bg-gray-50 text-gray-700 border border-gray-200',
};

const titleStatus = (value) => {
    const s = String(value || '').trim();
    if (!s) return '—';
    if (s.toLowerCase() === 'on_leave') return 'On Leave';
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function EmployeeTable({ employees = [], loading = false, error = '', onRefresh = null }) {
    const { can } = useRole();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);

    const filtered = employees.filter((e) => {
        const q = search.toLowerCase();
        const haystack = [
            e?.emp_id,
            e?.full_name,
            e?.role,
            e?.email,
            e?.phone,
        ]
            .filter(Boolean)
            .map((v) => String(v).toLowerCase())
            .join(' ');

        return haystack.includes(q);
    });

    const pages = Math.ceil(filtered.length / PAGE_SIZE);
    const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Controls */}
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 w-full sm:max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                        placeholder="Search by name, ID, role, phone..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 text-sm font-medium text-gray-700 transition-all"
                    />
                </div>
                {typeof onRefresh === 'function' && (
                    <button
                        onClick={() => onRefresh()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all text-sm font-bold"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                )}
            </div>

            {error ? (
                <div className="px-5 py-3 bg-rose-50 border-b border-rose-100 text-rose-700 text-sm font-semibold">
                    {error}
                </div>
            ) : null}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-gray-50 border-y border-gray-100 sticky top-0 z-10">
                        <tr>
                            {['Emp ID', 'Name', 'Role', 'Phone', 'Salary', 'Status', 'Actions'].map(h => (
                                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm font-medium">Loading employees…</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm font-medium">No employees found</td></tr>
                        ) : rows.map(emp => (
                            <tr key={emp.emp_id || emp.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-4 font-bold text-indigo-600 text-xs whitespace-nowrap">{emp.emp_id || '—'}</td>
                                <td className="px-5 py-4">
                                    <p className="font-bold text-gray-900 leading-snug">{emp.full_name || '-'}</p>
                                    <p className="text-xs font-medium text-gray-400 mt-0.5">{emp.email || '-'}</p>
                                </td>
                                <td className="px-5 py-4 text-gray-600 font-semibold whitespace-nowrap">{emp.role || '-'}</td>
                                <td className="px-5 py-4 text-gray-700 font-semibold whitespace-nowrap">{emp.phone || '-'}</td>
                                <td className="px-5 py-4 font-black text-gray-900 whitespace-nowrap">₹{Number(emp.salary || 0).toLocaleString()}</td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${statusStyle[String(emp.status || '').toLowerCase()] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                        {titleStatus(emp.status)}
                                    </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <button
                                            onClick={() => router.push(`/services/hrms/staff/${emp.emp_id || emp.id}`)}
                                            className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        
                                        {can('EMPLOYEE', 'UPDATE') && (
                                            <button
                                                onClick={() => router.push(`/services/hrms/staff/${emp.emp_id || emp.id}/edit`)}
                                                className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                        )}
                                        
                                        {can('EMPLOYEE', 'DELETE') && (
                                            <button
                                                onClick={() => router.push(`/services/hrms/staff/${emp.emp_id || emp.id}/delete`)}
                                                className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <p className="text-gray-500 font-bold">{filtered.length} employees · Page <span className="text-gray-900">{page + 1}</span> of <span className="text-gray-900">{Math.max(1, pages)}</span></p>
                <div className="flex gap-2">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold"><ChevronLeft size={16} /></button>
                    <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold"><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    );
}
