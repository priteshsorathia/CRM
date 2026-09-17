"use client";
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    AlertTriangle,
    Trash2,
    FileText,
    ShieldAlert
} from 'lucide-react';

export default function DeleteDocumentPage() {
    const { id: clientId, docId } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleDelete = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push(`/services/clients/${clientId}/documents`);
        }, 1200);
    };

    return (
        <div className="max-w-xl mx-auto py-20 px-4">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors mb-8 group"
            >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold uppercase tracking-widest">Back to Vault</span>
            </button>

            <div className="bg-white rounded-[40px] border border-rose-100 shadow-xl shadow-rose-100/20 overflow-hidden text-center p-12">
                <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <ShieldAlert size={40} />
                </div>

                <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Purge Document?</h1>
                <p className="text-gray-500 font-bold mb-8">
                    Removing <span className="text-rose-600 font-black">{docId}</span> from the vault.
                    This file will be permanently deleted from the encrypted storage.
                </p>

                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-8 flex items-center gap-4 text-left">
                    <div className="p-3 bg-white rounded-xl border border-gray-100 text-gray-400">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Type</p>
                        <p className="text-sm font-black text-gray-900">Encrypted PDF Asset</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-100 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Purging...' : <><Trash2 size={18} /> Confirm Deletion</>}
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                        Keep in Vault
                    </button>
                </div>
            </div>
        </div>
    );
}
