"use client";
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Eye, MapPin, Mail, Phone, RefreshCw, ChevronLeft, ChevronRight, User, MessageSquare, ShoppingBag, Building2, Globe, Clock, Ban, ShieldCheck, ShieldAlert, Copy, X, Check, CreditCard } from 'lucide-react';
import api from '@/lib/axios';
import { useRouter, useSearchParams } from 'next/navigation';

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

const CreateShopPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [formData, setFormData] = useState({
        name: '', ownerName: '', email: '', phone: '', 
        gstNumber: '', upiId: '', userType: 'retailers', address: ''
    });
    const [showCredentials, setShowCredentials] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (searchParams.get('prefill') === '1') {
            setFormData(prev => ({
                ...prev,
                name: searchParams.get('name') || '',
                ownerName: searchParams.get('ownerName') || '',
                email: searchParams.get('email') || '',
                phone: searchParams.get('phone') || '',
                address: searchParams.get('address') || '',
            }));
        }
    }, [searchParams]);

    const setField = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

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
            const res = await api.post('/shops', formData);
            if (res.data.success) {
                setShowCredentials(res.data.data);
                setFormData({ name: '', address: '', phone: '', email: '', ownerName: '', gstNumber: '', upiId: '', userType: 'retailers' });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to create shop.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!showCredentials) return;
        const text = `Shop ID: ${showCredentials.shop?.id}\nUsername: ${showCredentials.generatedUsername}\nEmail: ${showCredentials.shop?.email}\nPassword: ${showCredentials.generatedPassword}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleModalClose = () => {
        setShowCredentials(null);
        router.push('/shops');
    };

    return (
        <div className="min-h-screen bg-[#f8f9fc] animate-in fade-in zoom-in-95 duration-300">
            <div className="max-w-xl mx-auto">
                <div className="mb-6">
                    <button onClick={() => router.push('/shops')} className="mb-3 flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors font-bold text-sm group">
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Shops</span>
                    </button>
                    <h1 className="text-2xl font-semi text-slate-800 tracking-tight">Create New Shop</h1>
                    <p className="text-gray-400 font-medium text-[11px] mt-1">Register a new business shop in the system</p>
                </div>

                {feedback.message && (
                    <div className={`mb-4 p-4 rounded-2xl border text-xs font-bold ${feedback.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                        {feedback.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <Field label="Shop Name *" icon={<ShoppingBag size={18} />}>
                            <input type="text" value={formData.name} onChange={setField('name')} placeholder="Enter shop name" required className={inputClass()} />
                        </Field>
                        <Field label="Owner Name *" icon={<User size={18} />}>
                            <input type="text" value={formData.ownerName} onChange={setField('ownerName')} placeholder="Enter Full name" required className={inputClass()} />
                        </Field>
                        <Field label="Email *" icon={<Mail size={18} />}>
                            <input type="email" value={formData.email} onChange={setField('email')} placeholder="owner@example.com" required className={inputClass()} />
                        </Field>
                        <Field label="Phone *" icon={<Phone size={18} />}>
                            <input type="text" value={formData.phone} onChange={setField('phone')} placeholder="+1 555-123-4567" required className={inputClass()} />
                        </Field>
                        <Field label="GST Number" icon={<Building2 size={18} />}>
                            <input type="text" value={formData.gstNumber} onChange={setField('gstNumber')} placeholder="GSTIN123456789" className={inputClass()} />
                        </Field>
                        <Field label="UPI ID *" icon={<CreditCard size={18} />}>
                            <input type="text" value={formData.upiId} onChange={setField('upiId')} placeholder="owner@okaxis" required className={inputClass()} />
                        </Field>
                        <Field label="Type *" icon={<Globe size={18} />}>
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

                    <Field label="Address *" icon={<MapPin size={18} />}>
                        <textarea
                            value={formData.address}
                            onChange={setField('address')}
                            placeholder="123 Main St, City, State 12345"
                            rows={3}
                            required
                            className="w-full pl-12 pr-5 pt-4 pb-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm resize-none"
                        />
                    </Field>

                    <div className="pt-4 flex gap-3">
                        <button type="submit" disabled={loading} className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${loading ? 'opacity-70' : ''}`}>
                            {loading ? 'Processing...' : 'Create Shop'}
                        </button>
                        <button type="button" onClick={() => router.push('/shops')} className="px-8 py-4 rounded-xl text-gray-400 hover:text-gray-600 font-semibold text-sm border border-gray-100 hover:border-gray-200 transition-all">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            <CredentialsModal 
                data={showCredentials} 
                onClose={handleModalClose} 
                onCopy={handleCopy}
                copied={copied}
            />
        </div>
    );
};

const CredentialBox = ({ label, value }) => (
    <div className="bg-blue-50/30 border border-blue-100/50 rounded-2xl p-5 space-y-2 group hover:bg-white hover:border-blue-200 transition-all cursor-default">
        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">{label}</label>
        <div className="text-[13px] font-bold text-blue-900 break-all leading-tight">{value || 'N/A'}</div>
    </div>
);

const CredentialsModal = ({ data, onClose, onCopy, copied }) => {
    if (!data) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-full transition-all">
                    <X size={20} />
                </button>
                
                <div className="p-10 pt-12 space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-blue-600 tracking-tight">Credentials Generated!</h2>
                        <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-md">
                            Please provide these credentials to the new shop owner. They will need these to access their shop dashboard. 
                            They can use the <span className="text-gray-600 font-bold">Email</span> or the <span className="text-gray-600 font-bold">Username</span> to log in.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <CredentialBox label="Shop ID" value={data.shop?.id} />
                        <CredentialBox label="Username" value={data.generatedUsername} />
                        <CredentialBox label="Email" value={data.shop?.email} />
                        <CredentialBox label="Password" value={data.generatedPassword} />
                    </div>

                    <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                        <div className="shrink-0 pt-1"><ShieldAlert size={16} className="text-amber-500" /></div>
                        <p className="text-[11px] font-bold text-amber-700/80 leading-relaxed italic">
                            <span className="text-amber-800 font-black not-italic">Important:</span> These credentials are automatically generated. Please ensure the shop owner receives them securely and changes their password upon first login.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button 
                            onClick={onCopy}
                            className="flex items-center gap-2 px-8 py-4 rounded-xl text-gray-500 hover:text-blue-600 font-bold text-sm bg-gray-50 hover:bg-blue-50/50 border border-gray-100 transition-all active:scale-95"
                        >
                            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                            {copied ? 'Copied' : 'Copy Credentials'}
                        </button>
                        <button 
                            onClick={onClose}
                            className="px-10 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateShopPage;
