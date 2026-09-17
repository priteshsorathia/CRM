"use client";
import React, { useState, useEffect, use } from 'react';
import api from '../../../../lib/axios';
import { getDocUrl } from '../../../../lib/utils';
import { useRouter } from 'next/navigation';
import {
  Building2,
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

export default function ViewOnboardingPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/onboarding/${id}`);
        if (res.data.success) {
          setOnboarding(res.data.data);
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
      const res = await api.patch(`/onboarding/${id}/status`, { status });
      if (res.data.success) {
        setOnboarding(prev => ({ ...prev, status }));
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
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Fetching Registry...</p>
        </div>
      </div>
    );
  }

  if (!onboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-800 mb-2">Record Not Found</h1>
          <button onClick={() => router.push('/onboarding')} className="text-indigo-600 font-bold hover:underline capitalize">Back to Overview</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] animate-in fade-in duration-500"> 
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => router.push('/onboarding')} className="flex items-center space-x-2 text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-colors group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1" />
            <span>Back Registry</span>
          </button>
          <div className="flex gap-3">
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[onboarding.status]}`}>
              {onboarding.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 border border-indigo-100 shadow-xl shadow-indigo-100/20">
                <Building2 size={28} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 tracking-tight leading-tight">{onboarding.businessName}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Registration ID: #OB-{String(onboarding.serialId).padStart(2, '0')}</p>

              <div className="w-full h-px bg-slate-50 my-6"></div>

              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</span>
                  <span className="text-[11px] font-black text-slate-700">{onboarding.businessType}</span>
                </div>
                <div className="flex items-center justify-between text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined</span>
                  <span className="text-[11px] font-black text-slate-700">{new Date(onboarding.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <User size={14} className="text-indigo-400" /> Owner Information
              </h3>
              <div className="space-y-5">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Name</p>
                  <p className="text-sm font-bold text-slate-800">{onboarding.fullName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email Address</p>
                  <p className="text-sm font-bold text-slate-800 break-all">{onboarding.email}</p>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Phone Number</p>
                  <p className="text-sm font-bold text-slate-800">{onboarding.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-10 pb-4 border-b border-slate-50 flex items-center gap-3">
                <FileBadge size={16} className="text-indigo-500" />
                Compliance Documentation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 underline underline-offset-4 decoration-indigo-200 decoration-2">PAN Verification</p>
                    <p className="text-xs font-black text-slate-800 uppercase">{onboarding.panNumber}</p>
                    <p className="text-[9px] text-indigo-400 font-bold mt-0.5">{onboarding.panType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 underline underline-offset-4 decoration-indigo-200 decoration-2">GST Details</p>
                    <p className="text-xs font-black text-slate-800 uppercase">{onboarding.gstNumber || 'Not Registered'}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 underline underline-offset-4 decoration-indigo-200 decoration-2">Address Proof</p>
                    <p className="text-xs font-black text-slate-800">{onboarding.addressProofType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 underline underline-offset-4 decoration-indigo-200 decoration-2">FSSAI Status</p>
                    <p className="text-xs font-black text-slate-800 uppercase">{onboarding.fssaiLicense || 'Not Applicable'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Uploaded Files</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: 'PAN Card Document', url: onboarding.documentPan },
                    { name: 'Address Proof Document', url: onboarding.documentAddress },
                    { name: 'GST Certificate Document', url: onboarding.documentGst }
                  ].filter(doc => doc.url).map((file, i) => (
                    <a key={i} href={getDocUrl(file.url)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:border-indigo-100 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100 group-hover:text-indigo-500 transition-colors">
                          <FileText size={16} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 uppercase transition-colors group-hover:text-slate-800">{file.name}</span>
                      </div>
                      <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-400" />
                    </a>
                  ))}
                  {!onboarding.documentPan && !onboarding.documentAddress && !onboarding.documentGst && (
                    <p className="text-xs font-bold text-slate-400 italic">No document attachments found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-xl shadow-indigo-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-white">
                <h4 className="font-semi text-sm uppercase tracking-widest mb-1">Application Pending Review</h4>
                <p className="text-[10px] text-indigo-100 font-medium tracking-wide">Update the status based on your verification.</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => updateStatus('Rejected')} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all">Reject</button>
                <button onClick={() => updateStatus('Verified')} className="bg-white text-indigo-600 px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">Approve Application</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
