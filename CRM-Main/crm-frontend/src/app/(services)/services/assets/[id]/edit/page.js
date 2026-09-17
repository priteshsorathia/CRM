"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Check,
    Save,
    Trash2,
    ShieldCheck,
    Zap,
    Cpu,
    Briefcase,
    Tag,
    AlertCircle,
    Calendar,
    CreditCard
} from 'lucide-react';
import apiClient from '@/utils/apiClient';
import { toast } from 'sonner';

export default function EditAssetPage() {
    const { id: assetId } = useParams();
    const router = useRouter();
    const [asset, setAsset] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        category: '',
        vendor: '',
        serialNumber: '',
        cost: '',
        purchaseDate: '',
        warrantyExpiry: '',
        condition: '',
        status: ''
    });

    useEffect(() => {
        const fetchAsset = async () => {
            try {
                const response = await apiClient.get(`/api/assets/${assetId}`);
                if (response.data.success) {
                    const found = response.data.data;
                    setAsset(found);
                    setForm({
                        name: found.name,
                        category: found.category,
                        vendor: found.vendor || '',
                        serialNumber: found.serialNumber || '',
                        cost: found.cost || '',
                        purchaseDate: found.purchaseDate ? new Date(found.purchaseDate).toISOString().split('T')[0] : '',
                        warrantyExpiry: found.warrantyExpiry ? new Date(found.warrantyExpiry).toISOString().split('T')[0] : '',
                        condition: found.condition,
                        status: found.status
                    });
                }
            } catch (error) {
                console.error('Error fetching asset:', error);
                toast.error('Failed to load asset details');
            }
        };

        if (assetId) {
            fetchAsset();
        }
    }, [assetId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await apiClient.put(`/api/assets/${assetId}`, {
                ...form,
                cost: form.cost ? parseFloat(form.cost) : null,
                purchaseDate: form.purchaseDate ? new Date(form.purchaseDate) : null,
                warrantyExpiry: form.warrantyExpiry ? new Date(form.warrantyExpiry) : null
            });
            if (response.data.success) {
                toast.success('Asset updated successfully');
                router.push(`/services/assets/${assetId}`);
            }
        } catch (error) {
            console.error('Error updating asset:', error);
            toast.error(error.response?.data?.error || 'Failed to update asset');
        } finally {
            setLoading(false);
        }
    };

    if (!asset) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const inputCls = "w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 transition-all text-sm font-black";

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50/30 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-12 h-12 rounded-[24px] bg-amber-500 flex items-center justify-center text-white shadow-xl shadow-amber-100">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-wide">Modify Asset</h1>
                        <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px] flex items-center gap-2">
                            <span className="text-amber-600">{assetId}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span>Registry Update Portal</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button
                        type="button"
                        onClick={() => router.push('/services/assets')}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100 group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Tag size={20} /></div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Asset Definition</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Formal Name</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Dell Latitude 7490" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Serial Identifier</label>
                                <input value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} className={inputCls} placeholder="S/N: 123-ABC" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Original Vendor</label>
                                <input value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })} className={inputCls} placeholder="Manufacturer Name" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Inventory Category</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
                                    {['Laptop', 'Mobile', 'Monitor', 'License', 'Server', 'Furniture'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Condition</label>
                                <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} className={inputCls}>
                                    {['New', 'Excellent', 'Used', 'Damaged', 'Serviceable'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CreditCard size={20} /></div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Procurement Meta</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Acquisition Cost</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                    <input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className={`${inputCls} pl-8 font-black`} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Purchase Date</label>
                                <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} className={inputCls} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-sm space-y-8 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 mb-8 text-gray-900">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ShieldCheck size={18} /></div>
                                Integrity Panel
                            </h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Live Status</label>
                                    <select
                                        value={form.status}
                                        onChange={e => setForm({ ...form, status: e.target.value })}
                                        className={inputCls}
                                    >
                                        {['Available', 'Assigned', 'Maintenance', 'Expiring', 'Retired'].map(s => <option key={s} className="text-gray-900">{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Warranty Expiry Date</label>
                                    <input
                                        type="date"
                                        value={form.warrantyExpiry}
                                        onChange={e => setForm({ ...form, warrantyExpiry: e.target.value })}
                                        className={inputCls}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 relative z-10">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 active:scale-95 transition-all outline-none"
                            >
                                {loading ? 'Commiting Data...' : <><Save size={18} /> Update Registry</>}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-sm"><AlertCircle size={20} /></div>
                        <div>
                            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none mb-1.5">Compliance Impact</h4>
                            <p className="text-[10px] text-gray-500 font-bold leading-relaxed px-1">
                                Updating procurement cost or purchase date will automatically recalibrate the depreciation forecast for the next financial cycle.
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
