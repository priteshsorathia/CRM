"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Package,
    ShieldCheck,
    Calendar,
    CreditCard,
    User,
    Activity,
    History,
    Wrench,
    Undo2,
    UserPlus,
    Download,
    Pencil,
    Trash2,
    Monitor,
    Cpu,
    Zap,
    Tag,
    AlertCircle,
    CheckCircle2,
    BarChart3
} from 'lucide-react';
import PermissionWrapper from '@/components/PermissionWrapper';
import apiClient from '@/utils/apiClient';
import { toast } from 'sonner';
import DeleteAssetModal from '../DeleteAssetModal';
import AccessDenied from '@/components/AccessDenied';
import { useRole } from '@/app/(services)/context/RoleContext';

export default function AssetDetailPage() {
    const { can, loading: roleLoading } = useRole();
    const { id: assetId } = useParams();
    const router = useRouter();
    const [asset, setAsset] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 5;

    useEffect(() => {
        if (roleLoading) return;

        if (!can('ASSETS', 'READ')) {
            setAccessDenied(true);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const [assetRes, historyRes] = await Promise.all([
                    apiClient.get(`/api/assets/${assetId}`),
                    apiClient.get(`/api/assets/${assetId}/history`)
                ]);

                if (assetRes.data.success) {
                    setAsset(assetRes.data.data);
                }
                if (historyRes.data.success) {
                    setHistory(historyRes.data.data);
                }
            } catch (error) {
                console.error('Error fetching asset details:', error);
                if (error.response?.status === 403) {
                    setAccessDenied(true);
                } else {
                    toast.error('Failed to load asset information');
                }
            } finally {
                setLoading(false);
            }
        };

        if (assetId) {
            fetchData();
        }
    }, [assetId, roleLoading]);

    if (roleLoading || (loading && !asset && !accessDenied)) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (accessDenied) {
        return (
            <AccessDenied 
                homeHref="/services/assets" 
                homeLabel="Back to Assets" 
            />
        );
    }

    if (!asset && !loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
            <AlertCircle size={48} className="mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">Asset not found</p>
            <button onClick={() => router.push('/services/assets')} className="mt-4 text-indigo-600 font-bold text-xs uppercase hover:underline">Back to Registry</button>
        </div>
    );

    const statusStyle = {
        'Available': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'Assigned': 'bg-indigo-50 text-indigo-600 border-indigo-100',
        'Maintenance': 'bg-amber-50 text-amber-600 border-amber-100',
        'Expiring': 'bg-rose-50 text-rose-600 border-rose-100',
        'Retired': 'bg-gray-50 text-gray-500 border-gray-200',
    };

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        } catch (e) {
            return dateString;
        }
    };

    const handleUpdate = async (updates) => {
        try {
            const response = await apiClient.put(`/api/assets/${assetId}`, updates);
            if (response.data.success) {
                toast.success('Asset updated successfully');
                setAsset(response.data.data);
            }
        } catch (error) {
            console.error('Error updating asset:', error);
            toast.error(error.response?.data?.error || 'Failed to update asset');
        }
    };

    const handleDelete = () => setShowDeleteModal(true);

    const confirmDelete = async () => {
        try {
            const response = await apiClient.delete(`/api/assets/${assetId}`);
            if (response.data.success) {
                toast.success('Asset deleted successfully');
                router.push('/services/assets');
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
            toast.error(error.response?.data?.error || 'Failed to delete asset');
        }
    };

    const historyData = history.length > 0 ? history.map(log => ({
        date: formatDate(log.date),
        action: log.action,
        person: log.user,
        notes: log.description
    })) : [
        { date: formatDate(asset.purchaseDate), action: 'Acquired', person: 'System', notes: 'Initial inventory registration' }
    ];

    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const paginatedHistory = historyData.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(historyData.length / entriesPerPage);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 sm:px-0 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg border-2 border-white/20">
                        {asset.category === 'Laptop' ? <Monitor size={24} /> : asset.category === 'License' ? <Zap size={24} /> : <Package size={24} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{asset.name}</h1>
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusStyle[asset.status]}`}>
                                {asset.status}
                            </span>
                        </div>
                        <p className="text-gray-500 font-semibold flex items-center gap-2 text-sm italic">
                            <span className="text-indigo-600 uppercase tracking-widest text-[10px] font-bold">{asset.assetId}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span>{asset.vendor}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span>{asset.category}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                    <button
                        onClick={() => router.push('/services/assets')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all border border-gray-200 group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Asset Lifecycle', val: 'New', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Evaluation', val: asset.cost ? `₹${asset.cost.toLocaleString()}` : '₹0', icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Warranty Expiry', val: formatDate(asset.warrantyExpiry), icon: ShieldCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Current Holder', val: asset.assignedTo || 'Inventory', icon: User, color: 'text-amber-600', bg: 'bg-amber-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 group hover:border-indigo-100 transition-all cursor-default">
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-105 shadow-sm border border-white/50`}>
                            <stat.icon size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-lg font-bold text-gray-900 truncate">{stat.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Technical Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-8">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-3">
                                <Cpu size={18} className="text-indigo-600" /> Technical Blueprint
                            </h3>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                                <CheckCircle2 size={12} /> Verified by IT
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {[
                                { label: 'Serial Number', val: asset.serialNumber || '—', icon: Tag },
                                { label: 'Hardware Condition', val: asset.condition, icon: Activity },
                                { label: 'Vendor / Provider', val: asset.vendor || '—', icon: Building2 },
                                { label: 'Procurement Date', val: formatDate(asset.purchaseDate), icon: Calendar },
                                { label: 'Asset Architecture', val: asset.category, icon: Cpu },
                                { label: 'Depreciation Cycle', val: 'Annual - 20%', icon: BarChart3 }
                            ].map((spec, i) => (
                                <div key={i} className="flex flex-col gap-1 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-default">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <spec.icon size={12} className="text-indigo-400" /> {spec.label}
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">{spec.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Operational History */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-3">
                                <History size={18} className="text-indigo-600" /> Audit Registry
                            </h3>
                        </div>

                        <div className="space-y-6">
                            {historyData.length === 0 ? (
                                <div className="py-10 text-center text-gray-400">
                                    <History size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="font-bold uppercase tracking-widest text-[10px]">No audit logs recorded</p>
                                </div>
                            ) : paginatedHistory.map((evt, i) => (
                                <div key={i} className="flex gap-4 group relative">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 border border-gray-200 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            {evt.date.split('-')[0]}
                                        </div>
                                        <div className="flex-1 w-px bg-gray-100 my-1 group-last:hidden" />
                                    </div>
                                    <div className="flex-1 pb-6 group-last:pb-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{evt.action}</p>
                                            <span className="text-[10px] font-semibold text-gray-400">{evt.date}</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-800 mb-1 leading-tight">{evt.notes}</p>
                                        <div className="flex items-center gap-2 text-[10px] font-semibold text-gray-400 uppercase tracking-tighter">
                                            <User size={12} className="text-gray-300" />
                                            <span>Personnel: {evt.person}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {historyData.length > entriesPerPage && (
                            <div className="mt-8 pt-5 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Showing <span className="text-gray-600">{indexOfFirstEntry + 1}</span> to <span className="text-gray-600">{Math.min(indexOfLastEntry, historyData.length)}</span> of <span className="text-gray-600">{historyData.length}</span> entries
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-[10px] font-bold text-gray-600 uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all group"
                                    >
                                        <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                                        Prev
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-[10px] font-bold text-gray-600 uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all group"
                                    >
                                        Next
                                        <ChevronLeft size={14} className="rotate-180 group-hover:translate-x-0.5 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column: Asset State Control */}
                <div className="space-y-6">
                    <PermissionWrapper module="ASSETS" action="UPDATE">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-3 mb-4 border-b border-gray-100 pb-4">
                                <Activity size={18} className="text-indigo-600" /> State Control
                            </h3>

                            <div className="space-y-2">
                                <button
                                    onClick={() => router.push(`/services/assets/${assetId}/assign`)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-600 text-gray-700 hover:text-white transition-all group border border-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <UserPlus size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Assign Asset</span>
                                    </div>
                                    <ChevronLeft size={14} className="rotate-180 opacity-0 group-hover:opacity-100 transition-all" />
                                </button>

                                <button
                                    onClick={() => handleUpdate({ status: 'Maintenance' })}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-indigo-600 text-gray-700 hover:text-white transition-all group border border-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <Wrench size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Maintenance</span>
                                    </div>
                                    <ChevronLeft size={14} className="rotate-180 opacity-0 group-hover:opacity-100 transition-all" />
                                </button>

                                <button
                                    onClick={() => handleUpdate({ status: 'Available', assignedTo: null })}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-rose-600 text-gray-700 hover:text-white transition-all group border border-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <Undo2 size={16} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Force Return</span>
                                    </div>
                                    <ChevronLeft size={14} className="rotate-180 opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                    <Clock size={16} className="text-indigo-600" />
                                    <div>
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Ownership Duration</p>
                                        <p className="text-sm font-bold text-indigo-900">1 Year, 4 Months</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </PermissionWrapper>

                    {/* Warranty/Risk Card */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                        <div className="flex items-center gap-3 text-rose-500">
                            <AlertCircle size={18} />
                            <h4 className="text-[10px] font-bold uppercase tracking-wider">Risk Assessment</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                                <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider mb-1">Warranty Expiry</p>
                                <p className="text-xs font-bold text-rose-600">Expires in 142 days. Renwal recommended by Q3.</p>
                            </div>
                            <p className="text-[10px] text-gray-500 font-semibold leading-relaxed px-1">
                                Asset is classified as "Primary Hardware". Any hardware failure will trigger an immediate replacement ticket.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <DeleteAssetModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                assetName={asset.name}
            />
        </div>
    );
}

const Building2 = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
    </svg>
);

const Clock = (props) => (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
);
