"use client";
import React from 'react';
import { Download, Calendar, ChevronDown, RotateCcw } from 'lucide-react';

export default function FilterBar({ value, projects, onChange, onExport, onReset, disabled }) {
  const v = value || {};
  const list = Array.isArray(projects) ? projects : [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col gap-3">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Date Range Group */}
        <div className="md:col-span-5 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 px-3 h-11 border border-gray-100 rounded-xl bg-gray-50/50 group focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all">
            <Calendar size={14} className="text-gray-400" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">From</span>
              <input
                type="date"
                value={v.from || ''}
                onChange={(e) => onChange && onChange({ ...v, from: e.target.value })}
                className="bg-transparent focus:outline-none text-xs font-bold text-gray-700 w-full p-0 border-0 focus:ring-0"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 h-11 border border-gray-100 rounded-xl bg-gray-50/50 group focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">To</span>
              <input
                type="date"
                value={v.to || ''}
                onChange={(e) => onChange && onChange({ ...v, to: e.target.value })}
                className="bg-transparent focus:outline-none text-xs font-bold text-gray-700 w-full p-0 border-0 focus:ring-0"
              />
            </div>
          </div>
        </div>

        {/* Project Selector Group */}
        <div className="md:col-span-4 relative group">
          <div className="flex items-center gap-2 px-3 h-11 border border-gray-100 rounded-xl bg-gray-50/50 group-focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all overflow-hidden">
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Filter by Project</span>
              <select
                value={v.projectId || ''}
                onChange={(e) => onChange && onChange({ ...v, projectId: e.target.value })}
                className="bg-transparent focus:outline-none text-xs font-bold text-gray-700 w-full p-0 border-0 focus:ring-0 appearance-none pr-6 truncate"
              >
                <option value="">All Active Projects</option>
                {list.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/*  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none mt-2" size={14} /> */}
        </div>

        {/* Action Group */}
        <div className="md:col-span-3 flex items-center justify-end gap-2">
          <button
            onClick={() => onReset && onReset()}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
            title="Reset Filters"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => !disabled && onExport && onExport('csv')}
            disabled={disabled}
            className={`flex-1 h-11 flex items-center justify-center gap-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
              disabled 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-100'
            }`}
          >
            <Download size={16} /> 
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}

