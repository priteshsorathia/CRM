"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, ShieldCheck, CheckCircle2, AlertCircle,
    Layers, Search, Zap, History, Database, Cpu
} from 'lucide-react';

export default function AccountingAuditPage() {
    const router = useRouter();
    const [status, setStatus] = useState('initializing');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const stages = [
            { s: 'Scanning Ledger Nodes...', p: 20 },
            { s: 'Verifying Double-Entry Integrity...', p: 45 },
            { s: 'Validating Asset-Liability Equation...', p: 70 },
            { s: 'Synchronizing with Compliance Standards...', p: 90 },
            { s: 'Audit Finalized. 100% Integrity.', p: 100 }
        ];

        let current = 0;
        const interval = setInterval(() => {
            if (current < stages.length) {
                setStatus(stages[current].s);
                setProgress(stages[current].p);
                current++;
            } else {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-5">
                <button onClick={() => router.back()} className="p-3 rounded-2xl border border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all active:scale-90 bg-white">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <Cpu size={14} className="text-indigo-500" />
                        <span className="text-[10px] font-black tracking-[0.2em] text-indigo-600 uppercase">System Diagnostic</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Ledger Audit Node</h1>
                    <p className="text-sm font-semibold text-gray-400 mt-1 uppercase tracking-widest italic">Verifying financial state across all dimensions</p>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl p-10 lg:p-16 text-center space-y-12">
                <div className="relative">
                    <div className="w-40 h-40 rounded-full border-8 border-gray-50 border-t-indigo-600 animate-spin mx-auto"
                        style={{ animationDuration: '3s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                            <ShieldCheck size={48} />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{status}</h3>
                    <div className="max-w-md mx-auto h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Processing Vector: General Ledger / V3</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-gray-50">
                    <div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 italic">
                        <div className="flex justify-center text-emerald-500 mb-3"><CheckCircle2 size={24} /></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Assets</p>
                        <p className="text-lg font-black text-gray-900 tracking-tight">VERIFIED</p>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 italic">
                        <div className="flex justify-center text-indigo-500 mb-3"><Database size={24} /></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Equilibrium</p>
                        <p className="text-lg font-black text-gray-900 tracking-tight">STABLE</p>
                    </div>
                    <div className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 italic">
                        <div className="flex justify-center text-amber-500 mb-3"><Zap size={24} /></div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Latency</p>
                        <p className="text-lg font-black text-gray-900 tracking-tight">0.04 MS</p>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-950 rounded-[2.5rem] p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute left-0 top-0 h-full w-2 bg-emerald-500" />
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 rounded-2xl bg-white/10 text-emerald-400 border border-white/10 group-hover:rotate-12 transition-transform">
                        <CheckCircle2 size={32} />
                    </div>
                    <div>
                        <h4 className="text-lg font-black tracking-tight">Audit Certificate Issued</h4>
                        <p className="text-sm font-bold opacity-60 uppercase tracking-widest text-indigo-200">System verified on {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <button onClick={() => router.back()} className="px-8 py-4 bg-white text-indigo-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-95">
                    Download Certificate
                </button>
            </div>
        </div>
    );
}

