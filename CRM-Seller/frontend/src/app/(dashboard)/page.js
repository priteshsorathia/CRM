"use client";
import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import { useRouter } from 'next/navigation';
import { 
    ShoppingBag, IndianRupee, Users, Clock, 
    Zap, PlusCircle, Receipt, Layout, PlayCircle, 
    Ticket, MessageSquare, ChevronRight, RefreshCw, BarChart3, TrendingUp, UserCheck, Star, MessageCircle
} from 'lucide-react';

const QuickStat = ({ title, value, icon, containerBg, iconColor, isActive, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-white p-4 md:p-6 rounded-2xl border transition-all cursor-pointer group ${
            isActive ? 'border-blue-600' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
        }`}
    >
        <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${containerBg} flex items-center justify-center ${iconColor} group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
                {React.cloneElement(icon, { size: 18, strokeWidth: 2.5 })}
            </div>
            <div className="flex flex-col">
                <p className="text-[9px] md:text-[10px] font-semibold text-gray-400 uppercase tracking-widest leading-tight mb-1">{title}</p>
                <p className="text-xl md:text-xl font-semibold text-slate-800 leading-none">{value}</p>
            </div>
        </div>
    </div>
);

const NavButton = ({ title, icon, color, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full bg-white p-4 rounded-xl border border-gray-100 hover:border-slate-800 flex items-center space-x-3 transition-all text-left group"
    >
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</span>
    </button>
);

export default function Dashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Active Leads');
    const [tabData, setTabData] = useState([]);
    const [tabLoading, setTabLoading] = useState(false);
    const [data, setData] = useState({
        revenue: { total: 0 },
        counts: { leads: 0, shops: 0, pendingCallbacks: 0, openTickets: 0 },
        reviews: []
    });

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [statsRes, reviewsRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/reviews')
            ]);
            
            if (statsRes.data.success && reviewsRes.data.success) {
                setData({
                    ...statsRes.data.data,
                    reviews: reviewsRes.data.data.slice(0, 4)
                });
            }
        } catch (error) {
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTabData = async (tab) => {
        setTabLoading(true);
        try {
            let endpoint = '';
            switch (tab) {
                case 'Active Leads': endpoint = '/leads'; break;
                case 'Verified Shops': endpoint = '/shops'; break;
                case 'Open Tickets': endpoint = '/support-tickets'; break;
                case 'Pending Callbacks': endpoint = '/callback-requests'; break;
                default: endpoint = '/leads';
            }
            const res = await api.get(`${endpoint}?limit=5`);
            if (res.data.success) {
                if (tab === 'Active Leads') {
                    setTabData(res.data.leads?.slice(0, 5) || []);
                } else {
                    setTabData(res.data.data?.slice(0, 5) || []);
                }
            }
        } catch (error) {
            console.error(`Error fetching ${tab} data:`, error);
            setTabData([]);
        } finally {
            setTabLoading(false);
        }
    };

    useEffect(() => { 
        fetchStats(); 
    }, []);

    useEffect(() => {
        fetchTabData(activeTab);
    }, [activeTab]);

    const renderTabData = () => {
        if (tabLoading) {
            return (
                <div className="h-60 flex items-center justify-center">
                    <RefreshCw size={24} className="text-slate-200 animate-spin" />
                </div>
            );
        }

        if (!tabData || tabData.length === 0) {
            return (
                <div className="h-60 flex flex-col items-center justify-center text-gray-400/60 font-black uppercase tracking-[0.2em] text-xs space-y-4">
                    <Layout size={40} className="text-gray-200" />
                    <span>No active records found in this category</span>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-50">
                            <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
                            <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {tabData.map((item, idx) => (
                            <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-800">
                                            {item.fullName || item.name || item.subject || 'N/A'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {item.businessName || item.ownerName || item.category || item.email || item.contact || '—'}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 text-right">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                        (item.status === 'Active' || item.status === 'Open' || item.status === 'Qualified') 
                                        ? 'bg-emerald-50 text-emerald-600' 
                                        : (item.status === 'Pending' || item.status === 'New')
                                        ? 'bg-amber-50 text-amber-600'
                                        : 'bg-gray-50 text-gray-400'
                                    }`}>
                                        {item.status || 'Active'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button 
                    onClick={() => {
                        const path = activeTab === 'Active Leads' ? '/leads' : 
                                   activeTab === 'Verified Shops' ? '/shops' : 
                                   activeTab === 'Open Tickets' ? '/support-tickets' : '/callback-requests';
                        router.push(path);
                    }}
                    className="w-full mt-6 py-3 text-[10px] font-black text-gray-400 hover:text-slate-800 uppercase tracking-widest border border-dashed border-gray-100 rounded-xl transition-all"
                >
                    View All {activeTab}
                </button>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            {/* Simple Header */}
            <div className="flex flex-row items-center justify-between gap-4 px-2">
                <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-semibold text-slate-800 uppercase tracking-tight">Seller Dashboard</h1>
                    <p className="text-[8px] md:text-[10px] text-gray-400 font-medium uppercase tracking-[0.25em] mt-1 line-clamp-1">CRM Management v1.0</p>
                </div>
                <button 
                  onClick={() => { fetchStats(); fetchTabData(activeTab); }} 
                  className="p-3 bg-white shadow-sm rounded-xl text-gray-400 hover:text-indigo-600 transition-all border border-gray-100 flex-shrink-0"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Top Grid: Key Business Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <QuickStat 
                    title="Active Leads" 
                    value={data.counts.leads} 
                    icon={<Zap />} 
                    containerBg="bg-amber-50" 
                    iconColor="text-amber-500"
                    isActive={activeTab === 'Active Leads'}
                    onClick={() => setActiveTab('Active Leads')}
                />
                <QuickStat 
                    title="Verified Shops" 
                    value={data.counts.shops} 
                    icon={<ShoppingBag />} 
                    containerBg="bg-emerald-50" 
                    iconColor="text-emerald-500"
                    isActive={activeTab === 'Verified Shops'}
                    onClick={() => setActiveTab('Verified Shops')}
                />
                <QuickStat 
                    title="Open Tickets" 
                    value={data.counts.openTickets} 
                    icon={<Ticket />} 
                    containerBg="bg-rose-50" 
                    iconColor="text-rose-500"
                    isActive={activeTab === 'Open Tickets'}
                    onClick={() => setActiveTab('Open Tickets')}
                />
                <QuickStat 
                    title="Pending Callbacks" 
                    value={data.counts.pendingCallbacks} 
                    icon={<MessageSquare />} 
                    containerBg="bg-purple-50" 
                    iconColor="text-purple-500"
                    isActive={activeTab === 'Pending Callbacks'}
                    onClick={() => setActiveTab('Pending Callbacks')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Main Content Area: Business Growth & Recent Activity */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm min-h-[460px]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-lg md:text-xl font-semi text-slate-800 uppercase tracking-tight">Dashboard Overview</h2>
                                <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time status for {activeTab}</p>
                            </div>
                            <div className="flex items-center space-x-2 bg-emerald-50 self-start px-3 py-1.5 rounded-full border border-emerald-100/50">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Live Sync</span>
                            </div>
                        </div>
                        
                        {renderTabData()}
                    </div>
                </div>

                {/* Navigation & Controls Area: Right Column */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">System Navigation</h2>
                        <div className="grid grid-cols-1 gap-3">
                            <NavButton title="Leads Manager" icon={<Zap size={18} />} color="bg-amber-500" onClick={() => router.push('/leads')} />
                            <NavButton title="Shop Network" icon={<ShoppingBag size={18} />} color="bg-emerald-500" onClick={() => router.push('/shops')} />
                            <NavButton title="Onboarding" icon={<PlayCircle size={18} />} color="bg-indigo-600" onClick={() => router.push('/onboarding')} />
                            <NavButton title="Help Desk" icon={<Ticket size={18} />} color="bg-rose-500" onClick={() => router.push('/support-tickets')} />
                            <NavButton title="Callback Hub" icon={<MessageSquare size={18} />} color="bg-purple-500" onClick={() => router.push('/callback-requests')} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Latest Reviews Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div>
                        <h2 className="text-xl font-semi text-slate-800 uppercase tracking-tight">Latest Customer Feedback</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Most recent 4 reviews from customers</p>
                    </div>
                    <button onClick={() => router.push('/reviews')} className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-2 group transition-all">
                        View All Reviews
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {loading ? (
                        [...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 h-40 animate-pulse" />
                        ))
                    ) : (data.reviews || []).length === 0 ? (
                        <div className="lg:col-span-4 bg-white rounded-2xl border border-dashed border-gray-100 p-20 text-center">
                            <MessageCircle size={32} className="text-gray-200 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No reviews available</p>
                        </div>
                    ) : (
                        data.reviews.map((review) => (
                            <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group flex flex-col justify-between h-full">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-0.5">
                                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-1">{review.reviewerName}</h3>
                                            <p className="text-[9px] text-gray-300 font-bold">REV-{String(review.serialId).padStart(3, '0')}</p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
                                            <Star size={10} className="text-amber-400 fill-amber-400" />
                                            <span className="text-[9px] font-black text-amber-600">{review.rating}.0</span>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic line-clamp-3">
                                        "{review.comment}"
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                                    <div className="flex items-center space-x-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={8} className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-100'} />
                                        ))}
                                    </div>
                                    <span className="text-[8px] font-black text-gray-300 uppercase">{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
