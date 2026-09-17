"use client";
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
    Info,
    Pencil
} from 'lucide-react';

export default function EditAttendanceRecordPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        employee: 'EMP-2024-001', // Should be fetched from dummy data
        type: 'Check In',
        time: '09:30',
        date: '2024-03-01',
        mode: 'Biometric',
        originalLog: '09:42'
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            router.push('/services/hrms/staff/attendance');
        }, 1200);
    };

    const inputCls = "w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 focus:outline-none focus:ring-4 focus:ring-amber-50/50 focus:border-amber-500 transition-all text-sm font-bold shadow-sm";

    return (
        <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0 pb-20">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors w-fit group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Back to Detailed Registry</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm">
                            <Pencil size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Adjust Log Integrity</h1>
                            <p className="text-gray-500 font-semibold mt-1 flex items-center gap-2 text-sm italic">
                                <span className="text-amber-600 uppercase tracking-widest text-[10px] font-bold">Attendance Rectification</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span>Registry Update Portal</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 relative z-10">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Correction Mode</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><User size={18} /></div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Log Particulars</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Personnel Detail <span className="text-indigo-600">{id}</span></p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Personnel Legal Name</label>
                                <input
                                    value={form.employee}
                                    readOnly
                                    className={`${inputCls} bg-gray-50/50 cursor-not-allowed`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Event Classification</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, type: 'Check In' })}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${form.type === 'Check In' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100/50' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        <ArrowUpRight size={16} /> Check In
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, type: 'Check Out' })}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${form.type === 'Check Out' ? 'bg-rose-500 text-white shadow-md shadow-rose-100/50' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        <ArrowDownLeft size={16} /> Check Out
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 relative">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 leading-none flex items-center justify-between">
                                    <span>Rectified Timestamp</span>
                                    <span className="text-rose-400">Orig: {form.originalLog}</span>
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="time"
                                        value={form.time}
                                        onChange={e => setForm({ ...form, time: e.target.value })}
                                        className={`${inputCls} pl-10`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Log Authorization Mode</label>
                                <select
                                    value={form.mode}
                                    onChange={e => setForm({ ...form, mode: e.target.value })}
                                    className={inputCls}
                                >
                                    <option>Biometric</option>
                                    <option>Manual Correction</option>
                                    <option>Network Recovery</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Event Date</label>
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

                {/* Sidebar Column: Rectification Intelligence */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between min-h-[350px]">
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-gray-800 pb-3 border-b border-gray-100">
                                <History size={18} className="text-indigo-600" /> Integrity Audit
                            </h3>

                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Adjustment Rationale</p>
                                    <p className="text-xs font-semibold text-gray-700 leading-relaxed uppercase tracking-wider">Systematic Sync Recovery or Network Failure</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Policy Compliance</p>
                                    <p className="text-xs font-medium text-gray-600 leading-relaxed italic">Adjustments must be validated against biometric gateway logs.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 relative z-10">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all outline-none"
                            >
                                {loading ? 'Commiting Change...' : <><Save size={16} /> Resolve Registry Log</>}
                            </button>
                        </div>
                    </div>

                    <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-sm space-y-2">
                        <div className="flex items-center gap-2 text-amber-600 mb-2">
                            <Info size={16} />
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-900 leading-none">Smart Audit</h4>
                        </div>
                        <p className="text-xs text-amber-800/80 font-medium leading-relaxed italic">
                            This manual adjustment will be highlighted in the monthly workforce audit report for director's review.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}

