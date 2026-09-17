"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserCheck, PhoneCall, Award, UserX, Search, Phone, Mail, MapPin, Clock, RefreshCw, Eye, ClipboardList, Store, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../../lib/axios';
import { useRouter } from 'next/navigation';

const statusColors = {
  New:       { bg: 'bg-blue-50',   text: 'text-blue-600',   label: 'NEW' },
  Contacted: { bg: 'bg-yellow-50', text: 'text-yellow-600', label: 'CONTACTED' },
  Qualified: { bg: 'bg-green-50',  text: 'text-green-600',  label: 'QUALIFIED' },
  Lost:      { bg: 'bg-red-50',    text: 'text-red-600',    label: 'LOST' },
};

const TooltipBtn = ({ onClick, title, icon, colorClass }) => (
  <div className="relative group/tooltip">
    <button
      onClick={onClick}
      className={`p-2 rounded-xl transition-all duration-200 bg-white text-slate-400 border border-slate-100 shadow-sm hover:shadow-md active:scale-95 ${colorClass}`}
    >
      {icon}
    </button>
    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-all duration-200 transform translate-y-1 group-hover/tooltip:translate-y-0 z-50">
      {title}
      <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-slate-900" />
    </span>
  </div>
);

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({ total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;

      const [leadsRes, statsRes] = await Promise.all([
        api.get('/leads', { params }),
        api.get('/leads/stats'),
      ]);

      setLeads(leadsRes.data.leads || []);
      setStats(statsRes.data.data || {});
    } catch (err) {
      console.warn('Leads fetch failed:', err.message);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchLeads(), 300);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await api.delete(`/leads/${id}`);
      setLeads(prev => prev.filter(l => l.id !== id));
      const statsRes = await api.get('/leads/stats');
      setStats(statsRes.data.data || {});
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete lead.';
      alert(msg);
    }
  };

  const convertToOnboarding = (lead) => {
    const params = new URLSearchParams({
      prefill: '1',
      businessName: lead.businessName || '',
      businessType: lead.businessType || 'Individual/Proprietor',
      fullName: lead.fullName || '',
      email: lead.email || '',
      phone: lead.phone || '',
    });
    router.push(`/onboarding/new?${params.toString()}`);
  };

  const convertToShop = (lead) => {
    const params = new URLSearchParams({
      prefill: '1',
      name: lead.businessName || '',
      ownerName: lead.fullName || '',
      email: lead.email || '',
      phone: lead.phone || '',
      address: lead.location || '',
    });
    router.push(`/shops/new?${params.toString()}`);
  };

  const filteredLeads = leads.filter(lead => {
    const s = search.toLowerCase();
    const matchSearch = !search ||
      (lead.fullName || '').toLowerCase().includes(s) ||
      (lead.email || '').toLowerCase().includes(s) ||
      (lead.phone || '').toLowerCase().includes(s) ||
      (lead.location || '').toLowerCase().includes(s) ||
      (lead.businessName || '').toLowerCase().includes(s);
    const matchStatus = !statusFilter || lead.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const currentLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-xl md:text-2xl font-semibold text-gray-800 tracking-tight leading-tight">Leads</h1>
                <p className="text-xs md:text-xs text-gray-400 font-medium mt-0.5">Real-time submissions from the CRM application</p>
            </div>
            <button 
                onClick={fetchLeads} 
                className="md:hidden p-3 bg-white hover:bg-gray-50 text-gray-500 rounded-xl border border-gray-100 shadow-sm active:scale-95"
            >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={fetchLeads} className="hidden md:flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-100 transition-all">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
            </button>
        </div>
      </div>

      {/* Search + count */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex items-center gap-3">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          suppressHydrationWarning
          type="text"
          placeholder="Search by name, email, phone or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm text-gray-600 placeholder-gray-400 outline-none bg-transparent"
        />
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest shrink-0">
          {filteredLeads.length} RECORDS
        </span>
      </div>

      {/* Section heading */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 tracking-tight">All Leads</h2>
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lead Information</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && leads.length === 0 ? (
                // Table Skeleton
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-8" /></td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-32" />
                        <div className="h-3 bg-gray-100 rounded w-24" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-40" />
                        <div className="h-3 bg-gray-100 rounded w-28" />
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-3 bg-gray-100 rounded w-24" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-gray-100 rounded-full w-20" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-100 rounded-xl w-32 mx-auto" /></td>
                  </tr>
                ))
              ) : currentLeads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Users size={36} className="text-gray-200" />
                      <p className="text-xs font-medium uppercase tracking-widest">No leads found</p>
                      <button onClick={fetchLeads} className="text-blue-500 text-[11px] font-medium hover:underline">Refresh</button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentLeads.map((lead, index) => {
                  const sc = statusColors[lead.status] || { bg: 'bg-gray-50', text: 'text-gray-500', label: lead.status };
                  return (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-gray-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                           {String(lead.serialId || index + 1).padStart(1, '0')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-800 uppercase tracking-tight">
                            {lead.fullName || 'Unknown User'}
                          </span>
                          {lead.businessName && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Store size={10} className="text-gray-400" />
                              <span className="text-[10px] text-gray-500 font-medium">{lead.businessName}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[11px] text-gray-600">
                            <Mail size={12} className="text-purple-400 shrink-0" />
                            {lead.email ? (
                              <a 
                                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${lead.email}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-medium hover:text-purple-600 transition-colors"
                              >
                                {lead.email}
                              </a>
                            ) : (
                              <span className="font-medium">—</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-600">
                            <Phone size={12} className="text-green-400 shrink-0" />
                            {lead.phone ? (
                              <a href={`tel:${lead.phone}`} className="font-medium hover:text-green-600 transition-colors">{lead.phone}</a>
                            ) : (
                              <span className="font-medium">—</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-[11px] text-gray-600">
                          <MapPin size={12} className="text-blue-400 shrink-0" />
                          <span className="font-medium">{lead.location || 'NO LOCATION SET'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${sc.bg} ${sc.text}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <TooltipBtn
                            onClick={() => router.push(`/leads/${lead.id}`)}
                            title="View Details"
                            icon={<Eye size={14} />}
                            colorClass="hover:bg-indigo-600 hover:text-white"
                          />
                          <TooltipBtn
                            onClick={() => convertToOnboarding(lead)}
                            title="Onboarding"
                            icon={<ClipboardList size={14} />}
                            colorClass="hover:bg-green-600 hover:text-white"
                          />
                          <TooltipBtn
                            onClick={() => convertToShop(lead)}
                            title="Convert Shop"
                            icon={<Store size={14} />}
                            colorClass="hover:bg-blue-600 hover:text-white"
                          />
                          <TooltipBtn
                            onClick={() => handleDelete(lead.id)}
                            title="Delete"
                            icon={<Trash2 size={14} />}
                            colorClass="hover:bg-red-500 hover:text-white"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50/30 border-t border-gray-100">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length} Leads
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className={`p-2 rounded-lg border border-gray-100 transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-slate-600 shadow-sm'}`}
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all border ${
                        currentPage === i + 1 
                        ? 'bg-slate-800 border-slate-800 text-white shadow-lg' 
                        : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 shadow-sm'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className={`p-2 rounded-lg border border-gray-100 transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-slate-600 shadow-sm'}`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
