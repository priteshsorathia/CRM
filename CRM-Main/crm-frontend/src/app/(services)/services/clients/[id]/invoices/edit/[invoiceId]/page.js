"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    FileText,
    Save,
    Trash2,
    ShieldCheck,
    ArrowLeft,
    CreditCard
} from 'lucide-react';
import { initialClients } from '../../../../../data/clientDummyData';

export default function EditInvoicePage() {
    const { id: clientId, invoiceId } = useParams();
    const router = useRouter();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([
        { description: 'Service Fee - Phase 1', quantity: 1, rate: 45000 },
        { description: 'Infrastructure Setup', quantity: 1, rate: 12000 }
    ]);
    const [form, setForm] = useState({
        invoiceId: invoiceId,
        date: '2024-03-01',
        due: '2024-03-15',
        status: 'Unpaid',
        tax: 18,
        discount: 500,
        notes: 'Payment via Bank Transfer preferred.'
    });

    useEffect(() => {
        const found = initialClients.find(c => c.id === clientId);
        if (found) setClient(found);
    }, [clientId]);

    const updateItem = (idx, k, v) => {
        const next = [...items];
        next[idx][k] = v;
        setItems(next);
    };

    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
    const taxAmount = (subtotal * form.tax) / 100;
    const total = subtotal + taxAmount - form.discount;

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push(`/services/clients/${clientId}/invoices`);
        }, 1500);
    };

    if (!client) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const inputCls = "w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 transition-all text-sm font-bold";

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors w-fit group"
                >
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Invoices</span>
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Edit Invoice</h1>
                        <p className="text-gray-500 font-bold mt-1">
                            Updating record <span className="text-indigo-600">{invoiceId}</span> for {client.company}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Invoice ID</label>
                                <input readOnly value={form.invoiceId} className={`${inputCls} bg-gray-50 text-indigo-600`} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Issue Date</label>
                                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Due Date</label>
                                <input type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} className={inputCls} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-start">
                                    <div className="flex-1">
                                        <input
                                            value={item.description}
                                            onChange={e => updateItem(idx, 'description', e.target.value)}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <input
                                            value={item.quantity}
                                            onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                                            className={`${inputCls} text-center`}
                                        />
                                    </div>
                                    <div className="w-32">
                                        <input
                                            value={item.rate}
                                            onChange={e => updateItem(idx, 'rate', parseInt(e.target.value) || 0)}
                                            className={`${inputCls} font-black`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-indigo-900 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between min-h-[400px]">
                        <div className="space-y-8">
                            <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-3">
                                <CreditCard size={20} /> Preview Total
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm opacity-60">
                                    <span>SUBTOTAL</span>
                                    <span>₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm opacity-60">
                                    <span>TAX (18%)</span>
                                    <span>₹{taxAmount.toLocaleString()}</span>
                                </div>
                                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                    <span className="text-xs font-black uppercase tracking-widest">Total Amount</span>
                                    <span className="text-3xl font-black">₹{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-8">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-white text-indigo-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? 'Saving Changes...' : <><Save size={18} /> Update Invoice</>}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
