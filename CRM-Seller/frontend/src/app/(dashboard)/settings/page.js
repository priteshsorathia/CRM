"use client";
import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Smartphone, CheckCircle, ArrowLeft } from 'lucide-react';
import api from '../../../lib/axios';
import Link from 'next/link';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    username: '',
    phone: '',
    type: '' // Added type
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setFormData({
          id: user.id || '',
          name: user.name || '',
          email: user.email || '',
          username: user.username || '',
          phone: user.phone || '',
          type: user.type || '' // Capture the type
        });
      } catch (err) {
        console.error("Error parsing user data:", err);
      }
    }
    setFetching(false);
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await api.put('/auth/update-profile', formData);
      if (res.data.success) {
        setFeedback({ type: 'success', message: 'Profile updated successfully!' });
        // Preserve the type when saving back to localStorage
        const updatedUser = { ...res.data.user, type: formData.type };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Brief delay then reload to sync the Header/Sidebar
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] animate-in fade-in duration-500">
      
      {/* Navigation */}
      <div className="w-full max-w-xl mx-auto px-4 md:px-0 mb-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 text-slate-400 hover:text-slate-600 transition-colors font-semibold text-xs md:text-sm">
           <ArrowLeft size={16} />
           <span className="hidden sm:inline">Back to Home</span>
           <span className="sm:hidden text-[10px]">BACK</span>
        </Link>
        <h1 className="text-xl md:text-2xl font-semi text-slate-800 tracking-tight leading-tight">Account Settings</h1>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {feedback.message && (
          <div className={`p-4 rounded-2xl border ${feedback.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'} font-medium text-xs flex items-center`}>
            <CheckCircle className="mr-3 flex-shrink-0" size={16} />
            {feedback.message}
          </div>
        )}

        {/* Simplified Content Box */}
        <div className="bg-white rounded-[2rem] md:rounded-3xl border border-gray-100 p-6 md:p-8 pt-10 mx-4 md:mx-0">
          <div className="space-y-8">
             
             {/* Name */}
             <div className="space-y-2">
               <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                    <User size={18} />
                 </div>
                 <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-12 pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 focus:ring-0 outline-none transition-all font-semibold text-slate-700 text-sm"
                  placeholder="John Doe"
                />
               </div>
             </div>

             {/* Username */}
             <div className="space-y-2">
               <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Username</label>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                    <Shield size={18} />
                 </div>
                 <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full pl-12 pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 focus:ring-0 outline-none transition-all font-semibold text-slate-700 text-sm"
                  placeholder="username"
                />
               </div>
             </div>

             {/* Email */}
             <div className="space-y-2">
               <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                    <Mail size={18} />
                 </div>
                 <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-12 pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 focus:ring-0 outline-none transition-all font-semibold text-slate-700 text-sm"
                  placeholder="email@example.com"
                />
               </div>
             </div>

             {/* Phone */}
             <div className="space-y-2">
               <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
               <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">
                    <Smartphone size={18} />
                 </div>
                 <input 
                  type="text" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-12 pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 focus:ring-0 outline-none transition-all font-semibold text-slate-700 text-sm"
                  placeholder="+91 000 000 0000"
                />
               </div>
             </div>

             <div className=""> 
                <button 
                  onClick={handleUpdate}
                  disabled={loading}
                  className={`w-full bg-[#2563eb] hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-500/10 active:scale-[0.98] ${loading ? 'opacity-70' : ''}`}
                >
                   {loading ? 'Sychronizing...' : 'Save My Information'}
                </button>
             </div>
          </div>
        </div>

        {/* Subtle Footer */}
        <div className="text-center space-y-4 opacity-30">
           <div className="text-[9px] font-medium text-gray-400 uppercase tracking-[0.3em]">
             © 2026 CRM Private Limited
           </div>
        </div>
      </div>
    </div>
  );
}
