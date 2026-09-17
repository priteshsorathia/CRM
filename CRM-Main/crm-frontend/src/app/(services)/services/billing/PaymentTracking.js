"use client";
import React, { useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { paymentMethods } from '../data/billingDummyData';

const statusStyle = {
    'Draft': 'bg-gray-100 text-gray-600 border border-gray-200',
    'Sent': 'bg-blue-50 text-blue-700 border border-blue-200',
    'Paid': 'bg-green-50 text-green-700 border border-green-200',
    'Partially Paid': 'bg-amber-50 text-amber-700 border border-amber-200',
    'Overdue': 'bg-red-50 text-red-700 border border-red-200',
};

export default function PaymentTracking({ invoice, onBack, onRecord }) {
    const [showForm, setShowForm] = useState(false);
    const [pmtForm, setPmtForm] = useState({ date: new Date().toISOString().split('T')[0], amount: '', method: 'Bank Transfer', ref: '' });

    const outstanding = invoice.amount - invoice.paid;

    const handleAdd = () => {
        if (!pmtForm.amount || isNaN(Number(pmtForm.amount)) || Number(pmtForm.amount) <= 0) return;
        onRecord(invoice.id, { ...pmtForm, amount: Number(pmtForm.amount) });
        setShowForm(false);
        setPmtForm({ date: new Date().toISOString().split('T')[0], amount: '', method: 'Bank Transfer', ref: '' });
    };

    return (
        <div className="space-y-5">
            {/* Back + Header */}
            <div className="flex items-start gap-4">
                <button onClick={onBack} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 mt-1">
                    <ArrowLeft size={16} />
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="font-bold text-gray-900 text-xl">{invoice.id}</h2>
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${statusStyle[invoice.status]}`}>{invoice.status}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{invoice.client} · {invoice.project}</p>
                        </div>
                        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors whitespace-nowrap">
                            <Plus size={14} /> Record Payment
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Invoice Total</p>
                    <p className="text-2xl font-bold text-gray-900">₹{invoice.amount.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-600">₹{invoice.paid.toLocaleString()}</p>
                </div>
                <div className={`rounded-xl shadow-sm border p-4 ${outstanding > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${outstanding > 0 ? 'text-red-400' : 'text-green-400'}`}>Outstanding Balance</p>
                    <p className={`text-2xl font-bold ${outstanding > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {outstanding > 0 ? `₹${outstanding.toLocaleString()}` : 'Fully Paid ✓'}
                    </p>
                </div>
            </div>

            {/* Line Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Line Items</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[480px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>{['Description', 'Qty', 'Rate', 'Tax', 'Total'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoice.items.map((it, i) => {
                                const total = it.qty * it.rate;
                                const tax = total * (it.tax / 100);
                                return (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-800">{it.desc}</td>
                                        <td className="px-4 py-3 text-gray-600">{it.qty}</td>
                                        <td className="px-4 py-3 text-gray-600">₹{it.rate.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-gray-500">{it.tax}%</td>
                                        <td className="px-4 py-3 font-bold text-gray-900">₹{(total + tax).toLocaleString()}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Payment History</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{invoice.payments.length} payment{invoice.payments.length !== 1 ? 's' : ''} recorded</p>
                </div>
                {invoice.payments.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-400 font-medium">No payments recorded yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[480px]">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>{['Payment Date', 'Amount', 'Method', 'Reference'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoice.payments.map((p, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-600 font-medium">{p.date}</td>
                                        <td className="px-4 py-3 font-bold text-green-700">₹{p.amount.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-gray-600">{p.method}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.ref || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Record Payment Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 text-lg">Record Payment</h3>
                            <button onClick={() => setShowForm(false)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-xs font-bold text-amber-700">Outstanding: <span className="text-lg">₹{outstanding.toLocaleString()}</span></p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Amount Received (₹) <span className="text-red-500">*</span></label>
                                <input type="number" value={pmtForm.amount} onChange={e => setPmtForm(f => ({ ...f, amount: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder={`Max ₹${outstanding.toLocaleString()}`} max={outstanding} />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Payment Date</label>
                                <input type="date" value={pmtForm.date} onChange={e => setPmtForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Payment Method</label>
                                <select value={pmtForm.method} onChange={e => setPmtForm(f => ({ ...f, method: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
                                    {paymentMethods.map(m => <option key={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Transaction Reference</label>
                                <input value={pmtForm.ref} onChange={e => setPmtForm(f => ({ ...f, ref: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="TXN-XXXX" />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button onClick={handleAdd} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm">Record Payment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
