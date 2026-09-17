"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Building2,
    User,
    Mail,
    Phone,
    CreditCard,
    Calendar,
    Save,
    X,
    Briefcase,
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';

export default function NewClientPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        company: '',
        contact: '',
        email: '',
        phone: '',
        gst: '',
        billing: 'Monthly',
        contractStart: '',
        contractEnd: '',
        status: 'Active'
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.company.trim()) e.company = 'Company name is required';
        if (!form.contact.trim()) e.contact = 'Contact person is required';
        if (!form.email.trim()) e.email = 'Email address is required';
        if (!form.phone.trim()) e.phone = 'Phone number is required';
        if (!form.gst.trim()) e.gst = 'GST Number is required';
        if (!form.contractStart) e.contractStart = 'Start date is required';
        if (!form.contractEnd) e.contractEnd = 'End date is required';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const { getApiBase } = require('@/utils/apiBase');
            const res = await fetch(`${getApiBase()}/api/services/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                router.push('/services/clients');
            } else {
                alert(data.message || 'Error creating client');
            }
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = (err) => `w-full px-4 py-2.5 rounded-xl border ${err ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-300 bg-white focus:ring-indigo-100'} focus:outline-none focus:ring-4 focus:border-indigo-500 transition-all text-sm font-medium text-gray-900`;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors w-fit group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Clients</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Client</h1>
                            <p className="text-gray-500 font-medium mt-1 text-sm flex items-center gap-2">
                                <span>Create a new client profile</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Basic Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
                            <Building2 className="text-indigo-600" size={20} />
                            <h3 className="text-base font-bold text-gray-900">Company Details</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Company Name <span className="text-red-500">*</span></label>
                                <input name="company" value={form.company} onChange={handleChange} className={inputCls(errors.company)} placeholder="e.g. Acme Corporation" />
                                {errors.company && <p className="text-xs font-medium text-red-500">{errors.company}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">GST Number <span className="text-red-500">*</span></label>
                                <input name="gst" value={form.gst} onChange={handleChange} className={inputCls(errors.gst)} placeholder="e.g. 27AABCU9603R1ZX" />
                                {errors.gst && <p className="text-xs font-medium text-red-500">{errors.gst}</p>}
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100"></div>

                        <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
                            <User className="text-indigo-600" size={20} />
                            <h3 className="text-base font-bold text-gray-900">Primary Contact</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Contact Person <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input name="contact" value={form.contact} onChange={handleChange} className={`${inputCls(errors.contact)} pl-10`} placeholder="e.g. John Doe" />
                                </div>
                                {errors.contact && <p className="text-xs font-medium text-red-500">{errors.contact}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Email Address <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input name="email" value={form.email} onChange={handleChange} className={`${inputCls(errors.email)} pl-10`} placeholder="johndoe@company.com" />
                                </div>
                                {errors.email && <p className="text-xs font-medium text-red-500">{errors.email}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Phone Number <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input name="phone" value={form.phone} onChange={handleChange} className={`${inputCls(errors.phone)} pl-10`} placeholder="+91 90000 00000" />
                                </div>
                                {errors.phone && <p className="text-xs font-medium text-red-500">{errors.phone}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Status</label>
                                <select name="status" value={form.status} onChange={handleChange} className={inputCls()}>
                                    {['Active', 'Expiring', 'Inactive'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Contract Info */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
                            <Calendar className="text-indigo-600" size={20} />
                            <h3 className="text-base font-bold text-gray-900">Contract & Billing</h3>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Billing Cycle</label>
                                <select name="billing" value={form.billing} onChange={handleChange} className={inputCls()}>
                                    {['Monthly', 'Hourly', 'Fixed', 'Milestone'].map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Contract Start Date <span className="text-red-500">*</span></label>
                                <input type="date" name="contractStart" value={form.contractStart} onChange={handleChange} className={inputCls(errors.contractStart)} />
                                {errors.contractStart && <p className="text-xs font-medium text-red-500">{errors.contractStart}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Contract Expiry Date <span className="text-red-500">*</span></label>
                                <input type="date" name="contractEnd" value={form.contractEnd} onChange={handleChange} className={inputCls(errors.contractEnd)} />
                                {errors.contractEnd && <p className="text-xs font-medium text-red-500">{errors.contractEnd}</p>}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {loading ? 'Saving...' : <><Save size={18} /> Save Client</>}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
