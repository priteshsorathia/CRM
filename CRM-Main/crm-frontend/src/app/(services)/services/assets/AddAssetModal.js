"use client";
import React, { useState } from 'react';
import { X } from 'lucide-react';
import apiClient from '@/utils/apiClient';
import { toast } from 'sonner';

const Field = ({ label, required, children }) => (
    <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-700">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
        {children}
    </div>
);

const inputCls = (err) => `w-full px-3.5 py-2.5 rounded-lg border ${err ? 'border-red-400 bg-red-50 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'} focus:outline-none focus:ring-2 text-sm text-gray-800`;

export default function AddAssetModal({ isOpen, onClose, onAdd }) {
    const [form, setForm] = useState({ name: '', category: '', brand: '', serialNumber: '', purchaseDate: '', cost: '', vendor: '', warrantyExpiry: '', condition: 'New', status: 'Available' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Asset name is required';
        if (!form.category) e.category = 'Category is required';
        if (!form.brand.trim()) e.brand = 'Brand / Model is required';
        if (!form.purchaseDate) e.purchaseDate = 'Purchase date is required';
        if (!form.serialNumber.trim()) e.serialNumber = 'Serial number is required';
        if (!form.cost) {
            e.cost = 'Cost is required';
        } else if (isNaN(Number(form.cost)) || Number(form.cost) <= 0) {
            e.cost = 'Enter a valid numeric cost';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        setLoading(true);
        try {
            const payload = {
                ...form,
                cost: Number(form.cost),
                vendor: form.vendor || form.brand 
            };
            
            const response = await apiClient.post('/api/assets', payload);
            if (response.data.success) {
                toast.success('Asset registered successfully');
                onAdd(response.data.data);
                onClose();
                setForm({ name: '', category: '', brand: '', serialNumber: '', purchaseDate: '', cost: '', vendor: '', warrantyExpiry: '', condition: 'New', status: 'Available' });
                setErrors({});
            }
        } catch (error) {
            console.error('Error creating asset:', error);
            toast.error(error.response?.data?.error || 'Failed to register asset');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="font-bold text-gray-900 text-lg">Register New Asset</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Add hardware or software to inventory</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"><X size={18} /></button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Asset Name" required>
                            <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls(errors.name)} placeholder="e.g. MacBook Pro M3" />
                            {errors.name && <span className="text-xs text-red-500 font-medium">{errors.name}</span>}
                        </Field>

                        <Field label="Category" required>
                            <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls(errors.category)}>
                                <option value="">Select category</option>
                                {['Laptop', 'Mobile', 'Server', 'License', 'Hardware', 'Other'].map(o => <option key={o}>{o}</option>)}
                            </select>
                            {errors.category && <span className="text-xs text-red-500 font-medium">{errors.category}</span>}
                        </Field>

                        <Field label="Brand / Model" required>
                            <input value={form.brand} onChange={e => set('brand', e.target.value)} className={inputCls(errors.brand)} placeholder="e.g. Apple MacBook Pro" />
                            {errors.brand && <span className="text-xs text-red-500 font-medium">{errors.brand}</span>}
                        </Field>

                        <Field label="Serial Number" required>
                            <input value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} className={inputCls(errors.serialNumber)} placeholder="Unique serial number" />
                            {errors.serialNumber && <span className="text-xs text-red-500 font-medium">{errors.serialNumber}</span>}
                        </Field>

                        <Field label="Purchase Date" required>
                            <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} className={inputCls(errors.purchaseDate)} />
                            {errors.purchaseDate && <span className="text-xs text-red-500 font-medium">{errors.purchaseDate}</span>}
                        </Field>

                        <Field label="Purchase Cost (₹)" required>
                            <input type="number" value={form.cost} onChange={e => set('cost', e.target.value)} className={inputCls(errors.cost)} placeholder="e.g. 120000" min="0" />
                            {errors.cost && <span className="text-xs text-red-500 font-medium">{errors.cost}</span>}
                        </Field>

                        <Field label="Vendor Name">
                            <input value={form.vendor} onChange={e => set('vendor', e.target.value)} className={inputCls(false)} placeholder="Optional" />
                        </Field>

                        <Field label="Warranty Expiry Date">
                            <input type="date" value={form.warrantyExpiry} onChange={e => set('warrantyExpiry', e.target.value)} className={inputCls(false)} />
                        </Field>

                        <Field label="Condition">
                            <select value={form.condition} onChange={e => set('condition', e.target.value)} className={inputCls(false)}>
                                {['New', 'Used', 'Damaged', 'Refurbished'].map(o => <option key={o}>{o}</option>)}
                            </select>
                        </Field>

                        <Field label="Initial Status">
                            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls(false)}>
                                {['Available', 'Maintenance'].map(o => <option key={o}>{o}</option>)}
                            </select>
                        </Field>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors">Save Asset</button>
                </div>
            </div>
        </div>
    );
}
