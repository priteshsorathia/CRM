"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Search,
    Filter,
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    Download,
    Eye,
    ChevronDown,
    AlertCircle,
    User,
    ArrowUpRight,
    ArrowDownLeft
} from 'lucide-react';
import { attendanceData } from '../../data/employeeDummyData';

export default function DetailedAttendancePage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const filtered = attendanceData.filter(a =>
        a.employee.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = [
        { label: 'Present Today', val: '52', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Late Entries', val: '08', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Absent Personnel', val: '04', icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Workforce On Leave', val: '12', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-0 pb-20">
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
                            <Clock size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Workforce Registry</h1>
                            <p className="text-gray-500 font-semibold mt-1 flex items-center gap-2 text-sm italic">
                                <span className="text-indigo-600 uppercase tracking-widest text-[10px] font-bold">Biometric Attendance</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                <span>Real-time Monitoring</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="relative group">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                            />
                        </div>
                        <button
                            onClick={() => alert('Exporting Attendance Ledger...')}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:text-indigo-600 shadow-sm transition-all"
                        >
                            <Download size={14} /> Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-all cursor-default group">
                        <div className={`p-3 rounded-xl border border-white/50 shadow-sm ${s.bg} ${s.color} transition-transform group-hover:scale-105`}>
                            <s.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1.5">{s.label}</p>
                            <p className="text-xl font-bold text-gray-900 tracking-tight leading-none">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Registry */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Find employee record..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 w-full focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:font-normal placeholder:capitalize placeholder:tracking-normal placeholder:text-gray-400"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-all shadow-sm">
                            <Filter size={14} /> Dept
                            <ChevronDown size={14} className="text-gray-400 ml-1" />
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-all shadow-sm">
                            <Filter size={14} /> Status
                            <ChevronDown size={14} className="text-gray-400 ml-1" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-indigo-50/50">
                            <tr>
                                <th className="px-5 md:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-indigo-100/50">Employee</th>
                                <th className="px-5 md:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-indigo-100/50">Check-In / Out</th>
                                <th className="px-5 md:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-indigo-100/50">Duration</th>
                                <th className="px-5 md:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-indigo-100/50">OT</th>
                                <th className="px-5 md:px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-indigo-100/50">Registry Status</th>
                                <th className="px-5 md:px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider border-b border-indigo-100/50">Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-gray-400 font-semibold italic">No matching records found.</td>
                                </tr>
                            ) : filtered.map(row => (
                                <tr key={row.id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-5 md:px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50/80 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100 group-hover:bg-indigo-100 transition-all">
                                                {row.employee.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 group-hover:text-indigo-900 transition-colors">{row.employee}</p>
                                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">ID: {row.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 md:px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                                                <ArrowDownLeft size={14} className="opacity-80" />
                                                <span className="tabular-nums">{row.checkIn}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-500 font-medium text-xs">
                                                <ArrowUpRight size={14} className="opacity-80" />
                                                <span className="tabular-nums">{row.checkOut}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 md:px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-20 hidden sm:block h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '85%' }} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 tabular-nums">{row.hours}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 md:px-6 py-4">
                                        <span className={`text-xs font-bold ${row.overtime === '—' ? 'text-gray-400' : 'text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100'}`}>
                                            {row.overtime}
                                        </span>
                                    </td>
                                    <td className="px-5 md:px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border transition-all ${row.status === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                row.status === 'Late' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                    'bg-gray-100 text-gray-500 border-gray-200'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-5 md:px-6 py-4 text-right">
                                        <button
                                            onClick={() => alert('Accessing biometric log detail...')}
                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-5 md:px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                    <p className="text-gray-500 font-semibold text-xs flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Registry Status: <span className="text-gray-900 font-bold">Live</span>
                    </p>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-lg text-xs font-bold uppercase tracking-wider text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition-all">Previous</button>
                        <button className="px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-lg text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all">Next</button>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-sm flex items-start gap-4 max-w-2xl">
                <div className="p-2 bg-amber-100/50 text-amber-600 rounded-lg"><AlertCircle size={18} /></div>
                <div>
                    <h4 className="text-[10px] font-bold text-amber-900 uppercase tracking-widest mb-1.5">Audit Policy Reminder</h4>
                    <p className="text-xs text-amber-800/80 font-medium leading-relaxed italic">
                        Data shown here is retrieved directly from the cloud-sync biometric terminal. Manual adjustments require dual-factor authorization from the Corporate HR Lead.
                    </p>
                </div>
            </div>
        </div>
    );
}
