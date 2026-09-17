"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Building2,
    User,
    Mail,
    Phone,
    CreditCard,
    Calendar,
    Save,
    ShieldCheck,
    Briefcase,
    Trash2
} from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';

const inputCls = (err) =>
    `w-full px-4 py-2.5 rounded-xl border ${err ? 'border-red-400 bg-red-50' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 transition-all shadow-sm`;

const Label = ({ children }) => <label className="text-sm font-bold text-gray-700 mb-1.5 block uppercase tracking-wider text-[10px]">{children}</label>;

export default function EditClientPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const token = localStorage.getItem('authToken') || localStorage.getItem('token');
                const { getApiBase } = require('@/utils/apiBase');
                const res = await fetch(`${getApiBase()}/api/services/clients`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    const foundClient = data.clients.find(c => c.id.toString() === id.toString() || c.clientId === id);
                    if (foundClient) {
                        setForm({
                            ...foundClient,
                            contractStart: foundClient.contractStart ? new Date(foundClient.contractStart).toISOString().split('T')[0] : '',
                            contractEnd: foundClient.contractEnd ? new Date(foundClient.contractEnd).toISOString().split('T')[0] : ''
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching client details:", error);
            }
        };
        fetchClient();
    }, [id]);

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
        if (!form.gst?.trim()) e.gst = 'GST Number is required';
        if (!form.contractStart) e.contractStart = 'Start date is required';
        if (!form.contractEnd) e.contractEnd = 'End date is required';

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const { getApiBase } = require('@/utils/apiBase');
            const res = await fetch(`${getApiBase()}/api/services/clients/${form.id}`, {
                method: 'PUT',
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
                alert(data.message || 'Error updating client');
            }
        } catch (error) {
            console.error('Error updating client:', error);
            alert('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this client? This action cannot be undone and may affect related projects/invoices.')) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            const { getApiBase } = require('@/utils/apiBase');
            const res = await fetch(`${getApiBase()}/api/services/clients/${form.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                router.push('/services/clients');
            } else {
                alert(data.message || 'Error deleting client');
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            alert('Failed to delete client');
        } finally {
            setLoading(false);
        }
    };

    if (!form) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20 mt-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Title row */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all bg-white flex-shrink-0"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Edit Client Profile</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] truncate">{form.clientId} • {form.company}</p>
                    </div>
                </div>
                {/* Action buttons — full-width on mobile, auto on sm+ */}
                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors border border-gray-200 rounded-xl bg-white"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                    >
                        <Save size={16} />
                        {loading ? 'Saving...' : 'Update Client'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Form Details */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50 mb-2">
                            <Building2 className="text-indigo-600" size={20} />
                            <h3 className="font-bold text-gray-900">Entity Information</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Label>Company Legal Name</Label>
                                <input
                                    name="company"
                                    className={inputCls(errors.company)}
                                    value={form.company}
                                    onChange={handleChange}
                                />
                                {errors.company && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.company}</p>}
                            </div>
                            <div>
                                <Label>GST Registration No.</Label>
                                <input
                                    name="gst"
                                    className={inputCls(errors.gst)}
                                    value={form.gst}
                                    onChange={handleChange}
                                />
                                {errors.gst && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.gst}</p>}
                            </div>
                            <div>
                                <Label>Billing Cycle</Label>
                                <select
                                    name="billing"
                                    className={inputCls()}
                                    value={form.billing}
                                    onChange={handleChange}
                                >
                                    {['Monthly', 'Hourly', 'Fixed', 'Milestone'].map(b => <option key={b}>{b}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                            <div>
                                <Label>Primary Contact Person</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        name="contact"
                                        className={`${inputCls(errors.contact)} pl-11`}
                                        value={form.contact}
                                        onChange={handleChange}
                                    />
                                </div>
                                {errors.contact && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.contact}</p>}
                            </div>
                            <div>
                                <Label>Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        name="email"
                                        className={`${inputCls(errors.email)} pl-11`}
                                        value={form.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                {errors.email && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.email}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <Label>Mobile / Phone No.</Label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        name="phone"
                                        className={`${inputCls(errors.phone)} pl-11`}
                                        value={form.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                {errors.phone && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.phone}</p>}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Side: Contract & Status */}
                <div className="space-y-6">
                    <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50 mb-2">
                            <Calendar className="text-emerald-600" size={20} />
                            <h3 className="font-bold text-gray-900">Contract & Status</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="relative">
                                <Label>Contract Start</Label>
                                <Calendar className="absolute left-4 top-10 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    name="contractStart"
                                    className={`${inputCls(errors.contractStart)} pl-11`}
                                    value={form.contractStart}
                                    onChange={handleChange}
                                />
                                {errors.contractStart && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.contractStart}</p>}
                            </div>
                            <div className="relative">
                                <Label>Contract Expiry</Label>
                                <Calendar className="absolute left-4 top-10 text-gray-400" size={16} />
                                <input
                                    type="date"
                                    name="contractEnd"
                                    className={`${inputCls(errors.contractEnd)} pl-11`}
                                    value={form.contractEnd}
                                    onChange={handleChange}
                                />
                                {errors.contractEnd && <p className="text-[10px] font-bold text-red-500 mt-1">{errors.contractEnd}</p>}
                            </div>
                            <div>
                                <Label>Account Status</Label>
                                <select
                                    name="status"
                                    className={inputCls()}
                                    value={form.status}
                                    onChange={handleChange}
                                >
                                    {['Active', 'Expiring', 'Inactive'].map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    <PermissionWrapper module="CLIENTS" action="DELETE">
                        <section 
                            className="bg-white p-6 rounded-3xl border-2 border-dashed border-rose-100 hover:border-rose-200 transition-all group cursor-pointer"
                            onClick={handleDelete}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                                    <Trash2 size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">Delete Client</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Permanent Action</p>
                                </div>
                            </div>
                        </section>
                    </PermissionWrapper>
                </div>
            </div>
        </div>
    );
}
