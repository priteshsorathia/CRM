"use client";
import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Star, RefreshCw, Trash2, ChevronLeft, ChevronRight, MessageSquare, Pencil } from 'lucide-react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

const StatCard = ({ title, value, icon, bgColor, active, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white p-4 md:p-5 rounded-2xl shadow-sm border flex items-center space-x-3 md:space-x-4 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${active ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-gray-100'}`}
    >
        <div className={`p-2.5 md:p-3 rounded-xl ${bgColor} text-white shadow-sm shrink-0`}>
            {React.cloneElement(icon, { size: 18, className: "md:w-5 md:h-5" })}
        </div>
        <div className="flex flex-col">
            <h3 className="text-gray-400 font-semibold tracking-wide text-[10px] uppercase mb-0.5">{title}</h3>
            <p className="text-xl font-semibold text-gray-800 tracking-tight">{value ?? 0}</p>
        </div>
    </div>
);

export default function ReviewsPage() {
    const router = useRouter();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState({ type: '', value: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/reviews`);
            if (res.data.success) setReviews(res.data.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, []);

    const handleDelete = async (id, serialId) => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            const deleteId = `REV-${String(serialId).padStart(3, '0')}`;
            await api.delete(`/reviews/${deleteId}`);
            setReviews(prev => prev.filter(r => r.id !== id));
            fetchReviews();
        } catch (err) {
            console.error("Delete Error:", err);
            alert('Failed to delete review.');
        }
    };

    const stats = {
        total: reviews.length,
        fiveStar: reviews.filter(r => r.rating === 5).length,
    };

    const filteredReviews = reviews.filter(r => {
        const matchesSearch = !search ||
            (r.reviewerName || '').toLowerCase().includes(search.toLowerCase()) ||
            (r.comment || '').toLowerCase().includes(search.toLowerCase());
        const matchesFilter =
            activeFilter.type === '' ||
            (activeFilter.type === 'rating' && r.rating === parseInt(activeFilter.value));
        return matchesSearch && matchesFilter;
    });

    const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
    const currentReviews = filteredReviews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, activeFilter]);

    const toggleFilter = (type, value) => {
        setActiveFilter(prev =>
            prev.type === type && prev.value === value ? { type: '', value: '' } : { type, value }
        );
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 tracking-tight leading-tight">Review Management</h1>
                        <p className="text-xs md:text-xs text-gray-400 font-medium mt-0.5">Manage customer reviews</p>
                    </div>
                    <button 
                        onClick={fetchReviews} 
                        className="md:hidden p-3 bg-white hover:bg-gray-50 text-gray-500 rounded-xl border border-gray-100 shadow-sm active:scale-95"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchReviews} className="hidden md:flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-100 transition-all">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button onClick={() => router.push('/reviews/new')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95">
                        <Plus size={14} />
                        Add Review
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-2 gap-4 md:gap-5">
                <StatCard title="Total Reviews" value={stats.total} icon={<MessageSquare size={18} />} bgColor="bg-blue-500"
                    active={activeFilter.type === ''} onClick={() => setActiveFilter({ type: '', value: '' })} />
                <StatCard title="5-Star Ratings" value={stats.fiveStar} icon={<Star size={18} />} bgColor="bg-emerald-500"
                    active={activeFilter.type === 'rating' && activeFilter.value === '5'} onClick={() => toggleFilter('rating', '5')} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex items-center gap-3">
                <Search size={16} className="text-gray-400 shrink-0" />
                <input
                    type="text"
                    placeholder="Search by reviewer name or comment content..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
                />
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                    {filteredReviews.length} RECORDS
                </div>
            </div>

            <div className="space-y-6 pt-4">
                <h2 className="text-sm font-semibold text-gray-700 tracking-tight pl-2 uppercase italic">Review Feed</h2>

                {loading && reviews.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-medium animate-pulse uppercase text-xs tracking-[0.3em]">Syncing Feed...</div>
                ) : currentReviews.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 font-medium uppercase text-xs tracking-[0.3em]">No reviews found</div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {currentReviews.map((item) => (
                                <div key={item.id} className="bg-white rounded-2xl p-4 md:p-8 shadow-sm hover:shadow-md border border-gray-100 hover:border-gray-200 transition-all duration-200 flex flex-col justify-between group h-full">
                                    <div className="space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight line-clamp-1">{item.reviewerName}</h3>
                                                <div className="text-[10px] font-medium text-gray-300 tracking-[0.2em]">ID: REV-{String(item.serialId).padStart(3, '0')}</div>
                                            </div>
                                            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100/50 shrink-0">
                                                <Star size={12} className="text-amber-400 fill-amber-400" />
                                                <span className="text-[10px] font-semibold text-amber-600">{item.rating}.0</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:space-y-3 pt-2">
                                            <div className="flex items-start gap-2 md:gap-4">
                                                <MessageSquare size={14} className="text-indigo-400 mt-1 shrink-0" />
                                                <div className="text-[10px] md:text-[11px] font-medium text-gray-500 leading-relaxed italic line-clamp-3">
                                                    "{item.comment}"
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 md:gap-4 pt-1 md:pt-2">
                                                <div className="flex items-center space-x-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star key={i} size={10} className={i < item.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                                                    ))}
                                                </div>
                                                <span className="text-[9px] font-semibold text-gray-300 uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-8 mt-6 border-t border-gray-50">
                                        <button
                                            onClick={() => router.push(`/reviews/${`REV-${String(item.serialId).padStart(3, '0')}`}`)}
                                            className="bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-400 p-2.5 rounded-xl transition-all shadow-sm border border-slate-100"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => router.push(`/reviews/edit/${`REV-${String(item.serialId).padStart(3, '0')}`}`)}
                                            className="bg-slate-50 hover:bg-amber-500 hover:text-white text-slate-400 p-2.5 rounded-xl transition-all shadow-sm border border-slate-100"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id, item.serialId)}
                                            className="bg-slate-50 hover:bg-red-500 hover:text-white text-slate-400 p-2.5 rounded-xl transition-all shadow-sm border border-slate-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-10 px-2">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredReviews.length)} of {filteredReviews.length} Reviews
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className={`p-2.5 rounded-xl border border-gray-100 transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'bg-white hover:bg-gray-50 text-slate-600 shadow-sm'}`}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <div className="flex items-center gap-1">
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
}
