"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Shield, CheckCircle2, XCircle, Calendar, User, AtSign, Pencil } from 'lucide-react';
import api from '../../../../lib/axios';

const API_URL = process.env.NEXT_PUBLIC_API_BASE;

const roleColors = {
  Admin: 'bg-indigo-100 text-indigo-700',
  Seller: 'bg-yellow-100 text-yellow-700',
  Staff: 'bg-gray-100 text-gray-600',
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/${params.id}`);
        if (res.data.success) setUser(res.data.data);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchUser();
  }, [params.id]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!user) return (
    <div className="text-center py-20">
      <h2 className="text-xl font-bold text-gray-800">Customer not found</h2>
      <button onClick={() => router.push('/users')} className="mt-4 text-indigo-600 hover:underline text-sm font-bold">Back</button>
    </div>
  );

  const isActive = user.status === 'Active';

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-4">
      <button onClick={() => router.push('/users')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-bold">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black">
              {(user.name || '?').charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl  text-gray-900">{user.name}</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                UR-{String(user.serialId).padStart(2, '0')} · {user.role}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>
              {user.role}
            </span>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isActive ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
              {user.status}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
            <p className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <Mail size={14} className="text-gray-400" /> {user.email}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
            <p className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <Phone size={14} className="text-gray-400" /> {user.phone || '—'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Username</p>
            <p className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <AtSign size={14} className="text-gray-400" /> {user.username || '—'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Access Level</p>
            <p className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <Shield size={14} className="text-gray-400" /> {user.role}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Member Since</p>
            <p className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer ID</p>
            <p className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <User size={14} className="text-gray-400" /> UR-{String(user.serialId).padStart(2, '0')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-50 flex justify-end gap-3">
          <button onClick={() => router.push('/users')} className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-gray-600 font-bold text-xs border border-gray-100 hover:border-gray-200 transition-all">
            Back
          </button>
          <button onClick={() => router.push(`/users/edit/UR-${String(user.serialId).padStart(2, '0')}`)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95">
            <Pencil size={14} /> Edit Customer
          </button>
        </div>
      </div>
    </div>
  );
}
