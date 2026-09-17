"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, Eye, Check, X, ChevronLeft, ChevronRight, Paperclip, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { useRole } from '@/app/(services)/context/RoleContext';

const PAGE_SIZE = 6;

const statusStyle = {
  Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  Approved: 'bg-green-50 text-green-700 border border-green-200',
  Rejected: 'bg-red-50 text-red-700 border border-red-200',
  Reimbursed: 'bg-blue-50 text-blue-700 border border-blue-200',
};

export default function ExpenseTable({ expenses, filters, onFiltersChange, onApprove, onReject, onReimburse, onDelete }) {
  const { can } = useRole();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const handleReset = () => {
    setSearch('');
    onFiltersChange({ category: 'All', from: '', to: '', status: 'All' });
    setPage(0);
  };

  const list = Array.isArray(expenses) ? expenses : [];

  // Extract unique categories for filter
  const categories = ['All', ...new Set(list.map(e => e.category).filter(Boolean))].sort();

  const filtered = list.filter((e) => {
    const q = search.toLowerCase();
    const ms =
      String(e.title || '').toLowerCase().includes(q) ||
      String(e.employee || '').toLowerCase().includes(q) ||
      String(e.project || '').toLowerCase().includes(q) ||
      String(e.code || '').toLowerCase().includes(q);
    
    const matchesCategory = filters.category === 'All' || e.category === filters.category;
    const matchesStatus = filters.status === 'All' || e.status === filters.status;
    
    let matchesDate = true;
    if (filters.from && e.date) {
        matchesDate = matchesDate && new Date(e.date) >= new Date(filters.from);
    }
    if (filters.to && e.date) {
        matchesDate = matchesDate && new Date(e.date) <= new Date(filters.to);
    }

    return ms && matchesCategory && matchesStatus && matchesDate;
  });

  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Controls */}
      <div className="p-5 border-b border-gray-100 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Expense Requests</h3>
          <p className="text-xs font-semibold text-gray-400 mt-0.5">{filtered.length} of {list.length} entries</p>
        </div>
        <div className="flex-1 flex flex-wrap items-center gap-2 justify-end w-full">
          {/* Search */}
          <div className="relative flex-1 max-w-xl min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search requests..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 text-sm font-medium text-gray-700 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={filters.category}
              onChange={(e) => {
                onFiltersChange({ ...filters, category: e.target.value });
                setPage(0);
              }}
              className="appearance-none w-full pl-4 pr-10 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 bg-white transition-all"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
              ))}
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

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-gray-50 border-y border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[30%]">Title / ID</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 text-sm font-medium font-bold">
                  No expenses found
                </td>
              </tr>
            ) : (
              rows.map((exp) => (
                <tr key={exp.dbId || exp.code} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-bold">
                    <p className="font-bold text-gray-900 leading-snug">{exp.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-indigo-600 font-bold">{exp.code}</span>
                      {exp.receipt && (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-black bg-emerald-50 px-1 rounded uppercase tracking-[0.05em]">
                          <Paperclip size={10} />
                          Receipt
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-bold">
                    <p className="text-sm font-bold text-gray-700 whitespace-nowrap">{exp.employee}</p>
                    <p className="text-xs font-medium text-gray-400 truncate max-w-[180px]">{exp.project || '—'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded-md text-xs font-black leading-tight inline-block max-w-[180px] truncate">
                      {exp.category || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-black text-gray-900 whitespace-nowrap">₹{Number(exp.amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap text-xs font-bold">{exp.date || '—'}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-black border ${statusStyle[exp.status] || ''}`}>{exp.status}</span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right font-bold">
                    <div className="flex items-center justify-end gap-2">
                      {exp.status === 'Pending' && can('EXPENSES', 'UPDATE') && (
                        <div className="flex items-center bg-emerald-50/50 border border-emerald-100 rounded-xl p-1 gap-1 shadow-sm">
                          <button 
                            onClick={() => onApprove(exp.dbId)} 
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-white hover:shadow-sm transition-all shadow-indigo-100" 
                            title="Approve"
                          >
                            <Check size={16} strokeWidth={3} />
                          </button>
                          <button 
                            onClick={() => onReject(exp.dbId)} 
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-white hover:shadow-sm transition-all shadow-indigo-100" 
                            title="Reject"
                          >
                            <X size={16} strokeWidth={3} />
                          </button>
                        </div>
                      )}

                      {exp.status === 'Approved' && can('EXPENSES', 'UPDATE') && (
                        <button
                          onClick={() => onReimburse(exp.dbId)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100/50 transition-all active:scale-95 whitespace-nowrap"
                        >
                          Reimburse
                        </button>
                      )}

                      <div className="flex items-center gap-1 font-bold">
                        <button
                          onClick={() => router.push(`/services/expenses/${exp.dbId}`)}
                          className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all font-bold"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {can('EXPENSES', 'UPDATE') && (
                          <button
                            onClick={() => router.push(`/services/expenses/edit/${exp.dbId}`)}
                            className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50/50 transition-all font-bold"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                        )}
                        
                        {can('EXPENSES', 'DELETE') && (
                          <button
                            onClick={() => onDelete && onDelete(exp.dbId)}
                            className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50/50 transition-all font-bold"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm">
        <p className="text-gray-500 font-black">
          Page <span className="text-gray-900 uppercase">{page + 1}</span> of <span className="text-gray-900 uppercase">{Math.max(1, pages)}</span>
        </p>
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            disabled={page >= pages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
