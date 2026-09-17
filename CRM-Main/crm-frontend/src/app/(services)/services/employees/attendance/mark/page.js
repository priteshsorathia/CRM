"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Clock,
    Save,
    History,
    User,
    ArrowUpRight,
    ArrowDownLeft,
    CheckCircle2,
    AlertCircle,
    Info
} from 'lucide-react';

export default function MarkAttendancePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        employee: '',
        type: 'Check In',
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString().split('T')[0],
        mode: 'Biometric'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push('/services/hrms/staff/attendance');
        }, 1200);
    };

    const inputCls = "w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 transition-all text-sm font-bold shadow-sm";

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors w-fit group"
                >
                    <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Back to Workforce Registry</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/30 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 rounded-[24px] bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-100">
                            <Clock size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase tracking-wide">Manual Verification</h1>
                            <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px] flex items-center gap-2">
                                <span className="text-emerald-600">Attendance Marking</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span>Human Resource Portal</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 relative z-10 transition-all hover:scale-105">
                        <Info size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Override Mode</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 pb-6 border-b border-gray-50">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><User size={24} /></div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Personnel Identity</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Verification Required</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Employee Name / ID</label>
                                <input
                                    value={form.employee}
                                    onChange={e => setForm({ ...form, employee: e.target.value })}
                                    placeholder="e.g. EMP-2024-001"
                                    className={inputCls}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Log Verification Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, type: 'Check In' })}
                                        className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.type === 'Check In' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
                                    >
                                        <ArrowUpRight size={14} /> Check In
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, type: 'Check Out' })}
                                        className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${form.type === 'Check Out' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
                                    >
                                        <ArrowDownLeft size={14} /> Check Out
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Timestamp</label>
                                <div className="relative">
                                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="time"
                                        value={form.time}
                                        onChange={e => setForm({ ...form, time: e.target.value })}
                                        className={`${inputCls} pl-12 font-black`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Authorization Mode</label>
                                <select
                                    value={form.mode}
                                    onChange={e => setForm({ ...form, mode: e.target.value })}
                                    className={inputCls}
                                >
                                    <option>Biometric</option>
                                    <option>RFID Card</option>
                                    <option>Manual Override</option>
                                    <option>Remote Log</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Effective Date</label>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column: Action Panel */}
                <div className="space-y-6">
                    <div className="bg-indigo-900 p-8 rounded-[40px] text-white shadow-xl shadow-indigo-100 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[64px] transition-all -mr-12 -mt-12" />

                        <div className="relative z-10">
                            <h3 className="text-lg font-black uppercase tracking-wider flex items-center gap-3 mb-8 text-indigo-100">
                                <History size={20} /> Audit Trial
                            </h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Entry Signature</p>
                                    <p className="text-[11px] font-bold text-indigo-100 leading-relaxed uppercase tracking-tight">MAN-VER-{Math.floor(Math.random() * 9000) + 1000}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Security Protocol</p>
                                    <p className="text-[11px] font-bold text-indigo-100 leading-relaxed">Manual logs require justification for director approval.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/10 relative z-10">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-white text-indigo-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3 hover:scale-[1.02] shadow-indigo-100/10 active:scale-95 transition-all"
                            >
                                {loading ? 'Commiting...' : <><Save size={18} /> Record Log Entry</>}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-3 text-indigo-600 mb-2">
                            <AlertCircle size={20} />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-950 leading-none">Smart Audit</h4>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold leading-relaxed px-1">
                            Override logs will be cross-referenced with biometric gateway records during the next payroll synchronization.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}

