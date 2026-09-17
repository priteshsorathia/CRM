"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, User, MessageSquare, Star, Trash2, Pencil, CheckCircle2, XCircle, Clock } from 'lucide-react';
import api from '../../../../lib/axios';
import { useRouter, useParams } from 'next/navigation';


export default function ReviewDetailsPage() {
    const router = useRouter();
    const { id } = useParams();
    const [review, setReview] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const res = await api.get(`/reviews/${id}`);
                if (res.data.success) setReview(res.data.data);
            } catch (err) {
                console.error("Fetch Review Error:", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchReview();
    }, [id]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            await api.delete(`/reviews/${id}`);
            router.push('/reviews');
        } catch (err) {
            console.error("Delete Error:", err);
            alert('Failed to delete review.');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Loading Review Details</p>
            </div>
        </div>
    );

    if (!review) return (
        <div className="max-w-2xl mx-auto py-20 text-center">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Review Not Found</h1>
            <p className="text-gray-400 mt-2">The review details you're looking for aren't available.</p>
            <button onClick={() => router.push('/reviews')} className="mt-8 text-indigo-600 font-bold uppercase tracking-widest text-xs">Back to List</button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-0 pb-20">
            <button onClick={() => router.push('/reviews')} className="mb-8 flex items-center space-x-2 text-gray-400 hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest group">
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to All Reviews</span>
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center space-x-3 mb-4">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
                            ID: REV-{String(review.serialId).padStart(3, '0')}
                        </span>
                    </div>
                    <h1 className="text-2xl font-semi text-slate-800 tracking-tight leading-none mb-4">
                        {review.reviewerName}
                    </h1>
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={18} className={review.rating > i ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                            ))}
                        </div>
                        <span className="text-sm font-bold text-slate-400">({review.rating}/5 Rating)</span>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => router.push(`/reviews/edit/${id}`)}
                        className="flex items-center space-x-2 bg-slate-50 text-slate-400 border border-slate-100 hover:border-amber-500 hover:bg-amber-500 hover:text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm"
                    >
                        <Pencil size={16} />
                        <span>Edit Review</span>
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="flex items-center space-x-2 bg-slate-50 text-slate-400 border border-slate-100 hover:border-red-500 hover:bg-red-500 hover:text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm"
                    >
                        <Trash2 size={16} />
                        <span>Delete Review</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 p-6 md:p-10 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <MessageSquare size={120} />
                        </div>
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-8">Detailed Comment</h2>
                        <p className="text-base text-slate-700 leading-relaxed">
                            "{review.comment}"
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
                        <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6">Review Timeline</h2>
                        <div className="space-y-6">
                            <div className="flex items-start space-x-4">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Calendar size={18} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Submitted On</p>
                                    <p className="text-sm text-slate-700">{new Date(review.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><User size={18} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Author</p>
                                    <p className="text-sm text-slate-700">{review.reviewerName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
