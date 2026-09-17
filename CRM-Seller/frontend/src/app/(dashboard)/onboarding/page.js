"use client";
import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Plus,
  RefreshCw,
  Eye,
  ChevronRight,
  ChevronLeft,
  Pencil,
  Trash2
} from 'lucide-react';

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-700",
  Verified: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

const StatCard = ({ title, value, icon, bgColor, active, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white p-4 md:p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border flex items-center space-x-3 md:space-x-4 cursor-pointer ${active ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-100'}`}
  >
    <div className={`p-2.5 md:p-3 rounded-full ${bgColor} text-white shadow-md shrink-0`}>
      {React.cloneElement(icon, { size: 18, className: "md:w-[22px] md:h-[22px]" })}
    </div>
    <div className="flex flex-col">
      <h3 className="text-gray-400 font-semibold tracking-wide text-[10px] uppercase mb-0.5">{title}</h3>
      <p className="text-xl font-semibold text-gray-800 tracking-tight">{value ?? 0}</p>
    </div>
  </div>
);

export default function OnboardingPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [onboardings, setOnboardings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const stats = {
    total: onboardings.length,
    pending: onboardings.filter(o => o.status === 'Pending').length,
    verified: onboardings.filter(o => o.status === 'Verified').length,
    rejected: onboardings.filter(o => o.status === 'Rejected').length
  };

  const fetchOnboardings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/onboarding');
      if (res.data.success) setOnboardings(res.data.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboardings();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this onboarding record?')) return;
    try {
      setLoading(true);
      await api.delete(`/onboarding/${id}`);
      setOnboardings(prev => prev.filter(o => o.id !== id && o.serialId !== parseInt(id.split('-')[1])));
      fetchOnboardings();
    } catch (err) {
      console.error("Delete Error:", err);
      alert('Failed to delete onboarding record.');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = onboardings.filter(item => {
    const searchStr = search.toLowerCase();
    const ownerName = item.fullName || '';
    const matchesSearch = !search ||
      item.businessName.toLowerCase().includes(searchStr) ||
      ownerName.toLowerCase().includes(searchStr) ||
      item.email.toLowerCase().includes(searchStr);
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-2xl font-semibold text-gray-800 tracking-tight">Onboarding Overview</h1>
          <p className="text-sm md:text-xs text-gray-400 font-medium mt-0.5">Manage business registrations and verifications</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button suppressHydrationWarning onClick={fetchOnboardings} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-500 text-[10px] md:text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-100 transition-all shadow-sm">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="md:inline">Refresh</span>
          </button>
          <button suppressHydrationWarning onClick={() => router.push('/onboarding/new')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] md:text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95">
            <Plus size={14} />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {[
          { key: '', title: 'Total Requests', value: stats.total, icon: <Building2 size={22} />, bgColor: 'bg-blue-500' },
          { key: 'Pending', title: 'Pending Review', value: stats.pending, icon: <Clock size={22} />, bgColor: 'bg-yellow-500' },
          { key: 'Verified', title: 'Verified Businesses', value: stats.verified, icon: <CheckCircle2 size={22} />, bgColor: 'bg-green-500' },
          { key: 'Rejected', title: 'Rejected', value: stats.rejected, icon: <AlertCircle size={22} />, bgColor: 'bg-red-500' },
        ].map(card => (
          <StatCard
            key={card.key}
            title={card.title}
            value={card.value}
            icon={card.icon}
            bgColor={card.bgColor}
            active={statusFilter === card.key}
            onClick={() => setStatusFilter(statusFilter === card.key ? '' : card.key)}
          />
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex items-center gap-3">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          suppressHydrationWarning
          type="text"
          placeholder="Search by business name, owner or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden pb-10 flex flex-col h-full">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/60 font-medium text-gray-400 uppercase text-[10px] tracking-widest">
                <th className="text-left px-8 py-5">ID</th>
                <th className="text-left px-8 py-5">Business</th>
                <th className="text-left px-8 py-5">Owner / Contact</th>
                <th className="text-left px-8 py-5">Category</th>
                <th className="text-left px-8 py-5">Status</th>
                <th className="text-left px-8 py-5">Date</th>
                <th className="px-8 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && onboardings.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-24 text-gray-400 font-bold animate-pulse">Loading Records...</td></tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-24">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4 animate-pulse">
                        <Building2 size={32} />
                      </div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic opacity-50">Secure Registry Waiting...</p>
                      <button onClick={() => router.push('/onboarding/new')} className="mt-4 text-indigo-600 text-[10px] font-semibold uppercase tracking-widest hover:underline">Start New Onboarding</button>
                    </div>
                  </td>
                </tr>
              ) : currentData.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-8 py-5 text-[10px] font-bold text-gray-300 tracking-[0.2em] font-mono">
                    {String(item.serialId).padStart(2, '0')}
                  </td>
                  <td className="px-4 py-6">
                    <div className="text-sm text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors truncate max-w-[200px]">
                      {item.businessName}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-600">
                    <p className="line-clamp-1">{item.fullName}</p>
                    <p className="text-[10px] text-gray-400 font-medium line-clamp-1">{item.email}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                      {item.businessType}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-xs text-slate-400 font-bold" suppressHydrationWarning>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button onClick={() => router.push(`/onboarding/edit/OB-${String(item.serialId).padStart(2, '0')}`)} className="bg-slate-50 hover:bg-amber-500 hover:text-white text-slate-400 p-2 rounded-lg transition-all shadow-sm border border-slate-100 bg-white">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => router.push(`/onboarding/OB-${String(item.serialId).padStart(2, '0')}`)} className="bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-400 p-2 rounded-lg transition-all shadow-sm border border-slate-100 bg-white">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleDelete(`OB-${item.serialId}`)} className="bg-slate-50 hover:bg-red-500 hover:text-white text-slate-400 p-2 rounded-lg transition-all shadow-sm border border-slate-100 bg-white">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 pt-8 border-t border-gray-50">
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} Records
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className={`p-2 rounded-xl border border-gray-100 transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-50 text-slate-600'}`}
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${currentPage === i + 1
                        ? 'bg-slate-800 border-slate-800 text-white shadow-lg'
                        : 'border-gray-100 text-gray-400 hover:bg-gray-50'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className={`p-2 rounded-xl border border-gray-100 transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-50 text-slate-600'}`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
