"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    FileText,
    Calendar,
    DollarSign,
    CreditCard,
    Plus,
    X,
    Save,
    Trash2,
    ShieldCheck,
    Building2,
    Mail
} from 'lucide-react';
import { initialClients } from '../../../../data/clientDummyData';

export default function NewInvoicePage() {
    const { id: clientId } = useParams();
    const router = useRouter();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState([{ description: '', quantity: 1, rate: 0 }]);
    const [form, setForm] = useState({
        invoiceId: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
        date: new Date().toISOString().split('T')[0],
        due: '',
        status: 'Unpaid',
        tax: 18,
        discount: 0,
        notes: ''
    });

    useEffect(() => {
        const found = initialClients.find(c => c.id === clientId);
        if (found) setClient(found);
    }, [clientId]);

    const addItem = () => setItems([...items, { description: '', quantity: 1, rate: 0 }]);
    const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
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
                    className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors w-fit group"
                >
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Invoices</span>
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Generate Invoice</h1>
                        <p className="text-gray-500 font-bold mt-1">
                            Creating financial statement for <span className="text-indigo-600">{client.company}</span>
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                        <ShieldCheck size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">GST Compliant</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Invoice Body */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                        {/* Meta Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Invoice ID</label>
                                <input readOnly value={form.invoiceId} className={`${inputCls} bg-gray-50 cursor-not-allowed text-indigo-600`} />
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

                        {/* Items Table */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Line Items</h3>
                                <button type="button" onClick={addItem} className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                                    <Plus size={14} /> Add Line
                                </button>
                            </div>

                            <div className="space-y-3">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-start animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex-1 space-y-2">
                                            <input
                                                placeholder="Description of service/product"
                                                value={item.description}
                                                onChange={e => updateItem(idx, 'description', e.target.value)}
                                                className={inputCls}
                                            />
                                        </div>
                                        <div className="w-24 space-y-2">
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                                                className={`${inputCls} text-center`}
                                            />
                                        </div>
                                        <div className="w-32 space-y-2">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="Rate"
                                                    value={item.rate}
                                                    onChange={e => updateItem(idx, 'rate', parseInt(e.target.value) || 0)}
                                                    className={`${inputCls} pl-7 font-black`}
                                                />
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => removeItem(idx)} className="mt-3 p-2 text-gray-300 hover:text-rose-500 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="pt-6 border-t border-gray-50">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Additional Notes</label>
                            <textarea
                                rows={3}
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                className={`${inputCls} mt-2 resize-none`}
                                placeholder="Terms, conditions, or bank details..."
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Summary */}
                <div className="space-y-6">
                    <div className="bg-indigo-900 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between min-h-[450px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[80px] -mr-16 -mt-16" />

                        <div className="space-y-8 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <CreditCard size={24} />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-wider">Statement</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-indigo-300 uppercase tracking-widest">Subtotal</span>
                                    <span className="font-black">₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-indigo-300 uppercase tracking-widest">GST (18%)</span>
                                    <span className="font-black">₹{taxAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="font-bold text-indigo-300 uppercase tracking-widest">Discount</span>
                                    <input
                                        type="number"
                                        value={form.discount}
                                        onChange={e => setForm({ ...form, discount: parseInt(e.target.value) || 0 })}
                                        className="w-20 bg-white/10 border-none rounded-lg px-2 py-1 text-right font-black focus:ring-1 focus:ring-white/20"
                                    />
                                </div>
                                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                    <span className="text-xs font-black text-indigo-300 uppercase tracking-[0.2em]">Grand Total</span>
                                    <span className="text-4xl font-black">₹{total.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 relative z-10 space-y-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-white text-indigo-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3"
                            >
                                {loading ? 'Processing...' : <><Save size={18} /> Finalize & Send</>}
                            </button>
                            <button
                                type="button"
                                className="w-full py-4 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <Mail size={16} /> Send as Draft
                            </button>
                        </div>
                    </div>

                    {/* Quick Preview Card */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4 group cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-50 text-gray-400 group-hover:text-indigo-600 rounded-2xl transition-colors">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Live Preview</h4>
                                <p className="text-[10px] font-bold text-gray-400">See how client will view PDF</p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
