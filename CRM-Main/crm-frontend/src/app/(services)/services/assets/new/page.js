"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Check,
    Save,
    Package,
    ShieldCheck,
    Zap,
    Cpu,
    Briefcase,
    Tag,
    AlertCircle,
    Calendar,
    CreditCard,
    Plus,
    CheckCircle2
} from 'lucide-react';
import apiClient from '@/utils/apiClient';
import { toast } from 'sonner';

export default function RegisterAssetPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        category: 'Laptop',
        vendor: '',
        serialNumber: '',
        cost: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        warrantyExpiry: '',
        condition: 'New',
        status: 'Available'
    });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // If user hits Enter or submits on Step 1 or 2, just advance the step
        if (step < 3) {
            setStep(step + 1);
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.post('/api/assets', form);
            if (response.data.success) {
                toast.success('Asset registered successfully!');
                router.push('/services/assets');
            } else {
                toast.error(response.data.error || 'Failed to register asset');
            }
        } catch (error) {
            console.error('Error registering asset:', error);
            const msg = error.response?.data?.error || 'Server error occurred';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickSave = async () => {
        if (!form.name) {
            toast.error("Please enter an asset name");
            return;
        }
        setLoading(true);
        try {
            const response = await apiClient.post('/api/assets', form);
            if (response.data.success) {
                toast.success('Asset saved quickly!');
                router.push('/services/assets');
            } else {
                toast.error(response.data.error || 'Failed to save asset');
            }
        } catch (error) {
            toast.error('Server error occurred');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 transition-all text-sm font-black shadow-sm";

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors w-fit group"
                >
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Back to Registry</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-12 h-12 rounded-[24px] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                            <Package size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase tracking-wide">Register Asset</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 relative z-10 transition-all hover:scale-105">
                        <CheckCircle2 size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Phase {step} of 3</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-indigo-100/10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/40 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                <div className="p-10 space-y-8 relative z-10">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 pb-6 border-b border-gray-50">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><Tag size={24} /></div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-none">Asset Identification</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Foundational Specifications</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 leading-none">Asset Formal Name</label>
                                    <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="e.g. MacBook Pro M3 (14-inch)" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 leading-none">Vendor / Brand</label>
                                    <input value={form.vendor} onChange={e => set('vendor', e.target.value)} className={inputCls} placeholder="e.g. Apple Inc." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 leading-none">Category Designation</label>
                                    <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls}>
                                        {['Laptop', 'Monitor', 'Mobile', 'License', 'Server', 'Furniture'].map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 pb-6 border-b border-gray-50">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><Cpu size={24} /></div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-none">Technical Mapping</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Logistics & Compliance</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 leading-none">Serial identifier</label>
                                    <input value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} className={inputCls} placeholder="S/N: XXX-XXX-XXX" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 leading-none">Asset Condition</label>
                                    <select value={form.condition} onChange={e => set('condition', e.target.value)} className={inputCls}>
                                        {['New', 'Refurbished', 'Used', 'Serviceable'].map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 leading-none">Current State</label>
                                    <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                                        {['Available', 'Maintenance', 'Expired'].map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 pb-6 border-b border-gray-50">
                                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100"><CreditCard size={24} /></div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 leading-none">Procurement & Warranty</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Capital Ledger Integration</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 leading-none">Purchase Price (INR)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                        <input type="number" value={form.cost} onChange={e => set('cost', e.target.value)} className={`${inputCls} pl-8 font-black`} placeholder="45,000" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 leading-none">Acquisition Date</label>
                                    <input type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} className={inputCls} />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 leading-none">Warranty Expiry Threshold</label>
                                    <input type="date" value={form.warrantyExpiry} onChange={e => set('warrantyExpiry', e.target.value)} className={inputCls} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-10 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all font-bold"
                        >
                            Rewind Phase
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all font-bold"
                        >
                            Cancel Enrollment
                        </button>
                    )}

                    <div className="flex items-center gap-3">
                        {step === 1 && (
                            <button
                                type="button"
                                onClick={handleQuickSave}
                                className="px-6 py-3 border border-indigo-200 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all font-bold"
                            >
                                Quick Save
                            </button>
                        )}
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                className="px-10 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2 font-bold"
                            >
                                Advance Phase
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-10 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center gap-2 font-bold"
                            >
                                {loading ? 'Commiting...' : <><Save size={18} /> Complete Registration</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-start gap-4 p-8 bg-indigo-50/50 rounded-[40px] border border-indigo-100">
                <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm"><AlertCircle size={20} /></div>
                <div>
                    <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-none mb-1.5">Note on CapEx Entry</h4>
                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                        Registered assets will be immediately available in the inventory registry for personnel allocation. Ensure serial number accuracy for compliance auditing.
                    </p>
                </div>
            </div>
        </div>
    );
}

const Building2 = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
    </svg>
);
