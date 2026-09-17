"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Check, AlertCircle, ArrowRight } from 'lucide-react';
import RestaurantLoader from '@/components/RestaurantLoader';
import { getApiBase } from '@/utils/apiBase';
import { useRole } from '@/app/(services)/context/RoleContext';

const toCode = (id) => `JNL-${String(id).padStart(4, '0')}`;

// JournalForm is now removed from here as it's a full page at /journal/new
// But we keep the UI components for consistency if needed.

function JournalLedger({ entries }) {
    const { can } = useRole();
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Posted Journal Ledger</h3>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5">{entries.length} strategic entries recorded</p>
                </div>
                {can('ACCOUNTING', 'CREATE') && (
                    <Link href="/services/accounting/journal/new" className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                        <Plus size={18} /> New Ledger Entry
                    </Link>
                )}
            </div>
            {entries.map(entry => {
                const totalDr = entry.lines.reduce((s, l) => s + l.debit, 0);
                const totalCr = entry.lines.reduce((s, l) => s + l.credit, 0);
                return (
                    <Link key={entry.dbId} href={`/services/accounting/journal/${entry.dbId}`} className="block group">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group-hover:shadow-xl group-hover:border-indigo-200 transition-all group-hover:-translate-y-1">
                            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <span className="font-black text-indigo-600 text-sm bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{entry.code}</span>
                                    <div className="h-4 w-[1px] bg-gray-200" />
                                    <span className="text-xs font-bold text-gray-400">{entry.date}</span>
                                    {entry.ref && <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{entry.ref}</span>}
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-sm font-bold text-gray-700">{entry.narration}</p>
                                    <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[480px]">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ledger</th>
                                            <th className="px-5 py-3 text-right text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Dr (₹)</th>
                                            <th className="px-5 py-3 text-right text-[10px] font-bold text-indigo-900 uppercase tracking-widest">Cr (₹)</th>
                                            <th className="px-5 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {entry.lines.map((line, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3.5 font-bold text-gray-700">{line.ledger}</td>
                                                <td className="px-5 py-3.5 font-black text-indigo-600 text-right">{line.debit > 0 ? `₹${line.debit.toLocaleString()}` : '—'}</td>
                                                <td className="px-5 py-3.5 font-black text-indigo-900 text-right">{line.credit > 0 ? `₹${line.credit.toLocaleString()}` : '—'}</td>
                                                <td className="px-5 py-3.5 text-gray-400 text-xs font-medium italic">{line.desc}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="border-t border-gray-100 bg-gray-50/50">
                                        <tr>
                                            <td className="px-5 py-4 font-black text-gray-500 text-[10px] uppercase tracking-widest">Entry Balance Sum</td>
                                            <td className="px-5 py-4 font-black text-indigo-600 text-right">₹{totalDr.toLocaleString()}</td>
                                            <td className="px-5 py-4 font-black text-indigo-900 text-right">₹{totalCr.toLocaleString()}</td>
                                            <td className="px-5 py-4">
                                                {totalDr === totalCr
                                                    ? <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center justify-center gap-1"><Check size={12} /> Balanced</span>
                                                    : <span className="text-[10px] font-black text-rose-600 uppercase bg-rose-50 px-2 py-1 rounded border border-rose-100 flex items-center justify-center gap-1"><AlertCircle size={12} /> Error</span>}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

export default function JournalEntry() {
    const [entries, setEntries] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const res = await fetch(`${getApiBase()}/api/services/accounting/journals?limit=-1`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json().catch(() => ({}));
                if (!data.success) throw new Error(data.message || 'Failed');

                const mapped = Array.isArray(data.data) ? data.data.map((e) => ({
                    dbId: e.id,
                    code: toCode(e.id),
                    date: e.entryDate ? new Date(e.entryDate).toISOString().slice(0, 10) : '',
                    ref: e.reference || '',
                    narration: e.narration || '',
                    lines: Array.isArray(e.lines) ? e.lines.map((l) => ({
                        ledger: l.ledger || '',
                        debit: Number(l.debit || 0),
                        credit: Number(l.credit || 0),
                        desc: l.description || ''
                    })) : []
                })) : [];

                setEntries(mapped);
            } catch (e) {
                console.error('Failed to load journals:', e);
                setEntries([]);
            }
        })();
    }, []);

    if (entries === null) return <RestaurantLoader />;
    return (
        <div className="space-y-6">
            <JournalLedger entries={entries} />
        </div>
    );
}
