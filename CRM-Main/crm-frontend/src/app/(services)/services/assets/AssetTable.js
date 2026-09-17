"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, Eye, UserPlus, Wrench, Undo2, History, ChevronLeft, ChevronRight, Pencil, Trash2, RotateCcw } from 'lucide-react';

const PAGE_SIZE = 10;

const statusStyle = {
    'Available': 'bg-green-50 text-green-700 border border-green-200',
    'Assigned': 'bg-blue-50 text-blue-700 border border-blue-200',
    'Maintenance': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Expiring': 'bg-red-50 text-red-700 border border-red-200',
    'Retired': 'bg-gray-100 text-gray-600 border border-gray-200',
};

import { useRole } from '@/app/(services)/context/RoleContext';

export default function AssetTable({ 
    assets, 
    onAssign, 
    onReturn, 
    onMaintenance, 
    onViewHistory, 
    onDelete,
    filters,
    onFiltersChange,
    tableRef
}) {
    const router = useRouter();
    const { can } = useRole();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);

    const canUpdate = can('ASSETS', 'UPDATE');
    const canDelete = can('ASSETS', 'DELETE');
    const canRead = can('ASSETS', 'READ');
    const showActions = canUpdate || canDelete || canRead;

    const handleReset = () => {
        setSearch('');
        onFiltersChange({ category: 'All', from: '', to: '', status: 'All' });
        setPage(0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        } catch (e) {
            return dateString;
        }
    };

    const filtered = assets.filter(a => {
        const q = search.toLowerCase();
        const ms = (a.name || '').toLowerCase().includes(q) ||
            (a.assetId || String(a.id)).toLowerCase().includes(q) ||
            (a.assignedTo || '').toLowerCase().includes(q) ||
            (a.serialNumber || '').toLowerCase().includes(q) ||
            (a.category || '').toLowerCase().includes(q) ||
            (a.vendor || '').toLowerCase().includes(q);
            
        let mf = filters.status === 'All';
        if (!mf) {
            if (filters.status === 'Retired') {
                mf = a.status === 'Retired' || a.status === 'Expired';
            } else if (filters.status === 'Expiring') {
                if (!a.warrantyExpiry) {
                    mf = false;
                } else {
                    const expiry = new Date(a.warrantyExpiry);
                    const now = new Date();
                    const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
                    mf = diffDays > 0 && diffDays < 30;
                }
            } else {
                mf = a.status === filters.status;
            }
        }

        const matchesCategory = filters.category === 'All' || a.category === filters.category;
        
        let matchesDate = true;
        if (filters.from && a.purchaseDate) {
            matchesDate = matchesDate && new Date(a.purchaseDate) >= new Date(filters.from);
        }
        if (filters.to && a.purchaseDate) {
            matchesDate = matchesDate && new Date(a.purchaseDate) <= new Date(filters.to);
        }

        return ms && mf && matchesCategory && matchesDate;
    });

    const pages = Math.ceil(filtered.length / PAGE_SIZE);
    const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div ref={tableRef} id="asset-registry" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden scroll-mt-6">
            {/* Controls */}
            <div className="p-5 border-b border-gray-100 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Asset Registry</h3>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5">{filtered.length} of {assets.length} assets</p>
                </div>
                <div className="flex-1 flex flex-wrap items-center gap-2 justify-end w-full">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px] max-w-xl">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(0); }}
                            placeholder="Search assets..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 text-sm font-medium text-gray-700 transition-all"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="relative min-w-[140px]">
                        <select
                            value={filters.category}
                            onChange={e => { onFiltersChange({ ...filters, category: e.target.value }); setPage(0); }}
                            className="appearance-none w-full pl-4 pr-10 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 bg-white transition-all shadow-sm"
                        >
                            {['All', 'Laptop', 'Mobile', 'Server', 'License', 'Hardware', 'Other'].map(o => <option key={o} value={o}>{o === 'All' ? 'All Categories' : o}</option>)}
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

            {/* Registry Table */}
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full text-sm min-w-[750px]">
                    <thead className="bg-gray-50 border-y border-gray-100 sticky top-0 z-10">
                        <tr>
                            {['ID', 'Asset Name', 'Category', 'Serial No.', 'Status', 'Assigned To', 'Warranty Expiry', ...(showActions ? ['Actions'] : [])].map(h => (
                                <th key={h} className={`px-5 py-3.5 ${h === 'Actions' ? 'text-right' : 'text-center'} text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.length === 0 ? (
                            <tr><td colSpan={showActions ? 8 : 7} className="text-center py-12 text-gray-400 text-sm font-medium">No assets found</td></tr>
                        ) : rows.map(asset => (
                            <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-5 py-4 font-bold text-gray-900 text-xs whitespace-nowrap">
                                    {asset.assetId}
                                </td>
                                <td className="px-5 py-4">
                                    <p className="font-bold text-gray-900 leading-snug">{asset.name}</p>
                                    <p className="text-xs font-medium text-gray-400 mt-0.5">{asset.vendor}</p>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="px-2 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded-md text-xs font-bold whitespace-nowrap">{asset.category}</span>
                                </td>
                                <td className="px-5 py-4 text-xs font-mono font-bold text-gray-600 whitespace-nowrap">{asset.serialNumber}</td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${statusStyle[asset.status] || ''}`}>{asset.status}</span>
                                </td>
                                <td className="px-5 py-4 text-gray-700 font-bold whitespace-nowrap text-sm">{asset.assignedTo || <span className="text-gray-300 italic text-xs">—</span>}</td>
                                <td className="px-5 py-4 text-gray-500 font-semibold whitespace-nowrap text-xs">{formatDate(asset.warrantyExpiry)}</td>
                                {showActions && (
                                    <td className="px-5 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {canRead && (
                                                <button
                                                    title="View"
                                                    onClick={() => router.push(`/services/assets/${asset.id}`)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            )}
                                            {canUpdate && asset.status === 'Available' && (
                                                <button
                                                    title="Assign"
                                                    onClick={() => router.push(`/services/assets/${asset.id}/assign`)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                                >
                                                    <UserPlus size={18} />
                                                </button>
                                            )}
                                            {canUpdate && asset.status === 'Assigned' && (
                                                <>
                                                    <button title="Return" onClick={() => onReturn(asset.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all"><Undo2 size={18} /></button>
                                                    <button title="Maintenance" onClick={() => onMaintenance(asset.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Wrench size={18} /></button>
                                                </>
                                            )}
                                            {canUpdate && asset.status === 'Maintenance' && (
                                                <button title="Mark Available" onClick={() => onReturn(asset.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><Undo2 size={18} /></button>
                                            )}
                                            {canRead && (
                                                <button
                                                    title="History"
                                                    onClick={() => router.push(`/services/assets/${asset.id}/history`)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                >
                                                    <History size={18} />
                                                </button>
                                            )}
                                            {canUpdate && (
                                                <button
                                                    title="Edit"
                                                    onClick={() => router.push(`/services/assets/${asset.id}/edit`)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    title="Delete"
                                                    onClick={() => onDelete(asset)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
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
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                    Showing <span>{filtered.length > 0 ? page * PAGE_SIZE + 1 : 0}</span> to <span>{Math.min((page + 1) * PAGE_SIZE, filtered.length)}</span> of <span>{filtered.length}</span> entries
                </p>
                <div className="flex gap-2">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold"><ChevronLeft size={16} /></button>
                    <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold"><ChevronRight size={16} /></button>
                </div>
            </div>
        </div>
    );
}
