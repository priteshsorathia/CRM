"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    FileText,
    Save,
    ShieldCheck,
    Lock,
    X,
    FolderPlus
} from 'lucide-react';
import { initialClients } from '../../../../../data/clientDummyData';

export default function EditDocumentPage() {
    const { id: clientId, docId } = useParams();
    const router = useRouter();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: 'Master Service Agreement (MSA)',
        category: 'Legal',
        description: 'Standard version with Q1 amendments.',
        visibility: 'Restricted'
    });

    useEffect(() => {
        const found = initialClients.find(c => c.id === clientId);
        if (found) setClient(found);
    }, [clientId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push(`/services/clients/${clientId}/documents`);
        }, 1200);
    };

    if (!client) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const inputCls = "w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 transition-all text-sm font-bold";

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors w-fit group"
                >
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Vault</span>
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Edit Meta</h1>
                        <p className="text-gray-500 font-bold mt-1">
                            Modifying record <span className="text-indigo-600">{docId}</span>
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100">
                            <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm">
                                <FileText size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Linked File</p>
                                <p className="text-sm font-black text-gray-900">msa_v1.2_final.pdf</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
                                    {['Legal', 'Internal', 'Creative'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                                <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`${inputCls} resize-none`} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-indigo-900 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between min-h-[350px]">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-wider">Access</h3>
                            </div>
                            <div className="space-y-2">
                                {['Restricted', 'Shared'].map(v => (
                                    <div
                                        key={v}
                                        onClick={() => setForm({ ...form, visibility: v })}
                                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${form.visibility === v ? 'bg-white text-indigo-900 border-white' : 'bg-white/5 border-white/10 text-indigo-200'
                                            }`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-widest">{v}</span>
                                        {form.visibility === v && <ShieldCheck size={16} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-white text-indigo-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mt-8"
                        >
                            {loading ? 'Saving...' : <><Save size={18} /> Update Meta</>}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
