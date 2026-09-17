"use client";
import React, { useState } from 'react';
import { Search, ChevronDown, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/app/(services)/context/RoleContext';

const PAGE_SIZE = 5;

const statusStyle = {
    'Active': 'bg-green-50 text-green-700 border border-green-200',
    'Expiring': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Inactive': 'bg-gray-100 text-gray-500 border border-gray-200',
};

const billingColors = {
    'Hourly': 'bg-blue-50 text-blue-700',
    'Monthly': 'bg-indigo-50 text-indigo-700',
    'Fixed': 'bg-purple-50 text-purple-700',
    'Milestone': 'bg-teal-50 text-teal-700',
};

export default function ClientTable({ clients, allClients, filters, onFiltersChange, onEdit, onDelete }) {
    const { can } = useRole();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);

    const handleReset = () => {
        setSearch('');
        onFiltersChange({ billing: 'All', status: 'total', colStatus: 'All' });
        setPage(0);
    };

    const filtered = clients.filter(c => {
        const q = search.toLowerCase();
        const ms = (c.company || '').toLowerCase().includes(q) || 
                   (c.contact || '').toLowerCase().includes(q) || 
                   (c.email || '').toLowerCase().includes(q) || 
                   String(c.id || '').toLowerCase().includes(q);
        return ms;
    });

    const pages = Math.ceil(filtered.length / PAGE_SIZE);
    const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const getDaysLeft = (endDate) => {
        if (!endDate) return null;
        const diff = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Controls */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900">Client Directory</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{filtered.length} of {clients.length} clients</p>
                </div>
                <div className="flex-1 flex flex-wrap gap-2 w-full xl:w-auto items-center justify-end">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-xl">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(0); }}
                            placeholder="Find clients by name, ID or email..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 text-sm font-medium text-gray-700 transition-all"
                        />
                    </div>

                    {/* Billing Filter */}
                    <div className="relative min-w-[120px]">
                        <select 
                            value={filters.billing} 
                            onChange={e => { onFiltersChange({ ...filters, billing: e.target.value }); setPage(0); }} 
                            className="w-full pl-4 pr-8 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 bg-white transition-all"
                        >
                            {['All', 'Hourly', 'Monthly', 'Fixed', 'Milestone'].map(b => <option key={b} value={b}>{b === 'All' ? 'All Billing' : b}</option>)}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="relative min-w-[120px]">
                        <select 
                            value={filters.colStatus || 'All'} 
                            onChange={e => { onFiltersChange({ ...filters, colStatus: e.target.value }); setPage(0); }} 
                            className="w-full pl-4 pr-8 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 bg-white transition-all"
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Expiring">Expiring</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    <button
                        onClick={handleReset}
                        className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
                        title="Reset Filters"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[680px]">
                    <thead className="bg-gray-50 border-y border-gray-100 sticky top-0 z-10">
                        <tr>
                            {['Company', 'Contact', 'Email / Phone', 'Billing', 'Contract Period', 'Status', 'Actions'].map(h => (
                                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm font-medium">No clients found</td></tr>
                        ) : rows.map(client => {
                            const daysLeft = getDaysLeft(client.contractEnd);
                            return (
                                <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <p className="font-bold text-gray-900 whitespace-nowrap">{client.company}</p>
                                        <p className="text-xs text-indigo-600 font-medium mt-0.5">{client.clientId || client.id}</p>
                                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">{client.gst}</p>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-gray-700 whitespace-nowrap">{client.contact}</td>
                                    <td className="px-5 py-4">
                                        <p className="text-gray-700 text-sm">{client.email}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{client.phone}</p>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${billingColors[client.billing] || 'bg-gray-100 text-gray-600'}`}>{client.billing}</span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <p className="text-xs text-gray-600 font-medium">{client.contractStart ? new Date(client.contractStart).toLocaleDateString() : '—'} → {client.contractEnd ? new Date(client.contractEnd).toLocaleDateString() : '—'}</p>
                                        {daysLeft !== null && daysLeft <= 30 && daysLeft > 0 && (
                                            <p className="text-xs font-semibold text-amber-600 mt-0.5">{daysLeft} days left</p>
                                        )}
                                        {daysLeft !== null && daysLeft <= 0 && <p className="text-xs font-semibold text-red-500 mt-0.5">Expired</p>}
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${statusStyle[client.status] || ''}`}>{client.status}</span>
                                    </td>
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => router.push(`/services/clients/${client.clientId || client.id}`)}
                                                className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                title="View"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            
                                            {can('CLIENTS', 'UPDATE') && (
                                                <button
                                                    onClick={() => router.push(`/services/clients/edit/${client.clientId || client.id}`)}
                                                    className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                                                    title="Edit"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                            )}
                                            
                                            {can('CLIENTS', 'DELETE') && (
                                                <button
                                                    onClick={() => onDelete(client.id)}
                                                    className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
                <p className="text-gray-500 font-medium hidden sm:block">
                    Showing <span className="text-gray-900">{rows.length > 0 ? (page * PAGE_SIZE) + 1 : 0}</span> to <span className="text-gray-900">{Math.min((page + 1) * PAGE_SIZE, filtered.length)}</span> of <span className="text-gray-900">{filtered.length}</span> entries
                </p>
                <div className="flex items-center gap-1">
                    <button 
                        disabled={page === 0} 
                        onClick={() => setPage(p => p - 1)} 
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        title="Previous"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    
                    <div className="flex items-center gap-1 mx-1">
                        {Array.from({ length: pages }).map((_, i) => {
                            // Show first, last, and 2 pages around current
                            if (pages > 7 && i !== 0 && i !== pages - 1 && Math.abs(i - page) > 1) {
                                if (i === 1 || i === pages - 2) return <span key={i} className="px-1 text-gray-400">...</span>;
                                return null;
                            }
                            return (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                                        page === i 
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' 
                                        : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            );
                        }).filter(Boolean)}
                    </div>

                    <button 
                        disabled={page >= pages - 1} 
                        onClick={() => setPage(p => p + 1)} 
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        title="Next"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
