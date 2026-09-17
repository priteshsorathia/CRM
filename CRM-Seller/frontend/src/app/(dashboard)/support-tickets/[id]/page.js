"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Tag, User, Mail, AlignLeft, Calendar, Flag, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import api from '../../../../lib/axios';

const statusConfig = {
  Open:          { color: 'bg-blue-100 text-blue-700',     icon: <Clock size={12} /> },
  'In Progress': { color: 'bg-yellow-100 text-yellow-700', icon: <AlertCircle size={12} /> },
  Resolved:      { color: 'bg-green-100 text-green-700',   icon: <CheckCircle2 size={12} /> },
  Closed:        { color: 'bg-gray-100 text-gray-500',     icon: <XCircle size={12} /> },
};

const priorityConfig = {
  Low:      'bg-gray-100 text-gray-500',
  Medium:   'bg-blue-100 text-blue-600',
  High:     'bg-orange-100 text-orange-600',
  Critical: 'bg-red-100 text-red-600',
};

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/support-tickets/${params.id}`);
        if (res.data.success) setTicket(res.data.data);
      } catch (err) {
        console.error('Fetch Error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetch();
  }, [params.id]);

  const handleStatusChange = async (status) => {
    try {
      setUpdating(true);
      const res = await api.patch(`/support-tickets/${params.id}/status`, { status });
      if (res.data.success) setTicket(res.data.data);
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!ticket) return (
    <div className="text-center py-20">
      <h2 className="text-xl font-bold text-gray-800">Ticket not found</h2>
      <button onClick={() => router.push('/support-tickets')} className="mt-4 text-indigo-600 hover:underline text-sm font-bold">Back to Tickets</button>
    </div>
  );

  const sc = statusConfig[ticket.status] || { color: 'bg-gray-100 text-gray-500', icon: null };

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-4">
      <button onClick={() => router.push('/support-tickets')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-bold">
        <ArrowLeft size={16} /> Back to Tickets
      </button>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">ST-{String(ticket.serialId).padStart(2, '0')}</p>
            <h1 className="text-2xl font-semi text-gray-900">{ticket.subject}</h1>
            <div className="flex items-center gap-3 mt-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${priorityConfig[ticket.priority] || 'bg-gray-100 text-gray-500'}`}>
                {ticket.priority} Priority
              </span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${sc.color}`}>
                {sc.icon}{ticket.status}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submitted By</p>
            <p className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <User size={14} className="text-gray-400" /> {ticket.submittedBy || '—'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
            <p className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <Mail size={14} className="text-gray-400" /> {ticket.email || '—'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</p>
            <p className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <Tag size={14} className="text-gray-400" /> {ticket.category}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Submitted On</p>
            <p className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {ticket.description && (
            <div className="space-y-1 col-span-full">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</p>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed font-medium">
                {ticket.description}
              </div>
            </div>
          )}
        </div>

        {/* Status Update */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-50">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => {
              const cfg = statusConfig[s] || { color: 'bg-gray-100 text-gray-500', icon: null };
              const isActive = ticket.status === s;
              return (
                <button
                  key={s}
                  onClick={() => !isActive && handleStatusChange(s)}
                  disabled={isActive || updating}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    isActive
                      ? `${cfg.color} border-transparent ring-2 ring-offset-1 ring-blue-300 cursor-default`
                      : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600'
                  }`}
                >
                  {cfg.icon}{s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-50 flex justify-end gap-3">
          <button onClick={() => router.push('/support-tickets')} className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-gray-600 font-bold text-xs border border-gray-100 hover:border-gray-200 transition-all">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
