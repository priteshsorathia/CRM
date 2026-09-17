"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    AlertTriangle,
    Trash2,
    ShieldAlert,
    Package,
    Tag,
    AlertCircle
} from 'lucide-react';
import { initialAssets } from '../../../data/assetDummyData';

export default function DeleteAssetPage() {
    const { id: assetId } = useParams();
    const router = useRouter();
    const [asset, setAsset] = useState(null);
    const [confirmId, setConfirmId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const found = initialAssets.find(a => a.id === assetId);
        if (found) setAsset(found);
    }, [assetId]);

    const handleDelete = () => {
        if (confirmId !== asset.id) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push('/services/assets');
        }, 1500);
    };

    if (!asset) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    const isConfirmed = confirmId === asset.id;

    return (
        <div className="max-w-xl mx-auto py-20 px-4">
            {/* Header */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors mb-8 group"
            >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Back to Asset</span>
            </button>

            <div className="bg-white rounded-[40px] border border-rose-100 shadow-xl shadow-rose-100/20 overflow-hidden text-center p-12">
                <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <ShieldAlert size={40} />
                </div>

                <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2 uppercase tracking-wide">Decommission Asset?</h1>
                <p className="text-gray-500 font-bold mb-8 text-sm">
                    Purging registry entry for <span className="text-rose-600 font-black tracking-tight">{asset.name}</span>.
                    This will remove all associated warranty data and historical audit logs.
                </p>

                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-8 flex items-center gap-4 text-left">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-rose-600 font-black text-lg shadow-sm">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Asset ID: {asset.id}</p>
                        <p className="text-sm font-black text-gray-900 leading-none">{asset.category}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Vendor: {asset.vendor}</p>
                    </div>
                </div>

                <div className="space-y-4 text-left">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type Asset ID to confirm purge</label>
                        <input
                            type="text"
                            placeholder={asset.id}
                            value={confirmId}
                            onChange={(e) => setConfirmId(e.target.value)}
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-center text-sm font-black focus:outline-none focus:ring-4 focus:ring-rose-50 focus:border-rose-200 transition-all placeholder:text-gray-200 tracking-[0.2em]"
                        />
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleDelete}
                            disabled={!isConfirmed || loading}
                            className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 ${isConfirmed && !loading
                                ? 'bg-rose-600 text-white hover:bg-rose-700 hover:scale-[1.02] shadow-rose-100'
                                : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
                                }`}
                        >
                            {loading ? 'Purging Registry...' : <><Trash2 size={18} /> Permanent Deletion</>}
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="w-full py-4 bg-white text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-50 transition-all font-bold"
                        >
                            Abort Decommissioning
                        </button>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-center gap-2 text-[8px] font-black text-rose-400 uppercase tracking-widest">
                    <AlertCircle size={12} /> Permanent Action - Irreversible Process
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
