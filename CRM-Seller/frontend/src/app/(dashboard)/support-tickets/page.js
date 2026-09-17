"use client";

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Tag,
  Calendar,
  User,
  AlertCircle,
  Mail,
  Eye,
  X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/axios';

const STATUS_CONFIG = {
  'Open': { color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <Clock size={12} /> },
  'In Progress': { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <RefreshCw size={12} className="animate-spin-slow" /> },
  'In-Progress': { color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <RefreshCw size={12} className="animate-spin-slow" /> },
  'Closed': { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={12} /> },
  'Resolved': { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={12} /> },
};

const CATEGORY_STYLES = {
  'Project': 'bg-emerald-100 text-emerald-600',
  'Design': 'bg-pink-100 text-pink-600',
  'Payment': 'bg-purple-100 text-purple-600',
  'Technical': 'bg-blue-100 text-blue-600',
  'Other': 'bg-slate-100 text-slate-600',
};

const PRIORITY_STYLES = {
  'Critical': 'bg-red-50 text-red-600 border-red-100',
  'High': 'bg-orange-50 text-orange-600 border-orange-100',
  'Urgent': 'bg-red-50 text-red-600 border-red-100',
  'Normal': 'bg-amber-50 text-amber-600 border-amber-100',
  'Medium': 'bg-amber-50 text-amber-600 border-amber-100',
  'Low': 'bg-blue-50 text-blue-600 border-blue-100',
};

