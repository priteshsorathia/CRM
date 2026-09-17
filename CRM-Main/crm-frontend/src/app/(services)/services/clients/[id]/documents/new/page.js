"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Upload,
    ShieldCheck,
    FileText,
    Check,
    X,
    FolderPlus,
    Lock,
    Eye,
    Building2,
    Save
} from 'lucide-react';
import { initialClients } from '../../../../data/clientDummyData';
import { isSvgFile } from '@/utils/fileValidation';

export default function NewClientDocumentPage() {
    const { id: clientId } = useParams();
    const router = useRouter();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [form, setForm] = useState({
        name: '',
        category: 'Legal',
        description: '',
        visibility: 'Restricted'
    });

    useEffect(() => {
        const found = initialClients.find(c => c.id === clientId);
        if (found) setClient(found);
    }, [clientId]);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            if (isSvgFile(selected)) {
                e.target.value = "";
                setFile(null);
                return;
            }
            setFile(selected);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push(`/services/clients/${clientId}/documents`);
        }, 1500);
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
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Upload Credentials</h1>
                        <p className="text-gray-500 font-bold mt-1">
                            Securing documentation for <span className="text-indigo-600">{client.company}</span>
                        </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
                        <Lock size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Vault Secured</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* File Dropzone */}
                    <div className="bg-white p-10 rounded-[40px] border-2 border-dashed border-gray-100 hover:border-indigo-200 transition-all group flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-3xl bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all flex items-center justify-center shadow-sm">
                            {file ? <Check size={32} className="text-emerald-500" /> : <Upload size={32} />}
                        </div>
                        {file ? (
                            <div className="space-y-1">
                                <p className="text-sm font-black text-gray-900">{file.name}</p>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Ready for secure upload</p>
                                <button type="button" onClick={() => setFile(null)} className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-2 hover:underline">Remove File</button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="text-sm font-black text-gray-900">Drag and drop file here</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PDF, DOCX, XLSX (Max 25MB)</p>
                                <label className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                    Browse Files
                                    <input type="file" className="hidden" onChange={handleFileChange} />
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Meta Data */}
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><FileText size={20} /></div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Document Metadata</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Document Display Name</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className={inputCls}
                                    placeholder="e.g. Master Service Agreement 2024"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Storage Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    className={inputCls}
                                >
                                    {['Legal', 'Financial', 'Contractual', 'Internal', 'Client Portal'].map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Internal Description</label>
                            <textarea
                                rows={3}
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                className={`${inputCls} resize-none`}
                                placeholder="Summary of document purpose or critical clauses..."
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Security Card */}
                    <div className="bg-indigo-900 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 flex flex-col gap-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-wider">Access Control</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Permission Level</label>
                                <div className="space-y-2">
                                    {['Restricted', 'Shared', 'Public'].map(lvl => (
                                        <div
                                            key={lvl}
                                            onClick={() => setForm({ ...form, visibility: lvl })}
                                            className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${form.visibility === lvl ? 'bg-white text-indigo-900 border-white' : 'bg-white/5 border-white/10 text-indigo-200 hover:bg-white/10'
                                                }`}
                                        >
                                            <span className="text-xs font-black uppercase tracking-widest">{lvl}</span>
                                            {form.visibility === lvl && <Check size={16} />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !file}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 transition-all ${file && !loading ? 'bg-white text-indigo-950 hover:scale-[1.02]' : 'bg-white/10 text-white/30 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                {loading ? 'Encrypting...' : <><Save size={18} /> Store in Vault</>}
                            </button>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-indigo-600">
                            <Eye size={16} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Audit Trail</h4>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold leading-relaxed px-1">
                            Storage is versioned. Every modification generates a new entry in the activity log with timestamp and user ID.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
