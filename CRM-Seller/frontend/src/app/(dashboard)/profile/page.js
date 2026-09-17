"use client";
import React, { useState, useEffect } from 'react';
import { User, Shield, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUserData(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const displayName = userData?.name || "CRM Owner";
  const userRole = "SHOP_OWNER";
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col items-center animate-in fade-in duration-500">
      
      {/* Back Button */}
      <div className="w-full max-w-3xl px-4 md:px-0 mb-4"> 
        <Link href="/" className="flex items-center space-x-2 text-slate-400 hover:text-slate-600 transition-colors font-bold text-xs md:text-sm group">
           <div className="p-2 bg-white rounded-lg border border-gray-100 shadow-sm group-hover:scale-105 transition-transform">
             <ArrowLeft size={16} />
           </div>
           <span>Dashboard Home</span>
        </Link>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-[2rem] md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden mx-4 md:mx-0"> 
        
        {/* Top Header Section */}
        <div className="p-6 md:p-8 flex flex-row items-center gap-4 md:gap-6 border-b border-gray-50 bg-gray-50/10">
          <div className="w-12 h-12 rounded-full bg-[#dbeafe] flex items-center justify-center shadow-lg border-4 border-white shrink-0">
            <span className="text-xl font-semi text-[#2563eb]">{initials}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-800 tracking-tight leading-tight">{displayName}</h1>
              <span className="hidden md:inline-block text-blue-500 text-[9px] font-black bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-widest">(You)</span>
            </div>
            <p className="text-blue-600 font-semi text-[10px] md:text-xs tracking-[0.2em] mt-1 uppercase">{userRole}</p>
          </div>
        </div>

        {/* Info Categories */}
        <div className="p-6 md:p-10 space-y-8 md:space-y-12"> 
          
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                <span className="text-sm font-bold text-gray-400">JOIN DATE</span>
                <span className="text-sm font-bold text-slate-700">Feb 27, 2026</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-400">STATUS</span>
                <div className="px-4 py-1.5 bg-green-50 rounded-full flex items-center">
                   <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                <span className="text-sm font-bold text-gray-400">EMAIL ADDRESS</span>
                <span className="text-sm font-bold text-slate-700">{userData?.email || "restaurant@crm.com"}</span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                <span className="text-sm font-bold text-gray-400">PHONE NUMBER</span>
                <span className="text-sm font-bold text-slate-700">{userData?.phone || "1234567890"}</span>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Account Information</h3>
            <div className="flex items-center justify-between pb-4 border-b border-gray-50">
              <span className="text-sm font-bold text-gray-400">LOGIN USERNAME</span>
              <div className="px-4 py-2 bg-gray-50 rounded-lg flex items-center border border-gray-100">
                 <span className="text-sm font-bold text-slate-700">{userData?.username || "crm_owner"}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Support Info */}
      <div className="mt-6 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
        © 2026 CRM Private Limited • All rights reserved.
      </div>
    </div>
  );
}
