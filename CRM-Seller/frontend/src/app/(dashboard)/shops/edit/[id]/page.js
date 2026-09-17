"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ShoppingBag, MapPin, Phone, Mail, Save, X, AlertCircle, Building2, Globe, User, CreditCard } from 'lucide-react';
import api from '../../../../../lib/axios';


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

export default function ShopEditPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [formData, setFormData] = useState({
        name: '', address: '', phone: '', email: '',
        ownerName: '', gstNumber: '', upiId: '', userType: 'retailers',
        isBlocked: false
    });

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get(`/shops/${params.id}`);
                if (res.data.success) {
                    const d = res.data.data;
                    setFormData({
                        name: d.name || '',
                        address: d.address || d.location || '',
                        phone: d.phone || '',
                        email: d.email || '',
                        ownerName: d.ownerName || '',
                        gstNumber: d.gstNumber || '',
                        upiId: d.upiId || '',
                        userType: d.userType || 'retailers',
                        isBlocked: d.isBlocked === true || d.status === 'Blocked' || d.status === 'Inactive'
                    });
                }
            } catch (err) {
                console.error('Fetch Error:', err);
            } finally {
                setFetching(false);
            }
        };
        if (params.id) fetch();
    }, [params.id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFeedback({ type: '', message: '' });

        if (!formData.name || !formData.ownerName || !formData.address || !formData.phone || !formData.email || !formData.upiId) {
            setFeedback({ type: 'error', message: 'All fields are required except GST number.' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setFeedback({ type: 'error', message: 'Invalid email format.' });
            return;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(formData.phone)) {
            setFeedback({ type: 'error', message: 'Phone number must be exactly 10 digits.' });
            return;
        }

        if (formData.gstNumber) {
            const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstRegex.test(formData.gstNumber.toUpperCase())) {
                setFeedback({ type: 'error', message: 'Invalid GST format. (e.g., 22AAAAA0000A1Z5)' });
                return;
            }
        }

        try {
            setLoading(true);
            const res = await api.put(`/shops/${params.id}`, formData);
            if (res.data.success) {
                setFeedback({ type: 'success', message: 'Shop profile updated successfully!' });
                setTimeout(() => router.push('/shops'), 1200);
            }
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update shop.' });
        } finally {
            setLoading(false);
        }
    };

    const setField = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

    if (fetching) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8f9fc] animate-in fade-in zoom-in-95 duration-300 pb-20">
            <div className="max-w-xl mx-auto">
                <div className="mb-6">
                    <button onClick={() => router.push('/shops')} className="mb-3 flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors font-bold text-sm group">
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Shops</span>
                    </button>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Edit Shop</h1>
                    <p className="text-gray-400 font-medium text-xs mt-1">Modify shop details and contact information</p>
                </div>

                {feedback.message && (
                    <div className={`mb-4 p-4 rounded-2xl border text-xs font-bold ${feedback.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                        {feedback.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <Field label="Shop Name" icon={<ShoppingBag size={18} />}>
                            <input type="text" value={formData.name} onChange={setField('name')} placeholder="Shop Name" required className={inputClass()} />
                        </Field>
                        <Field label="Owner Name" icon={<User size={18} />}>
                            <input type="text" value={formData.ownerName} onChange={setField('ownerName')} placeholder="Owner Name" required className={inputClass()} />
                        </Field>
                        <Field label="Email" icon={<Mail size={18} />}>
                            <input type="email" value={formData.email} onChange={setField('email')} placeholder="Email" required className={inputClass()} />
                        </Field>
                        <Field label="Phone" icon={<Phone size={18} />}>
                            <input type="text" value={formData.phone} onChange={setField('phone')} placeholder="Phone" required className={inputClass()} />
                        </Field>
                        <Field label="GST Number" icon={<Building2 size={18} />}>
                            <input type="text" value={formData.gstNumber} onChange={setField('gstNumber')} placeholder="GST Number" className={inputClass()} />
                        </Field>
                        <Field label="UPI ID" icon={<CreditCard size={18} />}>
                            <input type="text" value={formData.upiId} onChange={setField('upiId')} placeholder="owner@okaxis" required className={inputClass()} />
                        </Field>
                        <Field label="Type" icon={<Globe size={18} />}>
                            <select
                                value={formData.userType}
                                onChange={setField('userType')}
                                required
                                className={inputClass()}
                            >
                                <option value="retailers">Retailers</option>
                                <option value="restaurants">Restaurants</option>
                                <option value="services">Services</option>
                            </select>
                        </Field>
                    </div>

                    <Field label="Address" icon={<MapPin size={18} />}>
                        <textarea
                            value={formData.address}
                            onChange={setField('address')}
                            placeholder="Address"
                            rows={3}
                            required
                            className="w-full pl-12 pr-5 pt-4 pb-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm resize-none"
                        />
                    </Field>

                    <div className="flex items-center gap-3 px-1">
                        <input
                            type="checkbox"
                            id="isBlocked"
                            checked={formData.isBlocked}
                            onChange={(e) => setFormData(prev => ({ ...prev, isBlocked: e.target.checked }))}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="isBlocked" className="text-sm font-bold text-gray-600 cursor-pointer">Block this shop</label>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-black text-sm transition-all active:scale-[0.98] ${loading ? 'opacity-70' : ''}`}
                        >
                            {loading ? 'Processing...' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/shops')}
                            className="px-8 py-4 rounded-xl text-gray-400 hover:text-gray-600 font-bold text-sm border border-gray-100 hover:border-gray-200 transition-all">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
