"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { User, Mail, Phone, Lock, Shield, Eye, EyeOff, ArrowLeft, CheckCircle2, XCircle, Briefcase, UserCircle, Smartphone, ChevronLeft, Save, RefreshCw } from 'lucide-react';
import api from '../../../../../lib/axios';

export default function EditEmployeePage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        phone: '',
        password: '',
        role: 'Staff',
        status: 'Active'
    });

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const res = await api.get(`/employees/${id}`);
                if (res.data.success) {
                    setFormData(res.data.data);
                }
            } catch (err) {
                setFeedback({ type: 'error', message: 'Employee not found.' });
            } finally {
                setLoading(false);
            }
        };
        fetchEmployee();
    }, [id]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setFeedback({ type: '', message: '' });

        try {
            const res = await api.put(`/employees/${id}`, formData);
            if (res.data.success) {
                setFeedback({ type: 'success', message: 'Employee updated successfully!' });
                setTimeout(() => router.push('/employees'), 1500);
            }
        } catch (err) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update employee.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <RefreshCw size={32} className="text-indigo-600 animate-spin mb-4" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Retrieving Staff Record...</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300 pb-20">
            <div className="mb-2 flex items-end justify-between">
                <div>
                   <button onClick={() => router.push('/employees')} className="mb-2 flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors font-bold text-sm group">
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Team</span>
                    </button>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight">Edit Profile</h1>
                    <p className="text-gray-400 font-medium text-[11px] mt-1">Manage staff credentials and access level</p>
                </div>
            </div>

            {feedback.message && (
                <div className={`mb-8 p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${feedback.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
                    {feedback.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                    {feedback.message}
                </div>
            )}

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Personal Contact */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-5">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <UserCircle size={20} />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Contact Information</h3>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input 
                                    type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full pl-12 pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm"
                                    placeholder="Enter full name"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Work Email</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input 
                                    type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                                    className="w-full pl-12 pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm"
                                    placeholder="staff@crm.local"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Username</label>
                                <div className="relative">
                                    <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input 
                                        type="text" value={formData.username || ''} onChange={e => setFormData({...formData, username: e.target.value})}
                                        className="w-full pl-12 pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm"
                                        placeholder="johndoe"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input 
                                        type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})}
                                        className="w-full pl-12 pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm"
                                        placeholder="+91 ...."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Roles & Security */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-5">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Shield size={20} />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Account Security</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Role</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                    <select 
                                        value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                                        className="w-full pl-12 pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm appearance-none"
                                    >
                                        <option value="Staff">Staff Member</option>
                                        <option value="Admin">Administrator</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Status</label>
                                <select 
                                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                                    className="w-full px-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm"
                                >
                                    <option value="Active">Operational</option>
                                    <option value="Inactive">Suspended</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-4 border-t border-gray-50">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Update Password (optional)</label>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                                    className="w-full pl-12 pr-12 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm"
                                    placeholder="••••••••"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button disabled={saving} type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-3">
                                {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={18} />}
                                {saving ? 'Synchronizing Changes...' : 'Save Updated Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
