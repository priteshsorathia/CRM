"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, MapPin, Phone, Mail, Calendar, Clock, ChevronLeft, Pencil, Trash2, Building2, Globe, User, ShieldCheck, ShieldAlert } from 'lucide-react';
import api from '../../../../lib/axios';

export default function ShopViewPage() {
    const params = useParams();
    const router = useRouter();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);

    const dashboardBaseUrl = (process.env.NEXT_PUBLIC_SELLER_DASHBOARD_BASE_URL || '').replace(/\/$/, '');
    const dashboardLoginPassword = process.env.NEXT_PUBLIC_SELLER_DASHBOARD_LOGIN_PASSWORD;

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get(`/shops/${params.id}`);
                if (res.data.success) setShop(res.data.data);
            } catch (err) {
                console.error('Fetch Error:', err);
            } finally {
                setLoading(false);
            }
        };
        if (params.id) fetch();
    }, [params.id]);

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!shop) return (
        <div className="text-center py-20">
            <h2 className="text-xl font-bold text-gray-800">Shop not found</h2>
            <button onClick={() => router.push('/shops')} className="mt-4 text-indigo-600 hover:underline text-sm font-bold">Back to Shops</button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 space-y-4 pb-20">
            <button onClick={() => router.push('/shops')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-bold group">
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Shops
            </button>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="p-6 md:p-10 border-b border-gray-50 bg-gray-50/20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 shrink-0">
                                    <ShoppingBag size={28} className="md:w-7 md:h-7" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">ID-{shop.id}</p>
                                        <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                                            shop.status === 'Blocked' || shop.status === 'Inactive' || shop.isBlocked
                                            ? 'bg-red-50 text-red-500 border-red-100' 
                                            : 'bg-green-50 text-green-500 border-green-100'
                                        }`}>
                                            {shop.status || (shop.isBlocked ? 'Blocked' : 'Active')}
                                        </div>
                                    </div>
                                    <h1 className="text-2xl text-gray-900 uppercase tracking-tight leading-none">{shop.name}</h1>
                                    <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                                        <Globe size={14} className="text-indigo-400" /> {shop.userType || 'Retailers'} • Shop Profile
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <a 
                                    href={
                                        dashboardBaseUrl && dashboardLoginPassword
                                            ? `${dashboardBaseUrl}/auth/login?email=${encodeURIComponent(shop.email || '')}&password=${encodeURIComponent(dashboardLoginPassword)}`
                                            : undefined
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-disabled={!dashboardBaseUrl || !dashboardLoginPassword}
                                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#5655eb] hover:bg-[#4338ca] text-white px-6 py-3.5 md:py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                                >
                                    <ShieldCheck size={16} /> Direct Dashboard Login
                                </a>
                            </div>
                        </div>
                </div>

                {/* Info Grid */}
                <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">General Information</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0"><User size={18} /></div>
                                <div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-tight mb-0.5">Owner Name</p>
                                    <p className="text-sm font-bold text-gray-700">{shop.ownerName || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><Phone size={18} /></div>
                                <div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-tight mb-0.5">Primary Phone</p>
                                    <p className="text-sm font-bold text-gray-700">{shop.phone || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0"><Mail size={18} /></div>
                                <div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-tight mb-0.5">Email Address</p>
                                    <p className="text-sm font-bold text-blue-600 lowercase">{shop.email || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Business Details</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0"><Building2 size={18} /></div>
                                <div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-tight mb-0.5">GST Number</p>
                                    <p className="text-sm font-bold text-gray-700">{shop.gstNumber || 'Not Provided'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0"><Globe size={18} /></div>
                                <div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-tight mb-0.5">Business Type</p>
                                    <p className="text-sm font-bold text-gray-700 capitalize">{shop.userType || 'Retailers'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0"><MapPin size={18} /></div>
                                <div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-tight mb-0.5">Full Address</p>
                                    <p className="text-[11px] font-bold text-gray-600 leading-relaxed uppercase">{shop.address || shop.location || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="px-10 pb-10">
                    <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 shadow-sm border border-gray-100"><Calendar size={20} /></div>
                            <div>
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-tight mb-0.5">System Registration</p>
                                <p className="text-xs font-bold text-gray-600">Established on {new Date(shop.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[9px] text-gray-400 font-black uppercase tracking-tight mb-0.5">Last Activity</p>
                             <p className="text-xs font-bold text-gray-400">{new Date(shop.updatedAt).toLocaleTimeString()}</p>
                        </div>
                    </div>
                </div>
<hr/>
                {/* Footer Actions */}
                <div className="p-8 border-t border-gray-50 bg-gray-50/10 flex justify-end gap-3">
                    <button 
                        onClick={() => router.push(`/shops/edit?id=${shop.id}`)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                        <Pencil size={14} /> Edit Profile
                    </button>
                    <button 
                        onClick={() => router.push('/shops')}
                        className="px-8 py-3 rounded-2xl text-gray-400 hover:text-gray-600 font-black text-[10px] uppercase tracking-[0.2em] border border-gray-100 hover:border-gray-200 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
