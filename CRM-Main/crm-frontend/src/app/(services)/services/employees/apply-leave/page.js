"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Calendar,
    FileText,
    Info,
    ShieldCheck,
    CheckCircle2,
    Save,
    MapPin,
    Activity,
    AlertCircle
} from 'lucide-react';
import { leaveBalance } from '../../data/employeeDummyData';
import { hrmsApi } from '@/lib/api';

export default function ApplyLeavePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        type: 'Casual Leave',
        from: '',
        to: '',
        reason: '',
        backup: '',
        emergency: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (!form.from || !form.to) {
                setError("Please select From and To dates.");
                return;
            }

            const res = await hrmsApi.createLeaveRequest({
                type: form.type,
                from_date: form.from,
                to_date: form.to,
                reason: form.reason || undefined,
            });

            if (!res?.success) throw new Error(res?.error || "Failed to submit leave request");
            router.push('/services/hrms?tab=Leave%20Management');
        } catch (e2) {
            setError(e2?.message || "Failed to submit leave request");
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50/30 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 transition-all text-sm font-bold shadow-sm";

    return (
        <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-0 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors w-fit group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Back to Dashboard</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Time Off Request</h1>
                            <p className="text-gray-500 font-semibold mt-1 flex items-center gap-2 text-sm italic">
                                <span className="text-indigo-600 uppercase tracking-widest text-[10px] font-bold">Work-Life Integration</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span>Leave Application</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {error ? (
                        <div className="px-5 py-3 bg-rose-50 border border-rose-100 text-rose-700 text-sm font-semibold rounded-2xl">
                            {error}
                        </div>
                    ) : null}
                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                            <Calendar size={18} className="text-indigo-600" />
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Absence Schedule</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Leave Classification</label>
                                <select
                                    className={inputCls}
                                    value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value })}
                                >
                                    {leaveBalance.map(b => <option key={b.type} value={b.type}>{b.type}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Period Start</label>
                                <input type="date" className={inputCls} onChange={e => setForm({ ...form, from: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Period End</label>
                                <input type="date" className={inputCls} onChange={e => setForm({ ...form, to: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Strategic Overlap / Backup Personnel</label>
                            <input placeholder="Who will handle your tasks?" className={inputCls} onChange={e => setForm({ ...form, backup: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Grounds for Absence</label>
                            <textarea rows={4} placeholder="Briefly elaborate on the reason for your time off..." className={`${inputCls} resize-none`} onChange={e => setForm({ ...form, reason: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between min-h-[400px]">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                    <Activity size={18} />
                                </div>
                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Leave Quota</h3>
                            </div>

                            <div className="space-y-5">
                                {leaveBalance.map(b => (
                                    <div key={b.type} className="flex flex-col gap-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{b.type}</span>
                                            <span className="text-xs font-bold text-gray-700">{b.remaining} / {b.total} Rem</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${(b.remaining / b.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 space-y-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md shadow-indigo-100 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all outline-none"
                            >
                                {loading ? 'Logging...' : <><Save size={16} /> Transmit Request</>}
                            </button>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest justify-center">
                                <ShieldCheck size={12} className="text-emerald-500" /> Encrypted Digital Submission
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle size={16} />
                            <h4 className="text-[10px] font-bold uppercase tracking-widest">Protocol Notice</h4>
                        </div>
                        <p className="text-xs text-amber-800/70 font-medium leading-relaxed italic">
                            Submission of this request triggers an immediate notification to your direct lead and the HR Compensation Unit. Approval status is usually updated within 24 operational hours.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
}
