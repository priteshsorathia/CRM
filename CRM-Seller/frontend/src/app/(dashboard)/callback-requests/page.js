"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Clock, PhoneCall, RefreshCw, Trash2, ChevronLeft, ChevronRight, User, Phone, Mail, Calendar, MessageSquare, AlertCircle, CheckCircle2, Pencil, X, XCircle, PhoneForwarded } from 'lucide-react';
import api from '../../../lib/axios';
import { useRouter } from 'next/navigation';

const StatusBadge = ({ status }) => {
  const styles = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Called: "bg-blue-100 text-blue-700 border-blue-200",
    Resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  const icons = {
    Pending: <Clock size={12} className="mr-1" />,
    Called: <Phone size={12} className="mr-1" />,
    Resolved: <CheckCircle2 size={12} className="mr-1" />,
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles.Pending}`}>
      {icons[status] || icons.Pending}
      {status}
    </span>
  );
};

export default function CallbackRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewRequest, setViewRequest] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ date: '', time: '' });
  const itemsPerPage = 10;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/callback-requests`);
      if (res.data.success) {
        console.log("Fetched Callback Requests Data:", res.data.data);
        setRequests(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      const res = await api.patch(`/callback-requests/${id}/status`, { status: newStatus });
      if (res.data.success) {
        setRequests(prev => prev.map(req =>
          req.id === id ? { ...req, status: newStatus } : req
        ));
      }
    } catch (err) {
      console.error("Update Status Error:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInlineReschedule = async (id) => {
    try {
      setUpdatingId(id);
      const res = await api.patch(`/callback-requests/${id}`, {
        preferredDate: editData.date,
        preferredTime: editData.time,
        status: 'Pending'
      });
      if (res.data.success) {
        setRequests(prev => prev.map(req =>
          req.id === id ? {
            ...req,
            preferredDate: editData.date,
            preferredTime: editData.time,
            status: 'Pending'
          } : req
        ));
        setEditingId(null);
      }
    } catch (err) {
      console.error("Reschedule Error:", err);
    } finally {
      setUpdatingId(null);
    }
  };



  const filteredRequests = requests.filter(req =>
    req.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-row items-center justify-between gap-4 text-left">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight leading-tight">Support Requests</h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1 line-clamp-1 md:line-clamp-none">Manage callback schedules from the table.</p>
        </div>
        <button 
          onClick={fetchRequests} 
          disabled={loading} 
          className="p-3 md:px-4 md:py-2 flex items-center justify-center gap-2 bg-white text-slate-600 rounded-xl border border-slate-200 font-semibold text-xs md:text-sm shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          <span className="hidden md:inline">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {[
          { label: 'Total', value: requests.length, icon: <PhoneCall size={18} className="text-blue-600 md:w-5 md:h-5" />, color: 'bg-blue-50' },
          { label: 'Pending', value: requests.filter(r => r.status === 'Pending').length, icon: <Clock size={18} className="text-amber-600 md:w-5 md:h-5" />, color: 'bg-amber-50' },
          { label: 'Resolved', value: requests.filter(r => r.status === 'Resolved').length, icon: <CheckCircle2 size={18} className="text-emerald-600 md:w-5 md:h-5" />, color: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 md:gap-4 text-left transition-all hover:shadow-md group">
            <div className={`p-2.5 md:p-3 rounded-xl ${stat.color} flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <div className="flex-1">
              <p className="text-slate-400 text-[9px] md:text-xs font-semibold uppercase tracking-wider leading-none">{stat.label}</p>
              <p className="text-xl md:text-xl font-semibold text-slate-800 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
        <Search size={20} className="text-slate-400 ml-2" />
        <input type="text" placeholder="Search..." className="flex-1 bg-transparent border-none outline-none text-slate-700 font-medium" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden pb-10">
        <div className="overflow-x-auto text-left">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preferred Schedule</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && requests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-indigo-100" />
                    <p className="text-slate-400 font-medium text-sm uppercase tracking-widest">Loading Requests...</p>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <AlertCircle size={32} className="mx-auto mb-3 text-slate-100" />
                    <p className="text-slate-400 font-medium text-sm uppercase tracking-widest">No requests found</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((req) => (
                  <tr key={req.id} className={`hover:bg-slate-50/50 transition-colors ${editingId === req.id ? 'bg-indigo-50/40' : ''}`}>
                    <td className="px-6 py-6"><p className="text-sm font-medium text-slate-800">{req.name}</p></td>
                    <td className="px-6 py-6">
                      <div className="space-y-2 text-left">
                        <a href={`mailto:${req.email}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-slate-600 font-semibold group/contact hover:text-indigo-600 transition-colors w-fit">
                          <div className="p-1 rounded-[6px] bg-slate-50 group-hover/contact:bg-indigo-50 border border-slate-100 group-hover/contact:border-indigo-100 mr-2 transition-all shrink-0">
                            <Mail size={10} className="text-slate-400 group-hover/contact:text-indigo-500" />
                          </div>
                          {req.email || 'N/A'}
                        </a>
                        <a href={`tel:${req.contact}`} className="flex items-center text-xs text-slate-600 font-semibold group/contact hover:text-indigo-600 transition-colors w-fit">
                          <div className="p-1 rounded-[6px] bg-slate-50 group-hover/contact:bg-indigo-50 border border-slate-100 group-hover/contact:border-indigo-100 mr-2 transition-all shrink-0">
                            <Phone size={10} className="text-slate-400 group-hover/contact:text-indigo-500" />
                          </div>
                          {req.contact || 'N/A'}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {editingId === req.id ? (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                          <input type="date" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} className="w-full text-xs p-2 border rounded-xl outline-none focus:border-indigo-400" />
                          <input type="text" placeholder="Time..." value={editData.time} onChange={(e) => setEditData({ ...editData, time: e.target.value })} className="w-full text-xs p-2 border rounded-xl outline-none focus:border-indigo-400" />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-slate-700">{req.preferredDate ? req.preferredDate.split('-').reverse().join('/') : 'N/A'}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{req.preferredTime || 'Anytime'}</p>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-6"><StatusBadge status={req.status} /></td>
                    <td className="px-6 py-6 border-l border-slate-50">
                      <div className="flex items-center justify-center gap-1.5">
                        {editingId === req.id ? (
                          <>
                            <button onClick={() => handleInlineReschedule(req.id)} disabled={updatingId === req.id || !editData.date} className="p-2 bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-100 active:scale-95 disabled:opacity-50 transition-all"><CheckCircle2 size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="p-2 bg-slate-50 text-slate-400 rounded-lg border border-slate-200 active:scale-95 transition-all"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <div className="w-[85px]">
                              {req.status === 'Pending' && <button onClick={() => { handleUpdateStatus(req.id, 'Called'); if (req.contact) window.location.href = `tel:${req.contact}`; }} disabled={updatingId === req.id} className="w-full flex items-center justify-center gap-2 bg-[#4f46e5] text-white py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50 transition-all"><PhoneCall size={10} /> Call Now</button>}
                              {req.status === 'Called' && <button onClick={() => handleUpdateStatus(req.id, 'Resolved')} disabled={updatingId === req.id} className="w-full flex items-center justify-center gap-2 bg-[#059669] text-white py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider shadow-lg shadow-emerald-100 active:scale-95 disabled:opacity-50 transition-all"><CheckCircle2 size={10} /> Resolve</button>}
                              {req.status === 'Resolved' && <div className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-600 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider border border-emerald-100"><CheckCircle2 size={10} /> Done</div>}
                            </div>
                            <button onClick={() => { setEditData({ date: req.preferredDate || '', time: req.preferredTime || '' }); setEditingId(req.id); }} className="p-2 rounded-lg text-slate-400 bg-white border border-slate-200 shadow-sm hover:text-indigo-600 active:scale-95 transition-all" title="Reschedule"><Clock size={14} /></button>
                            <button onClick={() => router.push(`/callback-requests/${req.id}`)} className="p-2 rounded-lg text-slate-400 bg-white border border-slate-200 shadow-sm hover:text-indigo-600 active:scale-95 transition-all" title="View Details"><Eye size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-6 border-t border-slate-50 bg-slate-50/30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
              Showing <span className="text-slate-400">{indexOfFirstItem + 1}</span> to <span className="text-slate-400">{Math.min(indexOfLastItem, filteredRequests.length)}</span> of <span className="text-slate-400">{filteredRequests.length}</span> results
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-2.5 rounded-xl text-slate-400 bg-white border border-slate-200 hover:text-indigo-600 disabled:opacity-30 transition-all active:scale-90 shadow-sm"><ChevronLeft size={16} /></button>
              <div className="flex items-center gap-1.5">
                {[...Array(totalPages)].map((_, i) => (<button key={i} onClick={() => paginate(i + 1)} className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all border ${currentPage === i + 1 ? "bg-[#4f46e5] text-white border-[#4f46e5] shadow-lg shadow-indigo-100" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}>{i + 1}</button>))}
              </div>
              <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-2.5 rounded-xl text-slate-400 bg-white border border-slate-200 hover:text-indigo-600 disabled:opacity-30 transition-all active:scale-90 shadow-sm"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
