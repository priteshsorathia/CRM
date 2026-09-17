"use client";
import React, { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import { paymentTerms, taxRates } from '../data/billingDummyData';
import { initialClients } from '../data/clientDummyData';
import { initialProjects } from '../data/projectDummyData';

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm";

const blankItem = { desc: '', qty: 1, rate: 0, tax: 18 };

const timeLogs = [
    { task: 'Architecture Planning', hours: 12, rate: 3500 },
    { task: 'Backend Development', hours: 40, rate: 3200 },
    { task: 'Frontend Development', hours: 35, rate: 2800 },
    { task: 'QA & Testing', hours: 15, rate: 2500 },
];

export default function InvoiceCreator({ onSave, editData, onClose }) {
    const [form, setForm] = useState(editData || {
        client: '', project: '', terms: 'Net 30', due: '', notes: '',
        discount: 0, items: [{ ...blankItem }],
    });
    const [includeTimeLogs, setIncludeTimeLogs] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const setItem = (i, k, v) => setForm(f => {
        const items = [...f.items];
        items[i] = { ...items[i], [k]: v };
        return { ...f, items };
    });
    const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...blankItem }] }));
    const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

    const lineTotal = (item) => (Number(item.qty) * Number(item.rate));
    const lineTax = (item) => lineTotal(item) * (Number(item.tax) / 100);
    const lineGross = (item) => lineTotal(item) + lineTax(item);

    const subtotal = form.items.reduce((s, it) => s + lineTotal(it), 0);
    const totalTax = form.items.reduce((s, it) => s + lineTax(it), 0);
    const discAmount = subtotal * (Number(form.discount) / 100);
    const grandTotal = subtotal + totalTax - discAmount;

    const handleSave = (status) => {
        const invoice = {
            ...form,
            id: editData?.id || `INV-${2500 + Math.floor(Math.random() * 500)}`,
            issued: new Date().toISOString().split('T')[0],
            amount: Math.round(grandTotal),
            paid: editData?.paid || 0,
            payments: editData?.payments || [],
            status,
        };
        onSave(invoice);
    };

    const addTimeLogs = () => {
        const newItems = timeLogs.map(t => ({ desc: t.task, qty: t.hours, rate: t.rate, tax: 18 }));
        setForm(f => ({ ...f, items: [...f.items.filter(it => it.desc !== ''), ...newItems] }));
        setIncludeTimeLogs(true);
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 p-10">
            {/* ── Left: Form ── */}
            <div className="xl:col-span-3 space-y-6">

                {/* Client & Project */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Transactional Context</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 ml-1">Billed Entity <span className="text-rose-500">*</span></label>
                            <select value={form.client} onChange={e => set('client', e.target.value)} className={inputCls}>
                                <option value="">Select client</option>
                                {initialClients.map(c => <option key={c.id}>{c.company}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 ml-1">Venture Project <span className="text-rose-500">*</span></label>
                            <select value={form.project} onChange={e => set('project', e.target.value)} className={inputCls}>
                                <option value="">Select project</option>
                                {initialProjects.map(p => <option key={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 ml-1">Settlement Terms</label>
                            <select value={form.terms} onChange={e => set('terms', e.target.value)} className={inputCls}>
                                {paymentTerms.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 ml-1">Maturity Date</label>
                            <input type="date" value={form.due} onChange={e => set('due', e.target.value)} className={inputCls} />
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-sm font-bold text-gray-800">Fiscal Breakdown</h3>
                        <div className="flex gap-2">
                            {!includeTimeLogs && (
                                <button onClick={addTimeLogs} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-all border border-indigo-100">
                                    + Sync Time Logs
                                </button>
                            )}
                            <button onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-all border border-emerald-100">
                                <Plus size={14} /> Add Particular
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {form.items.map((item, i) => (
                            <div key={i} className="group p-5 rounded-xl bg-gray-50 border border-gray-200 hover:border-indigo-200 transition-all">
                                <div className="grid grid-cols-12 gap-4 items-center">
                                    <div className="col-span-12 md:col-span-5">
                                        <label className="text-xs font-bold text-gray-600 mb-1.5 block">Description</label>
                                        <input value={item.desc} onChange={e => setItem(i, 'desc', e.target.value)} className={inputCls} placeholder="e.g. System Architecture Design" />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <label className="text-xs font-bold text-gray-600 mb-1.5 block">Quantity</label>
                                        <input type="number" value={item.qty} onChange={e => setItem(i, 'qty', e.target.value)} className={inputCls} />
                                    </div>
                                    <div className="col-span-4 md:col-span-2">
                                        <label className="text-xs font-bold text-gray-600 mb-1.5 block">Rate (₹)</label>
                                        <input type="number" value={item.rate} onChange={e => setItem(i, 'rate', e.target.value)} className={inputCls} />
                                    </div>
                                    <div className="col-span-3 md:col-span-2">
                                        <label className="text-xs font-bold text-gray-600 mb-1.5 block">Tax %</label>
                                        <select value={item.tax} onChange={e => setItem(i, 'tax', e.target.value)} className={inputCls}>
                                            {taxRates.map(t => <option key={t} value={t}>{t}%</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-1 flex justify-end items-end pt-5">
                                        <button onClick={() => removeItem(i)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                                        <span>Total: <span className="text-gray-900">₹{lineTotal(item).toLocaleString()}</span></span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                        <span>GST: <span className="text-emerald-600">₹{lineTax(item).toLocaleString()}</span></span>
                                    </div>
                                    <span className="text-sm font-bold text-indigo-600">₹{lineGross(item).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Finalization */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-800">Ledger Compliance Notes</h3>
                        <textarea rows={4} value={form.notes} onChange={e => set('notes', e.target.value)} className={`${inputCls} resize-none`} placeholder="e.g. Banking details, special instructions..." />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-800">Fiscal Adjustments</h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-600 ml-1">Global Discount Percentage</label>
                                <div className="relative">
                                    <input type="number" value={form.discount} onChange={e => set('discount', e.target.value)} className={inputCls} placeholder="0" min="0" max="100" />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-end pt-4">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all">Abort Changes</button>
                    <button onClick={() => handleSave('Draft')} className="px-6 py-2.5 rounded-xl bg-gray-50 text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-all border border-gray-200">Stage Draft</button>
                    <button onClick={() => handleSave('Sent')} className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-all">Transmit & Finalize</button>
                </div>
            </div>

            {/* ── Right: Preview ── */}
            <div className="xl:col-span-2">
                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 sticky top-10 flex flex-col group">
                    {/* Preview Header */}
                    <div className="relative z-10 flex justify-between items-start mb-6 border-b border-gray-200 pb-6">
                        <div>
                            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                                <span className="text-white font-bold text-sm">CRM</span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 leading-none">CRM Services</h2>
                            <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">Digital Infrastructure & Ops</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-bold text-indigo-600">{editData?.id || 'P-DRAFT'}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">Cycle: {new Date().getFullYear()}</p>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-6 flex-1">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Billing Recipient</h4>
                                <p className="font-bold text-gray-900 text-sm">{form.client || '—'}</p>
                                <p className="text-xs font-semibold text-indigo-600 mt-1">{form.project || 'Unassigned Venture'}</p>
                            </div>
                            <div className="text-right">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Maturity Ledger</h4>
                                <p className="font-bold text-gray-900 text-sm">{form.due || 'Date Not Set'}</p>
                                <p className="text-xs font-semibold text-gray-500 mt-1">Net Provision: {form.terms}</p>
                            </div>
                        </div>

                        {/* List Preview */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Summary of Services</h4>
                            <div className="space-y-2">
                                {form.items.map((it, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <div className="flex-1 pr-4">
                                            <p className="font-bold text-gray-900 truncate max-w-[200px]">{it.desc || `Item Part ${i + 1}`}</p>
                                            <p className="text-xs font-medium text-gray-500 mt-0.5">{it.qty} Unit(s) at ₹{it.rate}</p>
                                        </div>
                                        <span className="font-bold text-gray-900">₹{lineGross(it).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Totals Section */}
                    <div className="relative z-10 mt-6 pt-6 border-t border-gray-200 space-y-2">
                        <div className="flex justify-between text-sm font-semibold text-gray-500">
                            <span>Subtotal Provision</span>
                            <span className="text-gray-900">₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-emerald-600">
                            <span>Cumulative GST</span>
                            <span>₹{totalTax.toLocaleString()}</span>
                        </div>
                        {discAmount > 0 && (
                            <div className="flex justify-between text-sm font-semibold text-rose-500">
                                <span>Incentive Discount ({form.discount}%)</span>
                                <span>-₹{discAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200">
                            <span className="text-sm font-bold text-gray-900">Total Settlement</span>
                            <span className="text-2xl font-bold text-indigo-600">₹{grandTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="relative z-10 mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-start gap-3">
                        <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-indigo-900 font-medium leading-relaxed">
                            This is a digital representation of the fiscal ledger entry. Once transmitted, the final PDF will include cryptographic seal and organizational stamps.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
