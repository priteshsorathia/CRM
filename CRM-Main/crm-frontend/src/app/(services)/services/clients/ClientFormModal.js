"use client";
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const BILLING_TYPES = ['Hourly', 'Monthly', 'Fixed', 'Milestone'];

const inputCls = (err) =>
    `w-full px-3.5 py-2.5 rounded-lg border ${err ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-300 focus:ring-indigo-500'} focus:outline-none focus:ring-2 text-sm text-gray-800`;

const Field = ({ label, required, error, children }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">
            {label}{required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {children}
        {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
);

const blankForm = {
    company: '', contact: '', phone: '', email: '', gst: '',
    billing: 'Monthly', contractStart: '', contractEnd: '',
    status: 'Active', notes: '',
};

export default function ClientFormModal({ isOpen, onClose, onSave, editData }) {
    const [form, setForm] = useState(blankForm);
    const [errors, setErrors] = useState({});
    const isEdit = !!editData;

    useEffect(() => {
        if (isOpen) {
            setForm(editData ? { ...blankForm, ...editData } : blankForm);
            setErrors({});
        }
    }, [isOpen, editData]);

    if (!isOpen) return null;

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.company.trim()) e.company = 'Company name is required';
        if (!form.contact.trim()) e.contact = 'Contact person is required';
        if (!form.email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
        if (!form.phone.trim()) e.phone = 'Phone is required';
        if (!form.contractStart) e.contractStart = 'Contract start date is required';
        if (!form.contractEnd) e.contractEnd = 'Contract end date is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSave({ ...form, id: editData?.id || `CLT-${2000 + Math.floor(Math.random() * 900)}`, revenue: editData?.revenue || 0 });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white rounded-t-2xl">
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg">{isEdit ? 'Edit Client' : 'Add New Client'}</h2>
                        <p className="text-sm text-gray-500 mt-1">{isEdit ? 'Update the client details below.' : 'Register a new client to start managing their contract.'}</p>
                    </div>
                </div>

                {/* Form */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-8 bg-gray-50/50">
                    {/* Section: Company Info */}
                    <div>
                        <p className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Company Information</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Company Name" required error={errors.company}>
                                <input value={form.company} onChange={e => set('company', e.target.value)} className={inputCls(errors.company)} placeholder="e.g. Acme Corp" />
                            </Field>
                            <Field label="Contact Person" required error={errors.contact}>
                                <input value={form.contact} onChange={e => set('contact', e.target.value)} className={inputCls(errors.contact)} placeholder="Full name" />
                            </Field>
                            <Field label="Email Address" required error={errors.email}>
                                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls(errors.email)} placeholder="contact@company.com" />
                            </Field>
                            <Field label="Phone Number" required error={errors.phone}>
                                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls(errors.phone)} placeholder="+91 98765 43210" />
                            </Field>
                            <Field label="GST Number">
                                <input value={form.gst} onChange={e => set('gst', e.target.value)} className={inputCls(false)} placeholder="e.g. 27AABCU9603R1ZX" />
                            </Field>
                            <Field label="Status">
                                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls(false)}>
                                    {['Active', 'Expiring', 'Inactive'].map(s => <option key={s}>{s}</option>)}
                                </select>
                            </Field>
                        </div>
                    </div>

                    {/* Section: Contract Details */}
                    <div>
                        <p className="text-sm font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Contract Details</p>

                        {/* Billing Type — Segmented Buttons */}
                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-700 block mb-2">Billing Type</label>
                            <div className="flex gap-2 flex-wrap">
                                {BILLING_TYPES.map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => set('billing', type)}
                                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${form.billing === type
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                            : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300 hover:text-indigo-600'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Contract Start Date" required error={errors.contractStart}>
                                <input type="date" value={form.contractStart} onChange={e => set('contractStart', e.target.value)} className={inputCls(errors.contractStart)} />
                            </Field>
                            <Field label="Contract End Date" required error={errors.contractEnd}>
                                <input type="date" value={form.contractEnd} onChange={e => set('contractEnd', e.target.value)} className={inputCls(errors.contractEnd)} />
                            </Field>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-sm font-semibold text-gray-700 block mb-1.5">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                        <textarea
                            rows={3}
                            value={form.notes}
                            onChange={e => set('notes', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 resize-none"
                            placeholder="Additional notes or remarks..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-white rounded-b-2xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-sm transition-colors">
                        {isEdit ? 'Update Client' : 'Save Client'}
                    </button>
                </div>
            </div>
        </div>
    );
}
