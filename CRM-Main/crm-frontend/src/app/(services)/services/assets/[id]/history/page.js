"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    History,
    Calendar,
    User,
    ShieldCheck,
    Wrench,
    Undo2,
    CheckCircle2,
    Search,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    Zap,
    Building2,
    Tag,
    Clock
} from 'lucide-react';
import apiClient from '@/utils/apiClient';
import { toast } from 'sonner';

export default function AssetHistoryPage() {
    const { id: assetId } = useParams();
    const router = useRouter();
    const [asset, setAsset] = useState(null);
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 10;

    useEffect(() => {
        const fetchAsset = async () => {
            try {
                const response = await apiClient.get(`/api/assets/${assetId}`);
                if (response.data.success) {
                    setAsset(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching asset:', error);
                toast.error('Failed to load asset details');
            }
        };

        const fetchHistory = async () => {
            try {
                const response = await apiClient.get(`/api/assets/${assetId}/history`);
                if (response.data.success) {
                    setLogs(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching history:', error);
                toast.error('Failed to load lifecycle logs');
            }
        };

        if (assetId) {
            fetchAsset();
            fetchHistory();
        }
    }, [assetId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredHistory = logs.filter(h =>
        (h.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.user || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).map(log => {
        const date = new Date(log.date);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        let type = log.action;
        if (type === 'Assigned') type = 'Assignment';
        if (type === 'Available') type = 'Return';

        return {
            ...log,
            type,
            date: `${day}-${month}-${year}`
        };
    });

    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const paginatedHistory = filteredHistory.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredHistory.length / entriesPerPage);

    const totalAssignments = logs.filter(l => l.action === 'Assigned').length;
    const maintenanceEvents = logs.filter(l => l.action === 'Maintenance').length;

    // Calculate Age
    let ageStr = 'Registered Today';
    if (asset?.purchaseDate) {
        const pDate = new Date(asset.purchaseDate);
        const now = new Date();
        const diffYears = (now - pDate) / (1000 * 60 * 60 * 24 * 365.25);
        if (diffYears >= 1) {
            ageStr = `${diffYears.toFixed(1)} Years`;
        } else {
            const diffMonths = (now - pDate) / (1000 * 60 * 60 * 24 * 30.44);
            ageStr = `${Math.max(0, Math.floor(diffMonths))} Months`;
        }
    }

    const stats = [
        { label: 'Total Assignments', val: `${totalAssignments} Events`, icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Maintenance Logs', val: `${maintenanceEvents} Entries`, icon: Wrench, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Registry Age', val: ageStr, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Current Status', val: asset?.status || 'Unknown', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' }
    ];

    if (!asset) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/20 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-12 h-12 rounded-[24px] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                        <History size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 uppercase"> <span className="mr-2">Lifecycle</span>Registry</h1>
                        <p className="text-gray-500 font-bold mt-1 flex items-center gap-2 text-[10px] uppercase tracking-widest">
                            Comprehensive audit for <span className="text-indigo-600">{asset.name}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            {asset.id}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={() => router.push('/services/assets')}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100 group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>
                </div>
            </div>

            {/* Quick Audit Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-[12px] border border-gray-100 shadow-sm flex items-center gap-4 transition-all hover:border-indigo-100 cursor-default group">
                        <div className={`p-4 rounded-2xl ${s.bg} ${s.color} transition-transform group-hover:scale-110 shadow-sm`}>
                            <s.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{s.label}</p>
                            <p className="text-lg font-black text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight leading-none">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Event Timeline Registry */}
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm shadow-indigo-100"><ShieldCheck size={18} /></div>
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.2em]">Validated Event Ledger</h3>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                placeholder="Search event history..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-50 outline-none w-64 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 flex-1">
                    <div className="space-y-8 relative">
                        <div className="absolute left-[23px] top-6 bottom-6 w-px bg-gray-100" />

                        {filteredHistory.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-300">
                                <History size={48} className="mb-4 opacity-20" />
                                <p className="font-black uppercase tracking-[0.2em] text-[10px]">No events recorded in repository</p>
                            </div>
                        ) : paginatedHistory.map((event, i) => (
                            <div key={i} className="flex gap-8 group animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="relative z-10 flex flex-col items-center justify-center w-12 h-12 rounded-[16px] bg-white border border-gray-100 shadow-sm group-hover:border-indigo-600 group-hover:scale-110 transition-all cursor-default text-gray-500">
                                    {event.type === 'Assignment' ? <ArrowUpRight size={18} className="text-indigo-600" /> :
                                        event.type === 'Return' ? <ArrowDownLeft size={18} className="text-emerald-600" /> :
                                            event.type === 'Maintenance' ? <Wrench size={18} className="text-rose-600" /> :
                                                <Zap size={18} className="text-amber-600" />}
                                </div>

                                <div className="flex-1 pb-8 group-last:pb-0">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${event.type === 'Assignment' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                event.type === 'Return' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                                }`}>
                                                {event.type}
                                            </span>
                                            <span className="text-[10px] font-black text-gray-900">{event.user || 'System Auto'}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 mt-1 md:mt-0 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar size={12} /> {event.date}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 leading-relaxed group-hover:text-gray-900 transition-colors uppercase tracking-tight">
                                        {event.description}
                                    </p>
                                    <div className="mt-3 flex items-center gap-3 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                        <Building2 size={12} /> Registry ID: REG-{Math.floor(Math.random() * 9999)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {filteredHistory.length > 0 && (
                    <div className="px-8 py-5 border-t border-gray-50 bg-gray-50/10 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Showing <span className="text-gray-600">{indexOfFirstEntry + 1}</span> to <span className="text-gray-600">{Math.min(indexOfLastEntry, filteredHistory.length)}</span> of <span className="text-gray-600">{filteredHistory.length}</span> entries
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 bg-white text-[10px] font-black text-gray-600 uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm group"
                            >
                                <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 bg-white text-[10px] font-black text-gray-600 uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-sm group"
                            >
                                Next
                                <ChevronLeft size={16} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


