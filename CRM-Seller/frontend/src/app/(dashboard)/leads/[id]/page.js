"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Phone, Mail, MapPin, Clock, ArrowLeft, Building2, Briefcase, MessageSquare, ShieldCheck, User, Calendar } from 'lucide-react';
import api from '../../../../lib/axios';

const statusColors = {
  New: "bg-blue-100 text-blue-700",
  Contacted: "bg-yellow-100 text-yellow-700",
  Qualified: "bg-green-100 text-green-700",
  Lost: "bg-red-100 text-red-700",
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await api.get(`/leads/${params.id}`);
        setLead(response.data.data);
      } catch (err) {
        console.error('Failed to fetch lead:', err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchLead();
  }, [params.id]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!lead) return (
    <div className="text-center py-20">
      <h2 className="text-xl font-bold text-gray-800">Lead not found</h2>
      <button onClick={() => router.push('/leads')} className="mt-4 text-blue-600 hover:underline">Back to leads</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-4">
      <button 
        onClick={() => router.push('/leads')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm"
      >
        <ArrowLeft size={16} /> Back to Leads
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 md:gap-5">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-semibold shadow-sm">
              {lead.fullName.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-semi text-gray-900 leading-tight">{lead.fullName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 underline-offset-4">
                <p className="text-gray-500 text-xs md:text-sm flex items-center gap-1.5 whitespace-nowrap">
                  <Clock size={14} className="text-gray-400" /> Received on {new Date(lead.createdAt).toLocaleDateString('en-IN')}
                </p>
                <span className={`md:hidden px-3 py-1 rounded-full text-[10px] font-bold shadow-sm ${statusColors[lead.status]}`}>
                  {lead.status}
                </span>
              </div>
            </div>
          </div>
          <span className={`hidden md:inline-flex px-5 py-2 rounded-full text-xs font-bold shadow-sm ${statusColors[lead.status]}`}>
            {lead.status}
          </span>
        </div>

        {/* Info Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
            <p className="text-gray-800 font-medium flex items-center gap-2">
              <Phone size={14} className="text-gray-400" /> {lead.phone}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Address</p>
            <p className="text-gray-800 font-medium flex items-center gap-2">
              <Mail size={14} className="text-gray-400" /> {lead.email}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Business Type</p>
            <p className="text-gray-800 font-medium flex items-center gap-2">
              <Briefcase size={14} className="text-gray-400" /> {lead.businessType || 'N/A'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Business Name</p>
            <p className="text-gray-800 font-medium flex items-center gap-2">
              <Building2 size={14} className="text-gray-400" /> {lead.businessName || '—'}
            </p>
          </div>
          <div className="space-y-1 col-span-full">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</p>
            <p className="text-gray-800 font-medium flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" /> {lead.location || 'N/A'}
            </p>
          </div>
        </div>

        {/* Message Section */}
        {lead.message && (
          <div className="p-8 bg-gray-50 border-t border-gray-50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Message from Applicant</p>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-sm text-gray-600 leading-relaxed italic">
              "{lead.message}"
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <p className="text-[10px] text-gray-300 font-mono font-bold">ID: LD-{String(lead.serialId).padStart(2, '0')}</p>
      </div>
    </div>
  );
}