export default function SupportTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/support-tickets`);
      if (res.data.success) {
        setTickets(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error("Fetch Tickets Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateStatus = async (id, currentStatus) => {
    const statusCycle = ['Open', 'In-Progress', 'Closed'];
    const normalizedStatus = currentStatus === 'In Progress' ? 'In-Progress' : (currentStatus === 'Resolved' ? 'Closed' : currentStatus);
    const nextStatus = statusCycle[(statusCycle.indexOf(normalizedStatus) + 1) % statusCycle.length];

    try {
      setUpdatingId(id);
      const res = await api.patch(`/support-tickets/${id}/status`, { status: nextStatus });
      if (res.data.success) {
        setTickets(prev => prev.map(t =>
          t.id === id ? { ...t, status: nextStatus } : t
        ));
      }
    } catch (err) {
      console.error("Update Status Error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `ST-${String(ticket.serialId).padStart(2, '0')}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.submittedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const currentItems = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);



  return (
    <div className="space-y-4 animate-in fade-in duration-500 text-left pb-20">
      {/* Header Section */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight leading-tight">Support Tickets</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1 line-clamp-1 md:line-clamp-none">Manage and resolve customer support inquiries.</p>
        </div>
        <button
          onClick={fetchTickets}
          disabled={loading}
          className="p-3 md:px-5 md:py-2.5 flex items-center justify-center gap-2 text-slate-600 transition-all bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-sm font-bold text-xs md:text-sm active:scale-95 disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          <span className="hidden md:inline">Refresh List</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {[
          {
            label: 'Total Tickets',
            value: tickets.length,
            icon: <Ticket />,
            color: 'bg-blue-50 text-blue-600',
            borderColor: 'border-blue-100'
          },
          {
            label: 'In Progress',
            value: tickets.filter(t => t.status?.toLowerCase().includes('progress')).length,
            icon: <RefreshCw />,
            color: 'bg-amber-50 text-amber-600',
            borderColor: 'border-amber-100'
          },
          {
            label: 'Completed',
            value: tickets.filter(t => ['Closed', 'Resolved', 'Resolved'].includes(t.status)).length,
            icon: <CheckCircle2 />,
            color: 'bg-emerald-50 text-emerald-600',
            borderColor: 'border-emerald-100'
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4 transition-all hover:shadow-md group">
            <div className={`p-2 md:p-3 rounded-xl ${stat.color} border border-transparent flex items-center justify-center shrink-0`}>
              {React.cloneElement(stat.icon, { size: 18, className: "md:w-5 md:h-5" })}
            </div>
            <div className="flex-1">
              <p className="text-slate-400 text-[8px] md:text-[10px] font-semibold uppercase tracking-widest leading-none">{stat.label}</p>
              <p className="text-lg md:text-xl font-semibold text-slate-800 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar Box */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
        <Search size={20} className="text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search tickets..."
          className="flex-1 bg-transparent border-none outline-none text-slate-700 font-medium placeholder:text-slate-400"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Table Box */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden pb-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="py-3 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[280px]">Ticket Details</th>
                <th className="py-3 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Requester</th>
                <th className="py-3 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">Priority</th>
                <th className="py-3 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-32 text-left">Category</th>
                <th className="py-3 px-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-40 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-indigo-100" />
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Tickets...</p>
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <AlertCircle size={32} className="mx-auto mb-3 text-slate-100" />
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No tickets found</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((ticket) => (
                  <tr key={ticket.id} className="group hover:bg-indigo-50/20 transition-all">
                    <td className="py-3 px-6">
                      <div className="space-y-1.5 cursor-pointer" onClick={() => router.push(`/support-tickets/${ticket.id}`)}>
                        <p className="text-[14px] font-medium text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">
                          {ticket.subject}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 leading-none inline-block">
                          ST-{String(ticket.serialId).padStart(2, '0')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="min-w-0 flex flex-col justify-center">
                        {ticket.submittedBy?.trim() ? (
                          <> 
                            <a
                              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${ticket.email}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/mail flex items-center text-[12px] text-slate-400 truncate tracking-tight lowercase font-medium mt-1.5 hover:text-indigo-600 transition-all w-fit"
                            >
                              <div className="p-1 rounded-md bg-slate-50 group-hover/mail:bg-indigo-50 border border-slate-100 group-hover/mail:border-indigo-100 mr-1.5 transition-all">
                                <Mail size={12} className="text-slate-300 group-hover/mail:text-indigo-500" />
                              </div>
                              {ticket.email || 'no-email@support.com'}
                            </a>
                          </>
                        ) : (
                          <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${ticket.email}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/mail flex items-center text-sm font-medium text-slate-800 truncate lowercase hover:text-indigo-600 transition-all w-fit"
                          >
                            <div className="p-1.5 rounded-md bg-slate-50 group-hover/mail:bg-indigo-50 border border-slate-100 group-hover/mail:border-indigo-100 mr-2 transition-all">
                              <Mail size={14} className="text-slate-300 group-hover/mail:text-indigo-500" />
                            </div>
                            {ticket.email || 'Anonymous'}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-medium uppercase tracking-wider border transition-all inline-block ${PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES[ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)] || PRIORITY_STYLES['Normal']}`}>
                        {ticket.priority || 'Normal'}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-medium uppercase tracking-wider border transition-all inline-block ${CATEGORY_STYLES[ticket.category] || CATEGORY_STYLES['Other']}`}>
                        {ticket.category || 'Support'}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus(ticket.id, ticket.status)}
                          disabled={updatingId === ticket.id}
                          className={`w-36 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${STATUS_CONFIG[ticket.status]?.color || 'bg-slate-50 text-slate-500'}`}
                        >
                          {updatingId === ticket.id ? <RefreshCw size={12} className="animate-spin" /> : STATUS_CONFIG[ticket.status]?.icon}
                          <span className="text-[9px] font-semibold uppercase tracking-widest">{ticket.status}</span>
                        </button>
                        <button
                          onClick={() => router.push(`/support-tickets/${ticket.id}`)}
                          className="p-2.5 rounded-xl border border-slate-100 bg-white text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Box - Inside Table Box Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-6 border-t border-slate-50 bg-slate-50/30">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              Showing <span className="text-slate-400">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-slate-400">{Math.min(currentPage * itemsPerPage, filteredTickets.length)}</span> of <span className="text-slate-400">{filteredTickets.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl text-slate-400 bg-white border border-slate-200 hover:text-indigo-600 disabled:opacity-30 transition-all active:scale-90 shadow-sm"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1.5">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 rounded-xl text-[10px] font-semibold transition-all border ${currentPage === i + 1 ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 text-slate-600"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl text-slate-400 bg-white border border-slate-200 hover:text-indigo-600 disabled:opacity-30 transition-all active:scale-90 shadow-sm"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
