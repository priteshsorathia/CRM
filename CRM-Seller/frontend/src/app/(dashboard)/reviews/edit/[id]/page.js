"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, User, MessageSquare, Star, Save, Filter, Clock, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../../../../lib/axios';
import { useRouter, useParams } from 'next/navigation';


const Field = ({ label, icon, children }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
            {icon && <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">{icon}</div>}
            {children}
        </div>
    </div>
);

const inputClass = (hasIcon = true) =>
    `w-full ${hasIcon ? 'pl-12' : 'pl-5'} pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm`;

export default function EditReviewPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [formData, setFormData] = useState({
        reviewerName: '', rating: 5, comment: ''
    });

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const res = await api.get(`/reviews/${id}`);
                if (res.data.success) {
                    const { reviewerName, rating, comment } = res.data.data;
                    setFormData({ reviewerName, rating, comment });
                }
            } catch (err) {
                console.error("Fetch Review Error:", err);
                setFeedback({ type: 'error', message: 'Failed to load review details.' });
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchReview();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFeedback({ type: '', message: '' });
        try {
            const res = await api.put(`/reviews/${id}`, formData);
            if (res.data.success) {
                setFeedback({ type: 'success', message: 'Review updated successfully!' });
                setTimeout(() => router.push('/reviews'), 1000);
            }
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update review.' });
        } finally {
            setSaving(false);
        }
    };

    const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Loading Review Data</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-xl mx-auto pb-20"> 
            <button onClick={() => router.push('/reviews')} className="mb-2 flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors font-bold text-xs group">
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Reviews</span>
            </button>
            <div className="mb-2">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight ml-2">Edit Review</h1>
                <p className="text-gray-400 font-medium text-xs mt-1 uppercase tracking-widest leading-none ml-2">ID: {id}</p> 
            </div>

            {feedback.message && (
                <div className={`mb-6 p-4 rounded-2xl border text-xs font-bold leading-relaxed ${feedback.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                    {feedback.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 space-y-4">
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
                        placeholder="Update the review content..."
                        rows={6}
                        required
                        className="w-full pl-12 pr-5 pt-4 pb-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm resize-none"
                    />
                </Field>

                <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-6">    
                    <button type="submit" disabled={saving} className={`flex-1 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98] ${saving ? 'opacity-70' : ''}`}>
                        <Save size={16} />
                        <span>{saving ? 'Saving...' : 'Update Review'}</span>
                    </button>
                    <button type="button" onClick={() => router.push('/reviews')} className="md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-gray-400 hover:text-gray-600 font-bold text-xs border border-gray-100 hover:border-gray-200 transition-all text-center">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
