"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, Phone, Calendar, Clock, MessageSquare, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import api from '../../../../lib/axios';

const API_URL = process.env.NEXT_PUBLIC_API_BASE;

const statusConfig = {
    Pending:   { color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={12} /> },
    Completed: { color: 'bg-green-100 text-green-700',   icon: <CheckCircle2 size={12} /> },
    Cancelled: { color: 'bg-red-100 text-red-700',       icon: <XCircle size={12} /> },
};

export default function CallbackViewPage() {
    const params = useParams();
    const router = useRouter();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get(`/callback-requests/${params.id}`);
                if (res.data.success) setRequest(res.data.data);
            } catch (err) {
                console.error('Fetch Error:', err);
            } finally {
                setLoading(false);
            }
        };
        if (params.id) fetch();
    }, [params.id]);

    const handleStatusUpdate = async (status) => {
        try {
            setUpdating(true);
            const res = await api.patch(`/callback-requests/${params.id}/status`, { status });
            if (res.data.success) setRequest(res.data.data);
        } catch (err) {
            alert('Failed to update status.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    if (!request) return (
        <div className="text-center py-20">
            <h2 className="text-xl font-bold text-gray-800">Request not found</h2>
            <button onClick={() => router.push('/callback-requests')} className="mt-4 text-indigo-600 hover:underline text-sm font-bold">Back to Requests</button>
        </div>
    );

    const sc = statusConfig[request.status] || { color: 'bg-gray-100 text-gray-500', icon: null };

    return (
        <div className="max-w-4xl mx-auto px-4 space-y-4">
            <button onClick={() => router.push('/callback-requests')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-bold">
                <ArrowLeft size={16} /> Back to Requests
            </button>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
                {/* Header */}
                <div className="p-8 border-b border-gray-50 flex items-start justify-between gap-4 bg-gray-50/30">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CR-{String(request.serialId).padStart(2, '0')}</p>
                        <h1 className="text-2xl font-semi text-gray-900">{request.name}</h1>
                        <div className="flex items-center gap-3 mt-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${sc.color}`}>
                                {sc.icon}{request.status}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {['Pending', 'Completed', 'Cancelled'].map(s => (
                            request.status !== s && (
                                <button
                                    key={s}
                                    disabled={updating}
                                    onClick={() => handleStatusUpdate(s)}
                                    className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all disabled:opacity-50"
                                >
                                    Mark as {s}
                                </button>
                            )
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Information</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500"><Phone size={14} /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Phone Number</p>
                                        <p className="text-sm font-bold text-gray-700">{request.contact}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500"><Mail size={14} /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Email Address</p>
                                        <p className="text-sm font-bold text-gray-700">{request.email || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preferred Timing</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500"><Calendar size={14} /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Preferred Date</p>
                                        <p className="text-sm font-bold text-gray-700">{request.preferredDate || 'Any Date'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-500"><Clock size={14} /></div>
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Preferred Time</p>
                                        <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">{request.preferredTime || 'Anytime'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Issue Details</h3>
                            <div className="bg-gray-50/80 rounded-2xl p-6 min-h-[160px]">
                                <div className="flex gap-3 text-gray-400 mb-2"><MessageSquare size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">Description</span></div>
                                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                    {request.issue || 'No specific issue described.'}
                                </p>
                            </div>
                        </section>
                        
                        <div className="text-[10px] text-gray-300 font-bold uppercase tracking-widest text-right">
                            Requested On: {new Date(request.createdAt).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-50 flex justify-end gap-3 bg-gray-50/20">
                    <button 
                        onClick={() => router.push('/callback-requests')}
                        className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-gray-600 font-bold text-xs border border-gray-100 hover:border-gray-200 transition-all"
                    >
                        Back to List
                    </button>
                </div>
            </div>
        </div>
    );
}
