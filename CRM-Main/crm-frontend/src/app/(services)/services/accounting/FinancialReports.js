"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight, Layers } from 'lucide-react';

const reportCards = [
  { key: 'trial', label: 'Trial Balance', desc: 'All ledger balances', icon: '⚖️', bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600' },
  { key: 'pl', label: 'Profit & Loss', desc: 'Revenue vs Expenses', icon: '📈', bg: 'bg-teal-50', border: 'border-teal-100', text: 'text-teal-600' },
  { key: 'bs', label: 'Balance Sheet', desc: 'Assets & Liabilities', icon: '🏛️', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600' },
  { key: 'gst', label: 'GST Report', desc: 'Tax summary by month', icon: '🧾', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' },
  { key: 'client', label: 'Client Ledger', desc: 'Per-client invoice summary', icon: '🤝', bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-600' },
  { key: 'expense', label: 'Expense Ledger', desc: 'Category-wise expenses', icon: '💰', bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-600' }
];

export default function FinancialReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={13} className="text-indigo-500" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-indigo-500 uppercase">Reports</span>
          </div>
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Financial Reports</h3>
          <p className="text-sm font-semibold text-gray-400">Open a report to view real data and export.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((card) => (
          <Link
            key={card.key}
            href={`/services/accounting/reports/${card.key}`}
            className="bg-white rounded-2xl border border-gray-200 p-6 text-left hover:shadow-xl hover:border-indigo-200 transition-all group relative overflow-hidden"
          >
            <div className={`w-14 h-14 rounded-2xl ${card.bg} border ${card.border} flex items-center justify-center text-3xl mb-5 transition-transform group-hover:scale-110 duration-500 shadow-sm`}>
              {card.icon}
            </div>
            <p className="font-black text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{card.label}</p>
            <p className="text-sm font-medium text-gray-500 mt-2 line-clamp-2">{card.desc}</p>
            <div className="mt-5 flex items-center justify-between">
              <span className={`text-xs font-black tracking-widest uppercase ${card.text}`}>View details</span>
              <div className={`p-1.5 rounded-lg ${card.bg} ${card.text} group-hover:translate-x-1 transition-transform`}>
                <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

