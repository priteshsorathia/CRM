"use client";
import React, { useState } from 'react';
import { ChevronLeft, UserCircle, User, Mail, Shield, Smartphone, Lock, EyeOff, Eye, RefreshCw, Plus, Briefcase } from 'lucide-react';
import api from '../../../../lib/axios';
import { useRouter } from 'next/navigation';

const CreateEmployeePage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', username: '', phone: '', role: 'Staff', password: '', status: 'Active'
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const validateForm = () => {
        let newErrors = {};
        if (!formData.name) newErrors.name = 'Full name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
        if (!formData.username) newErrors.username = 'Username is required';
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Min 6 characters';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        try {
            setLoading(true);
            const res = await api.post(`/employees`, formData);
            if (res.data.success) {
                router.push('/employees');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add employee');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fc] animate-in fade-in zoom-in-95 duration-300">
            <div className="max-w-4xl mx-auto">
                <div className="mb-2 flex items-end justify-between">
                    <div>
                        <button onClick={() => router.push('/employees')} className="mb-2 flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors font-bold text-sm group">
                            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Team</span>
                        </button>
                        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Hire Employee</h1>
                        <p className="text-gray-400 font-medium text-xs mt-1">Register a new staff member with dashboard access</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Personal Contact */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-5">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <UserCircle size={20} />
                            </div>
                            <h3 className="text-[11px] font-semibold text-slate-800 uppercase tracking-widest">Contact Information</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Full Name *</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input
                                        type="text" value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className={`w-full pl-12 pr-5 py-4 bg-gray-50/50 border ${errors.name ? 'border-red-400' : 'border-transparent'} rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-semibold text-slate-700 text-sm`}
                                        placeholder="Enter name"
                                    />
                                </div>
                                {errors.name && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.name}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Work Email *</label>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input
                                        type="email" value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full pl-12 pr-5 py-4 bg-gray-50/50 border ${errors.email ? 'border-red-400' : 'border-transparent'} rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-semibold text-slate-700 text-sm`}
                                        placeholder="staff@crm.local"
                                    />
                                </div>
                                {errors.email && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.email}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Username *</label>
                                    <div className="relative">
                                        <Shield className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input
                                            type="text" value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                            className={`w-full pl-12 pr-5 py-4 bg-gray-50/50 border ${errors.username ? 'border-red-400' : 'border-transparent'} rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-semibold text-slate-700 text-sm`}
                                            placeholder="johndoe"
                                        />
                                    </div>
                                    {errors.username && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.username}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Phone *</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                        <input
                                            type="text" value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                                            className={`w-full pl-12 pr-5 py-4 bg-gray-50/50 border ${errors.phone ? 'border-red-400' : 'border-transparent'} rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-semibold text-slate-700 text-sm`}
                                            placeholder="9876543210"
                                            maxLength={10}
                                        />
                                    </div>
                                    {errors.phone && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.phone}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Role & Security */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-10 space-y-8">
                        <div className="flex items-center gap-3 border-b border-gray-50 pb-5">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Lock size={20} />
                            </div>
                            <h3 className="text-[11px] font-semibold text-slate-800 uppercase tracking-widest">Account Security</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Employee Role *</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full pl-12 pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-semibold text-slate-700 text-sm appearance-none"
                                    >
                                        <option value="Staff">Staff Member</option>
                                        <option value="Admin">Administrator</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Define Password *</label>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className={`w-full pl-12 pr-12 py-4 bg-gray-50/50 border ${errors.password ? 'border-red-400' : 'border-transparent'} rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-semibold text-slate-700 text-sm`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.password}</p>}
                            </div>
                            
                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                                <Shield className="text-amber-500 shrink-0 mt-0.5" size={16} />
                                <p className="text-[10px] font-medium text-amber-700/80 leading-relaxed italic">
                                    Employee will use their email or username and this password to login to the SELLER DASHBOARD.
                                </p>
                            </div>
                            
                            <div className=""> 
                                <button disabled={loading} type="submit" className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-semibold text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-3">
                                    {loading ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={18} />}
                                    {loading ? 'Processing Hire...' : 'Finalize Staff Hire'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEmployeePage;
