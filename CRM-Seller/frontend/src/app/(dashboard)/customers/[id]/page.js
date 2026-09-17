"use client";
import React, { useState, useEffect, use } from 'react';
import api from '../../../../lib/axios';
import { useRouter } from 'next/navigation';
import {
  Users,
  ChevronLeft,
  User,
  FileBadge,
  FileText,
  ExternalLink
} from 'lucide-react';

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Verified: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function ViewCustomerPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/customer/${id}`);
        if (res.data.success) {
          setCustomer(res.data.data);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, API_URL]);

  const updateStatus = async (status) => {
    if (!confirm(`Are you sure you want to change status to ${status}?`)) return;
    try {
      const res = await api.patch(`/customer/${id}/status`, { status });
      if (res.data.success) {
        setCustomer(prev => ({ ...prev, status }));
      }
    } catch (err) {
      console.error("Status Update Error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Hydrating Customer Profile...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-800 mb-2">Portfolio Record Not Found</h1>
          <button onClick={() => router.push('/customers')} className="text-indigo-600 font-bold hover:underline capitalize">Back to Registry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] animate-in fade-in duration-500"> 
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.push('/customers')} className="flex items-center space-x-2 text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-colors group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back Customers</span>
          </button>
          <div className="flex gap-3">
             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[customer.status]}`}>
              {customer.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 border border-indigo-100 shadow-xl shadow-indigo-100/20">
                <Users size={42} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight leading-tight">{customer.fullName}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">ID: {customer.customerCode}</p>

              <div className="w-full h-px bg-slate-50 my-6"></div>

              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrolled</span>
                  <span className="text-[11px] font-black text-slate-700">{new Date(customer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <User size={14} className="text-indigo-400" /> Contact Details
              </h3>
              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Phone</p>
                  <p className="text-sm font-bold text-slate-800">{customer.phone}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email</p>
                  <p className="text-sm font-bold text-slate-800 break-all">{customer.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Address</p>
                  <p className="text-sm font-bold text-slate-800">{customer.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-10 pb-4 border-b border-slate-50 flex items-center gap-3">
                <FileBadge size={16} className="text-indigo-500" />
                Financial Overview
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 underline underline-offset-4 decoration-indigo-200 decoration-2">Total Amount (₹)</p>
                    <p className="text-2xl font-black text-slate-800">₹{customer.totalAmount || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 underline underline-offset-4 decoration-indigo-200 decoration-2">Advance Taken (₹)</p>
                    <p className="text-lg font-black text-emerald-600">₹{customer.advanceTaken || 0}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 underline underline-offset-4 decoration-indigo-200 decoration-2">Payment Method</p>
                    <p className="text-sm font-black text-slate-800 uppercase bg-slate-100 px-3 py-1 rounded-lg inline-block">{customer.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 underline underline-offset-4 decoration-indigo-200 decoration-2">Payment Status</p>
                    <p className={`text-sm font-black uppercase px-3 py-1 rounded-lg inline-block ${statusColors[customer.paymentStatus] || 'bg-slate-100 text-slate-800'}`}>
                      {customer.paymentStatus || 'Pending'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Vaulted Documentation</p>
                <div className="grid grid-cols-2 gap-4">
                  {customer.additionalFiles ? (
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:border-indigo-100 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100 group-hover:text-indigo-500 transition-colors shadow-sm">
                          <FileText size={16} />
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase transition-colors group-hover:text-slate-800 font-mono">Attachment_1.file</span>
                      </div>
                      <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-400" />
                    </div>
                  ) : (
                    <div className="col-span-2 p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-xs font-bold text-slate-400">No documents attached.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="text-white relative z-10 text-center md:text-left">
                <h4 className="font-black text-sm uppercase tracking-widest mb-1">Customer Governance</h4>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">Manage the operational status of this customer.</p>
              </div>
              <div className="flex gap-3 shrink-0 relative z-10">
                <button onClick={() => updateStatus('Rejected')} className="bg-white/5 hover:bg-red-500/10 text-white border border-white/10 px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all">Deactivate</button>
                <button onClick={() => updateStatus('Verified')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">Verify Customer</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
