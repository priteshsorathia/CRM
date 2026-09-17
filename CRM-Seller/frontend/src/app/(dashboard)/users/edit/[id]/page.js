"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, User, Mail, Phone, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../../../../../lib/axios';

const API_URL = process.env.NEXT_PUBLIC_API_BASE;

const inputClass = (hasIcon = true) =>
  `w-full ${hasIcon ? 'pl-12' : 'pl-5'} pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm`;

const Field = ({ label, icon, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      {icon && <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">{icon}</div>}
      {children}
    </div>
  </div>
);

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [shops, setShops] = useState([]);
  const [formData, setFormData] = useState({
    name: '', email: '', username: '', phone: '', role: 'Staff', 
    status: 'Active', shopId: '', userType: 'retailers', isBlocked: false, password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, shopsRes] = await Promise.all([
          api.get(`/users/${params.id}`),
          api.get(`/shops`)
        ]);

        if (shopsRes.data.success) {
          setShops(shopsRes.data.data || []);
        }

        if (userRes.data.success) {
          const u = userRes.data.data;
          setFormData({
            name: u.name || '',
            email: u.email || '',
            username: u.username || '',
            phone: u.phone || '',
            role: u.role || 'Staff',
            status: u.isBlocked ? 'Inactive' : 'Active',
            shopId: u.shopId || '',
            userType: u.userType || 'retailers',
            isBlocked: u.isBlocked || false,
            password: u.password || ''
          });
        }
      } catch (err) {
        console.error('Fetch Error:', err);
      } finally {
        setFetching(false);
      }
    };
    if (params.id) fetchData();
  }, [params.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    try {
      setLoading(true);
      const res = await api.put(`/users/${params.id}`, formData);
      if (res.data.success) {
        setFeedback({ type: 'success', message: 'Customer updated successfully!' });
        setTimeout(() => router.push('/users'), 1200);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update user.' });
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  if (fetching) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] animate-in fade-in duration-300">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <button onClick={() => router.push('/users')} className="mb-3 flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors font-bold text-sm group">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Edit Customer</h1>
          <p className="text-gray-400 font-medium text-[11px] mt-1">Update the details for this customer account</p>
        </div>

        {feedback.message && (
          <div className={`mb-4 p-4 rounded-2xl border text-xs font-bold ${feedback.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-6">
          <Field label="Full Name *" icon={<User size={18} />}>
            <input type="text" value={formData.name} onChange={set('name')} placeholder="e.g., John Doe" required className={inputClass()} />
          </Field>
          <Field label="Email Address *" icon={<Mail size={18} />}>
            <input type="email" value={formData.email} onChange={set('email')} placeholder="e.g., john@example.com" required className={inputClass()} />
          </Field>
          <Field label="Username" icon={<ShieldCheck size={18} />}>
            <input type="text" value={formData.username} onChange={set('username')} placeholder="e.g., johndoe" className={inputClass()} />
          </Field>
          <Field label="Phone Number" icon={<Phone size={18} />}>
            <input type="text" value={formData.phone} onChange={set('phone')} placeholder="e.g., +91 9876543210" className={inputClass()} />
          </Field>
          <Field label="New Password (Leave blank to keep current)" icon={<Lock size={18} />}>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={formData.password} 
                onChange={set('password')} 
                placeholder="••••••••" 
                className={`${inputClass()} pr-12`} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          <Field label="Associated Shop" icon={<ShieldCheck size={18} />}>
            <select value={formData.shopId} onChange={set('shopId')} className={inputClass()}>
              <option value="">No Shop (Central Admin)</option>
              {shops.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Customer Type">
              <select value={formData.userType} onChange={set('userType')} className={`${inputClass(false)} appearance-none`}>
                <option value="retailers">Retailers</option>
                <option value="restaurants">Restaurants</option>
                <option value="services">Services</option>
              </select>
            </Field>
            <Field label="Account Status">
              <select 
                value={formData.isBlocked ? 'true' : 'false'} 
                onChange={(e) => setFormData(p => ({ ...p, isBlocked: e.target.value === 'true' }))} 
                className={`${inputClass(false)} appearance-none`}
              >
                <option value="false">Active (Allowed)</option>
                <option value="true">Blocked (No Access)</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Customer Role">
              <select value={formData.role} onChange={set('role')} className={`${inputClass(false)} appearance-none`}>
                <option value="Staff">Staff</option>
                <option value="Seller">Seller</option>
                <option value="Admin">Admin</option>
                <option value="shop_owner">Shop Owner</option>
              </select>
            </Field>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="submit" disabled={loading} className={`flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98] ${loading ? 'opacity-70' : ''}`}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => router.push('/users')} className="px-6 py-4 rounded-2xl text-gray-400 hover:text-gray-600 font-bold text-xs border border-gray-100 hover:border-gray-200 transition-all">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
