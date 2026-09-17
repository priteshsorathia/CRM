"use client";
import React, { useState } from 'react';
import { Search, ChevronDown, Eye, Pencil, Trash2, Users, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

const PAGE_SIZE = 5;

const statusStyle = {
    'Active': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    'Completed': 'bg-green-50 text-green-700 border border-green-200',
    'On Hold': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Overdue': 'bg-red-50 text-red-700 border border-red-200',
};

const statusDot = {
    'Active': 'bg-indigo-500', 'Completed': 'bg-green-500', 'On Hold': 'bg-amber-500', 'Overdue': 'bg-red-500',
};

import { useRole } from '@/app/(services)/context/RoleContext';

export default function ProjectTable({ projects, allProjects, filters, onFiltersChange, onEdit, onDelete, onCreate }) {
    const router = useRouter();
    const { can } = useRole();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);

    const canUpdate = can('PROJECT', 'UPDATE');
    const canDelete = can('PROJECT', 'DELETE');
    const canRead = can('PROJECT', 'READ');
    // We show the actions column if at least one action is permitted
    const showActions = canUpdate || canDelete || canRead;

    const handleReset = () => {
        setSearch('');
        onFiltersChange({ client: 'All', from: '', to: '', status: 'total' });
        setPage(0);
    };

    // Extract unique clients
    const clients = ['All', ...new Set((allProjects || []).map(p => p.client).filter(Boolean))].sort();

    const filtered = projects.filter(p => {
        const q = search.toLowerCase();
        const ms = (p.name || '').toLowerCase().includes(q) || 
                   (p.client || '').toLowerCase().includes(q) || 
                   (p.manager || '').toLowerCase().includes(q) ||
                   (p.projectId || '').toLowerCase().includes(q);
        return ms;
    });

    const pages = Math.ceil(filtered.length / PAGE_SIZE);
    const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Controls */}
            <div className="p-5 border-b border-gray-100 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Project Registry</h3>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5">{filtered.length} of {projects.length} projects</p>
                </div>
                <div className="flex-1 flex flex-wrap items-center gap-2 justify-end w-full">
                    {/* Search */}
                    <div className="relative flex-1 max-w-xl min-w-[200px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(0); }}
                            placeholder="Search projects..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 text-sm font-medium text-gray-700 transition-all"
                        />
                    </div>

                    {/* Client Filter */}
                    <div className="relative min-w-[140px]">
                        <select
                            value={filters.client}
                            onChange={e => { onFiltersChange({ ...filters, client: e.target.value }); setPage(0); }}
                            className="appearance-none w-full pl-4 pr-10 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 bg-white transition-all"
                        >
                            {clients.map(c => <option key={c} value={c}>{c === 'All' ? 'All Clients' : c}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                    </div>

                    {/* Date Filters */}
                    <div className="flex items-center gap-2 bg-gray-50/50 p-1 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">From</span>
                            <input 
                                type="date"
                                value={filters.from}
                                onChange={(e) => {
                                    const newFrom = e.target.value;
                                    let newTo = filters.to;
                                    if (newTo && newFrom && new Date(newTo) < new Date(newFrom)) {
                                        newTo = newFrom;
                                    }
                                    onFiltersChange({ ...filters, from: newFrom, to: newTo });
                                    setPage(0);
                                }}
                                className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 p-1"
                            />
                        </div>
                        <div className="w-px h-4 bg-gray-200" />
                        <div className="flex items-center gap-2 px-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To</span>
                            <input 
                                type="date"
                                value={filters.to}
                                min={filters.from}
                                onChange={(e) => {
                                    onFiltersChange({ ...filters, to: e.target.value });
                                    setPage(0);
                                }}
                                className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 p-1"
                            />
                        </div>
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
                <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-gray-50 border-y border-gray-100 sticky top-0 z-10">
                        <tr>
                            {['Project Name', 'Client', 'Manager', 'Team', 'Start Date', 'End Date', 'Budget', 'Status', ...(showActions ? ['Actions'] : [])].map(h => (
                                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                            {rows.length === 0 ? (
                            <tr><td colSpan={showActions ? 9 : 8} className="text-center py-12 text-gray-400 text-sm font-medium">No projects found</td></tr>
                        ) : rows.map(proj => (
                            <tr key={proj.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot[proj.status] || 'bg-gray-300'}`} />
                                        <div>
                                            <p className="font-bold text-gray-900 leading-snug">{proj.name}</p>
                                            <p className="text-xs font-semibold text-indigo-600 mt-0.5">{proj.projectId || proj.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-gray-700 font-semibold whitespace-nowrap">{proj.client}</td>
                                <td className="px-5 py-4 text-gray-700 font-semibold whitespace-nowrap">{proj.manager}</td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 text-gray-600 font-bold bg-gray-50 px-2 py-1 rounded w-fit">
                                        <Users size={14} className="text-gray-400" /><span>{proj.team}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs font-semibold">{new Date(proj.start).toLocaleDateString()}</td>
                                <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs font-semibold">{new Date(proj.end).toLocaleDateString()}</td>
                                <td className="px-5 py-4 font-black text-gray-900 whitespace-nowrap">₹{(proj.budget / 1000).toFixed(0)}k</td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${statusStyle[proj.status] || ''}`}>{proj.status}</span>
                                </td>
                                    {showActions && (
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                {canRead && (
                                                    <button
                                                        onClick={() => router.push(`/services/projects/${proj.id}`)}
                                                        className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                        title="View"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}
                                                {canUpdate && (
                                                    <button 
                                                        onClick={() => onEdit(proj)} 
                                                        className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all" 
                                                        title="Edit"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button 
                                                        onClick={() => onDelete(proj.id)} 
                                                        className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all" 
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <p className="text-gray-500 font-bold">Page <span className="text-gray-900">{page + 1}</span> of <span className="text-gray-900">{Math.max(1, pages)}</span></p>
                <div className="flex gap-2">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold"><ChevronLeft size={16} /></button>
                    <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold"><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    );
}

