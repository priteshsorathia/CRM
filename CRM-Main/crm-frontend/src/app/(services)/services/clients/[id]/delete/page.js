"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    AlertTriangle,
    Trash2,
    ShieldAlert,
    Building2,
    X
} from 'lucide-react';
import { initialClients } from '../../../data/clientDummyData';

export default function DeleteClientPage() {
    const { id } = useParams();
    const router = useRouter();
    const [client, setClient] = useState(null);
    const [confirmName, setConfirmName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const found = initialClients.find(c => c.id === id);
        if (found) setClient(found);
    }, [id]);

    if (!client) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const handleDelete = () => {
        if (confirmName !== client.company) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push('/services/clients');
        }, 1500);
    };

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors mb-8 group"
            >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold uppercase tracking-widest">Back to Profile</span>
            </button>

            <div className="bg-white rounded-[40px] border border-rose-100 shadow-xl shadow-rose-100/20 overflow-hidden">
                <div className="bg-rose-50 p-8 border-b border-rose-100 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-rose-600 shadow-sm">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-rose-900 tracking-tight">Delete Client Account</h1>
                        <p className="text-rose-600/70 font-bold text-sm">This action is permanent and cannot be undone.</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Client to be removed</p>
                            <p className="text-lg font-black text-gray-900">{client.company}</p>
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-0.5">{client.id}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-rose-600">
                            <ShieldAlert size={18} />
                            <h3 className="font-black text-sm uppercase tracking-wider">Warning: Data Loss Imminent</h3>
                        </div>
                        <ul className="space-y-3">
                            {[
                                'All active projects will be archived',
                                'Past invoices will be inaccessible',
                                'Legal documents will be permanently purged',
                                'Client portal access will be revoked immediately'
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                    <X size={14} className="text-gray-300" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                            Type <span className="text-gray-900 font-black">"{client.company}"</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl border-2 border-rose-50 bg-rose-50/10 focus:outline-none focus:ring-4 focus:ring-rose-100 focus:border-rose-500 transition-all text-gray-900 font-black tracking-tight"
                            placeholder="Confirm client name"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                            onClick={() => router.back()}
                            className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={confirmName !== client.company || loading}
                            className={`flex-[2] py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${confirmName === client.company && !loading
                                    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200 active:scale-95'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                }`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><Trash2 size={18} /> Permanently Delete</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
