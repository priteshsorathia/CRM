"use client";
import React, { useState } from 'react';
import { ChevronLeft, User, Star, MessageSquare } from 'lucide-react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

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

export default function NewReviewPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [formData, setFormData] = useState({
        reviewerName: '', rating: 5, comment: ''
    });

    const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ type: '', message: '' });
        try {
            setLoading(true);
            const res = await api.post(`/reviews`, formData);
            if (res.data.success) {
                setFeedback({ type: 'success', message: 'Review successfully submitted!' });
                setTimeout(() => router.push('/reviews'), 1200);
            }
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to submit review.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fc] animate-in fade-in zoom-in-95 duration-300">
            <div className="max-w-xl mx-auto">
                <div className="mb-6">
                    <button onClick={() => router.push('/reviews')} className="mb-3 flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors font-bold text-sm group">
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Reviews</span>
                    </button>
                    <h1 className="text-4xl font-semibold text-slate-800 tracking-tight">Add New Review</h1>
                    <p className="text-gray-400 font-medium text-[11px] mt-1">Submit a manual review entry</p>
                </div>

                {feedback.message && (
                    <div className={`mb-4 p-4 rounded-2xl border text-xs font-bold ${feedback.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                        {feedback.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-6">
                    <Field label="Reviewer Name *" icon={<User size={18} />}>
                        <input type="text" value={formData.reviewerName} onChange={set('reviewerName')} placeholder="e.g., Jane Smith" required className={inputClass()} />
                    </Field>

                    <Field label="Rating (1-5) *" icon={<Star size={18} />}>
                        <select value={formData.rating} onChange={set('rating')} className={`${inputClass()} appearance-none`}>
                            <option value="5">5 - Excellent</option>
                            <option value="4">4 - Very Good</option>
                            <option value="3">3 - Good</option>
                            <option value="2">2 - Fair</option>
                            <option value="1">1 - Poor</option>
                        </select>
                    </Field>

                    <Field label="Comment *" icon={<MessageSquare size={18} />}>
                        <textarea
                            value={formData.comment}
                            onChange={set('comment')}
                            placeholder="Write the review content here..."
                            rows={4}
                            required
                            className="w-full pl-12 pr-5 pt-4 pb-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-semibold text-slate-700 text-sm resize-none"
                        />
                    </Field>

                    <div className="pt-4 flex gap-3">
                        <button type="submit" disabled={loading} className={`flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98] ${loading ? 'opacity-70' : ''}`}>
                            {loading ? 'Saving...' : 'Save Review'}
                        </button>
                        <button type="button" onClick={() => router.push('/reviews')} className="px-6 py-4 rounded-2xl text-gray-400 hover:text-gray-600 font-semibold text-xs border border-gray-100 hover:border-gray-200 transition-all">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
