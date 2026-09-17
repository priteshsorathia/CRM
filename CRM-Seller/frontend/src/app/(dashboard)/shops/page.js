"use client";
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Eye, MapPin, Mail, Phone, RefreshCw, ChevronLeft, ChevronRight, User, MessageSquare, ShoppingBag, Building2, Globe, Clock, Ban, ShieldCheck, ShieldAlert, Copy, X, Check } from 'lucide-react';
import api from '../../../lib/axios';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_BASE;

const Field = ({ label, icon, children }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
            {icon && <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">{icon}</div>}
            {children}
        </div>
    </div>
);

const inputClass = (hasIcon = true) =>
    `w-full ${hasIcon ? 'pl-12' : 'pl-5'} pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-semibold text-slate-700 text-sm`;

const Shops = () => {
    const router = useRouter();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchShops = async () => {
        try {
            setLoading(true);
            const res = await api.get('/shops');
            if (res.data.success) setShops(res.data.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchShops(); }, []);

    const handleToggleBlock = async (id, currentStatus) => {
        const action = currentStatus === 'Blocked' || currentStatus === 'Inactive' ? 'unblock' : 'block';
        if (!confirm(`Are you sure you want to ${action} this shop?`)) return;

        try {
            setLoading(true);
            const isBlocked = (action === 'block');
            const res = await api.patch(`/shops/${id}/block`, { isBlocked });

            if (res.data.success) {
                setShops(prev => prev.map(s => s.id === id ? {
                    ...s,
                    status: isBlocked ? 'Blocked' : 'Active'
                } : s));
            }
        } catch (err) {
            console.error("Block/Unblock Error:", err);
            alert(`Failed to ${action} shop.`);
        } finally {
            setLoading(false);
        }
    };

    const filteredShops = shops.filter(shop =>
        !search ||
        shop.name?.toLowerCase().includes(search.toLowerCase()) ||
        shop.location?.toLowerCase().includes(search.toLowerCase()) ||
        shop.address?.toLowerCase().includes(search.toLowerCase()) ||
        shop.phone?.toLowerCase().includes(search.toLowerCase()) ||
        shop.email?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredShops.length / itemsPerPage);
    const currentShops = filteredShops.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 tracking-tight">Shops Overview</h1>
                        <p className="text-xs md:text-xs text-gray-400 font-medium mt-0.5">Manage and track all business shop profiles</p>
                    </div>
                    <button 
                        onClick={fetchShops} 
                        className="md:hidden p-3 bg-white hover:bg-gray-50 text-gray-500 rounded-xl border border-gray-100 shadow-sm active:scale-95"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchShops} className="hidden md:flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-100 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button onClick={() => router.push('/shops/new')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95">
                        <Plus size={14} />
                        Create Shop
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-2 flex items-center gap-3">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                    type="text"
                    placeholder="Search by shop name, address, phone or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent py-3"
                />
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                    {filteredShops.length} Records
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-semibold text-gray-700 tracking-tight">All Shops</h2>
                </div>

                {loading && shops.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-medium animate-pulse uppercase text-xs tracking-[0.3em] bg-white rounded-3xl border border-gray-100">Loading Shops...</div>
                ) : currentShops.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-medium uppercase text-xs tracking-[0.3em] bg-white rounded-3xl border border-gray-100">No shops found</div>
                ) : (
                    <>
                        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-gray-50">
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/30">ID</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/30">Shop Name</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/30">Contact Details</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/30">Address</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/30">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/30 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentShops.map((shop, index) => (
                                        <tr key={`${shop.id || 'new'}-${index}`} className="group hover:bg-slate-50/50 transition-colors border-b last:border-0 border-gray-50">
                                            <td className="px-8 py-6">
                                                <div className="text-[10px] font-bold text-gray-300 tracking-[0.2em]">{shop.id || 'NEW'}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm text-slate-800 capitalize tracking-tight group-hover:text-blue-600 transition-colors">{shop.name}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={12} className="text-blue-400" />
                                                        <span className="text-[11px] font-bold text-slate-500 font-mono tracking-wider">{shop.phone || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Mail size={12} className="text-blue-400" />
                                                        <span className="text-[10px] font-bold text-slate-400 tracking-tight lowercase">{shop.email || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-start gap-3 max-w-[250px]">
                                                    <div className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wide line-clamp-2 italic">
                                                        {shop.address || shop.location || 'No Location Set'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border ${shop.status === 'Blocked' || shop.status === 'Inactive'
                                                        ? 'bg-red-50 text-red-500 border-red-100'
                                                        : 'bg-green-50 text-green-500 border-green-100'
                                                    }`}>
                                                    {shop.status || 'Active'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="flex items-center justify-center gap-1.5 text-slate-400">
                                                    <button
                                                        onClick={() => router.push(`/shops/${shop.id}`)}
                                                        className="hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-all shadow-sm border border-slate-50 bg-white"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => router.push(`/shops/edit?id=${shop.id}`)}
                                                        className="hover:bg-amber-500 hover:text-white p-2 rounded-lg transition-all shadow-sm border border-slate-50 bg-white"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleBlock(shop.id, shop.status)}
                                                        className={`p-2 rounded-lg transition-all shadow-sm border border-slate-50 bg-white ${shop.status === 'Blocked' || shop.status === 'Inactive'
                                                                ? 'hover:bg-green-500 hover:text-white'
                                                                : 'hover:bg-red-500 hover:text-white'
                                                            }`}
                                                    >
                                                        {shop.status === 'Blocked' || shop.status === 'Inactive' ? <ShieldCheck size={14} /> : <Ban size={14} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex flex-col md:flex-row items-center justify-between mt-10 px-6 gap-4">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredShops.length)} of {filteredShops.length} Shops
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className={`p-2.5 rounded-xl border border-gray-100 transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-slate-600 shadow-sm'}`}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <div className="flex items-center gap-1.5">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => setCurrentPage(i + 1)}
                                                className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${
                                                    currentPage === i + 1 
                                                    ? 'bg-slate-800 border-slate-800 text-white shadow-lg' 
                                                    : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 shadow-sm'
                                                }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className={`p-2.5 rounded-xl border border-gray-100 transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-slate-600 shadow-sm'}`}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Shops;
