"use client";
import React, { useState, useEffect, use } from 'react';
import api from '../../../../lib/axios';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  UserCog,
  Mail,
  Phone,
  User,
  Shield,
  Briefcase,
  Calendar,
  Pencil,
  Loader2,
} from 'lucide-react';

const roleColors = {
  Admin: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Staff: 'bg-blue-100 text-blue-700 border-blue-200',
  SuperAdmin: 'bg-purple-100 text-purple-700 border-purple-200',
};

const statusColors = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-700',
};

export default function ViewEmployeePage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await api.get(`/employees/${id}`);
        if (res.data.success) setEmployee(res.data.data);
      } catch (err) {
        console.error('Fetch Error:', err);
        router.push('/employees');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-800 mb-2">Employee Not Found</h1>
          <button onClick={() => router.push('/employees')} className="text-indigo-600 font-bold hover:underline">Back to Team</button>
        </div>
      </div>
    );
  }

  const empId = `EMP-${String(employee.serialId).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-[#f8fafc] animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        {/* Nav */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => router.push('/employees')}
            className="flex items-center space-x-2 text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-colors group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Team</span>
          </button>
          <button
            onClick={() => router.push(`/employees/edit/${empId}`)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Pencil size={14} />
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-700 text-2xl font-semibold mb-2 border border-indigo-100 shadow-xl shadow-indigo-100/20 capitalize">
                {(employee.name || '?').charAt(0)}
              </div>
              <h2 className="text-xl font-semibold text-slate-800 tracking-tight leading-tight uppercase">{employee.name}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{empId}</p>

              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className={`px-3 py-1 text-[9px] font-black rounded-full border uppercase tracking-widest ${roleColors[employee.role] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {employee.role}
                </span>
                <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${statusColors[employee.status] || 'bg-gray-100 text-gray-600'}`}>
                  {employee.status}
                </span>
              </div>

              <div className="w-full h-px bg-slate-50 my-6" />

              <div className="w-full space-y-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</span>
                  <span className="text-[12px] text-slate-700">{new Date(employee.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Updated</span>
                  <span className="text-[12px] text-slate-700">{new Date(employee.updatedAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Info */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2 pb-2 border-b border-slate-50 flex items-center gap-2">
                <User size={16} className="text-indigo-500" /> Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Username</p>
                    <p className="text-sm font-semi text-slate-800">@{employee.username || 'No username set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email Address</p>
                    <p className="text-sm font-semi text-slate-800 break-all">{employee.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Phone Number</p>
                    <p className="text-sm font-semi text-slate-800">{employee.phone || 'No phone number set'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Role & Access */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2 pb-2 border-b border-slate-50 flex items-center gap-2">
                <Shield size={16} className="text-indigo-500" /> Role & Access Level
              </h3>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Role</p>
                  <div className="flex items-center gap-2">
                    <Briefcase size={14} className="text-gray-300" />
                    <p className="text-sm font-semibold text-slate-800 uppercase tracking-tight">{employee.role}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Account Status</p>
                  <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${statusColors[employee.status] || 'bg-gray-100 text-gray-600'}`}>
                    {employee.status}
                  </span>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Employee ID</p>
                  <p className="text-sm font-semibold text-indigo-600 uppercase tracking-tight">{empId}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Member Since</p>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-300" />
                    <p className="text-sm text-slate-800">{new Date(employee.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
