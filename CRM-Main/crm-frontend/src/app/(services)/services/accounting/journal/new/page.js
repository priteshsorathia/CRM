"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { getApiBase } from '@/utils/apiBase';

const ledgerAccounts = [
    'Cash Account', 'Bank Account', 'Accounts Receivable', 'Inventory',
    'Fixed Assets', 'Accounts Payable', 'Loans Payable', 'Owner Equity',
    'Retained Earnings', 'Sales Revenue', 'Service Revenue', 'Cost of Goods Sold',
    'Salary Expense', 'Rent Expense', 'Utilities', 'Taxes'
];

const blankLine = { ledger: '', debit: '', credit: '', desc: '' };

export default function NewJournalEntryPage() {
    const router = useRouter();
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], ref: '', narration: '' });
    const [lines, setLines] = useState([{ ...blankLine }, { ...blankLine }]);
    const [error, setError] = useState('');

    const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    const balanced = totalDebit > 0 && totalDebit === totalCredit;

    const setLine = (i, k, v) => setLines(prev => { const l = [...prev]; l[i] = { ...l[i], [k]: v }; return l; });
    const addLine = () => setLines(l => [...l, { ...blankLine }]);
    const removeLine = (i) => setLines(l => l.filter((_, idx) => idx !== i));

    const handleSave = async () => {
        if (!form.date || !form.narration) { setError('Date and narration are required.'); return; }
        if (!balanced) { setError('Debit and Credit totals must be equal.'); return; }
        const filledLines = lines.filter(l => l.ledger);
        if (filledLines.length < 2) { setError('At least 2 ledger lines required.'); return; }

        try {
            setError('');
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const res = await fetch(`${getApiBase()}/api/services/accounting/journals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    entryDate: form.date,
                    reference: form.ref || null,
                    narration: form.narration,
                    lines: filledLines.map((l) => ({
                        ledger: l.ledger,
                        debit: Number(l.debit) || 0,
                        credit: Number(l.credit) || 0,
                        description: l.desc || null
                    }))
                })
            });
            const data = await res.json().catch(() => ({}));
            if (!data.success) throw new Error(data.message || 'Failed to save entry');
            router.push('/services/accounting');
        } catch (e) {
            console.error('Failed to save journal entry:', e);
            setError(e.message || 'Failed to save entry.');
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all active:scale-90 bg-white">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-1.5 w-6 bg-indigo-600 rounded-full" />
                            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">General Ledger</span>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Post New Entry</h1>
                        <p className="text-sm font-semibold text-gray-400 mt-1 uppercase tracking-widest">Strategic Financial Recording</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={!balanced}
                        className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 ${balanced ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
                    >
                        <Save size={18} /> Record Entry
                    </button>
                </div>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-8 space-y-10">
                    {/* Meta Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] block mb-3">Posting Date <span className="text-indigo-600">*</span></label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 text-base font-bold text-gray-700 transition-all bg-gray-50/30"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] block mb-3">Reference Number</label>
                            <input
                                value={form.ref}
                                onChange={e => setForm(f => ({ ...f, ref: e.target.value }))}
                                className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 text-base font-bold text-gray-700 transition-all bg-gray-50/30"
                                placeholder="e.g. JV-2024-001"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] block mb-3">Narration / Memo <span className="text-indigo-600">*</span></label>
                            <input
                                value={form.narration}
                                onChange={e => setForm(f => ({ ...f, narration: e.target.value }))}
                                className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 text-base font-bold text-gray-700 transition-all bg-gray-50/30"
                                placeholder="Description of purpose"
                            />
                        </div>
                    </div>

                    {/* Entry Lines */}
                    <div>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Transaction Ledger Lines</h3>
                            <button onClick={addLine} className="text-xs font-black text-indigo-600 uppercase flex items-center gap-1.5 hover:underline">
                                <Plus size={14} /> Add Additional Line
                            </button>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Account Name</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-indigo-600 uppercase tracking-widest w-[180px]">Debit (₹)</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-indigo-900 uppercase tracking-widest w-[180px]">Credit (₹)</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Line Note</th>
                                        <th className="px-4 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {lines.map((line, i) => (
                                        <tr key={i} className="group hover:bg-gray-50 transition-colors">
                                            <td className="p-2">
                                                <select
                                                    value={line.ledger}
                                                    onChange={e => setLine(i, 'ledger', e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 text-sm font-bold text-gray-700 bg-transparent transition-all"
                                                >
                                                    <option value="">Select Account...</option>
                                                    {ledgerAccounts.map(a => <option key={a} value={a}>{a}</option>)}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={line.debit}
                                                    onChange={e => setLine(i, 'debit', e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 text-sm font-black text-indigo-600 bg-transparent transition-all text-right"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={line.credit}
                                                    onChange={e => setLine(i, 'credit', e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 text-sm font-black text-indigo-900 bg-transparent transition-all text-right"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    value={line.desc}
                                                    onChange={e => setLine(i, 'desc', e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-transparent hover:border-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 text-sm font-medium text-gray-600 bg-transparent transition-all"
                                                    placeholder="Internal note"
                                                />
                                            </td>
                                            <td className="px-3 py-4 text-center">
                                                {lines.length > 2 && (
                                                    <button onClick={() => removeLine(i)} className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className={`bg-gray-50 border-t-2 ${balanced ? 'border-emerald-400' : 'border-rose-300'}`}>
                                    <tr>
                                        <td className="px-6 py-5 text-xs font-black text-gray-500 uppercase tracking-widest">Balance Verification</td>
                                        <td className="px-6 py-5 text-right font-black text-indigo-600 text-lg">₹{totalDebit.toLocaleString()}</td>
                                        <td className="px-6 py-5 text-right font-black text-indigo-900 text-lg">₹{totalCredit.toLocaleString()}</td>
                                        <td className="px-6 py-5" colSpan={2}>
                                            {balanced ? (
                                                <span className="flex items-center gap-2 text-emerald-600 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 w-fit">
                                                    <Check size={14} /> Perfectly Balanced
                                                </span>
                                            ) : (totalDebit > 0 || totalCredit > 0) ? (
                                                <span className="flex items-center gap-2 text-rose-600 text-[10px] font-black uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 w-fit">
                                                    <AlertCircle size={14} /> Discrepancy: ₹{Math.abs(totalDebit - totalCredit).toLocaleString()}
                                                </span>
                                            ) : null}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-3 px-6 py-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-sm font-bold shadow-sm">
                            <AlertCircle size={20} /> {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
