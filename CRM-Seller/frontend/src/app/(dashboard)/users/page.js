"use client";
import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, CheckCircle2, XCircle, Search, Mail, Calendar, RefreshCw, Eye, Pencil, ChevronLeft, User, Phone, Lock, ShieldCheck, UserCog, Trash2, ShoppingBag } from 'lucide-react';
import api from '../../../lib/axios';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_BASE;

const roleColors = {
  Admin: 'bg-indigo-100 text-indigo-700',
  Seller: 'bg-yellow-100 text-yellow-700',
  Staff: 'bg-gray-100 text-gray-600',
  shop_owner: 'bg-orange-100 text-orange-700',
};

const statusColors = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-red-100 text-red-700',
};

const StatCard = ({ title, value, icon, bgColor, active, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white p-4 md:p-5 rounded-2xl shadow-sm border flex items-center space-x-3 md:space-x-4 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${active ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-100'}`}
  >
    <div className={`p-2.5 md:p-3 rounded-full ${bgColor} text-white shadow-sm shrink-0`}>
      {React.cloneElement(icon, { size: 18, className: "md:w-5 md:h-5" })}
    </div>
    <div className="flex flex-col">
      <h3 className="text-gray-400 font-semibold tracking-wide text-[10px] md:text-[10px] uppercase mb-0.5">{title}</h3>
      <p className="text-lg md:text-xl font-semibold text-gray-800 tracking-tight">{value ?? 0}</p>
    </div>
  </div>
);

const Field = ({ label, icon, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      {icon && <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300">{icon}</div>}
      {children}
    </div>
  </div>
);

const inputClass = (hasIcon = true) =>
  `w-full ${hasIcon ? 'pl-12' : 'pl-5'} pr-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm`;

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', username: '', phone: '', role: 'Staff', status: 'Active', password: '' });
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [activeFilter, setActiveFilter] = useState({ type: '', value: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', { params: { role: 'shop_owner' } });
      if (res.data.success) {
        // Backend filtering is preferred, but adding a frontend safety check
        const shopOwners = res.data.data.filter(u => u.role === 'shop_owner');
        setUsers(shopOwners);
      }
    } catch (err) {
      console.error('Fetch Users Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    try {
      setLoading(true);
      const res = await api.post('/users', formData);
      if (res.data.success) {
        setUsers(prev => [res.data.data, ...prev]);
        setShowForm(false);
        setFormData({ name: '', email: '', username: '', phone: '', role: 'Staff', status: 'Active', password: '' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to create user.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      setLoading(true);
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error("Delete Error:", err);
      alert('Failed to delete user.');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    inactive: users.filter(u => u.status === 'Inactive').length,
    admins: users.filter(u => u.role === 'Admin').length,
    shopOwners: users.filter(u => u.role === 'shop_owner').length,
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search ||
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter.type === '' ||
      (activeFilter.type === 'status' && u.status === activeFilter.value) ||
      (activeFilter.type === 'role' && activeFilter.value === 'shop_owner' && u.role === 'shop_owner');

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter]);

  const toggleFilter = (type, value) => {
    setActiveFilter(prev =>
      prev.type === type && prev.value === value ? { type: '', value: '' } : { type, value }
    );
  };

  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  if (showForm) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] animate-in fade-in zoom-in-95 duration-300">
        <div className="max-w-xl mx-auto">
          <div className="mb-6">
            <button onClick={() => setShowForm(false)} className="mb-3 flex items-center space-x-2 text-gray-400 hover:text-gray-600 transition-colors font-bold text-sm group">
              <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
          <h1 className="text-4xl font-semibold text-slate-800 tracking-tight">Add New Customer</h1>
          <p className="text-gray-400 font-medium text-[11px] mt-1">Fill out the details to create a new customer account</p>
          </div>

          {feedback.message && (
            <div className={`mb-4 p-4 rounded-2xl border text-xs font-bold ${feedback.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 space-y-6">
            <Field label="Full Name *" icon={<User size={18} />}>
              <input type="text" value={formData.name} onChange={set('name')} placeholder="e.g., John Doe" required className={inputClass()} />
            </Field>
            <Field label="Email Address *" icon={<Mail size={18} />}>
              <input type="email" value={formData.email} onChange={set('email')} placeholder="e.g., john@example.com" required className={inputClass()} />
            </Field>
            <Field label="Username" icon={<ShieldCheck size={18} />}>
              <input type="text" value={formData.username} onChange={set('username')} placeholder="e.g., johndoe" className={inputClass()} />
            </Field>
            <Field label="Phone Number" icon={<Phone size={18} />}>
              <input type="text" value={formData.phone} onChange={set('phone')} placeholder="e.g., +91 9876543210" className={inputClass()} />
            </Field>
            <Field label="Password *" icon={<Lock size={18} />}>
              <input type="password" value={formData.password} onChange={set('password')} placeholder="••••••••" required className={inputClass()} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Role">
                <select value={formData.role} onChange={set('role')} className={`${inputClass(false)} appearance-none`}>
                  <option value="Staff">Staff</option>
                  <option value="shop_owner">Shop Owner</option>
                  <option value="Seller">Seller</option>
                  <option value="Admin">Admin</option>
                </select>
              </Field>
              <Field label="Status">
                <select value={formData.status} onChange={set('status')} className={`${inputClass(false)} appearance-none`}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </Field>
            </div>
            <div className="pt-4 flex gap-3">
              <button type="submit" disabled={loading} className={`flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-500/10 active:scale-[0.98] ${loading ? 'opacity-70' : ''}`}>
                {loading ? 'Creating...' : 'Add Customer'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-4 rounded-2xl text-gray-400 hover:text-gray-600 font-bold text-xs border border-gray-100 hover:border-gray-200 transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 tracking-tight leading-tight">Shop Owners</h1>
            <p className="text-xs md:text-xs text-gray-400 font-medium mt-0.5">Manage registered shop owners and their access</p>
          </div>
          <button 
            onClick={fetchUsers} 
            className="md:hidden p-3 bg-white hover:bg-gray-50 text-gray-500 rounded-xl border border-gray-100 shadow-sm active:scale-95"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchUsers} className="hidden md:flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-100 transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        <StatCard
          title="Total Shop Owners" value={stats.total} icon={<Users size={20} />} bgColor="bg-blue-500"
          active={activeFilter.type === ''}
          onClick={() => setActiveFilter({ type: '', value: '' })}
        />
        <StatCard
          title="Active Owners" value={stats.active} icon={<CheckCircle2 size={20} />} bgColor="bg-green-500"
          active={activeFilter.type === 'status' && activeFilter.value === 'Active'}
          onClick={() => toggleFilter('status', 'Active')}
        />
        <StatCard
          title="Inactive Owners" value={stats.inactive} icon={<XCircle size={20} />} bgColor="bg-red-500"
          active={activeFilter.type === 'status' && activeFilter.value === 'Inactive'}
          onClick={() => toggleFilter('status', 'Inactive')}
        />
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3 flex items-center gap-3">
        <Search size={16} className="text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, email or username..."
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
                <th className="text-left px-8 py-5">User</th>
                <th className="text-left px-8 py-5">Shop Name</th>
                <th className="text-left px-8 py-5">Role</th>
                <th className="text-left px-8 py-5">Joined</th>
                <th className="text-left px-8 py-5">Status</th>
                <th className="px-8 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-24 text-gray-400 font-bold animate-pulse">Loading Shop Owners...</td></tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-24">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4 animate-pulse">
                        <Users size={32} />
                      </div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic opacity-50">No customers found</p>
                    </div>
                  </td>
                </tr>
              ) : currentUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {(user.name || '?').charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-[11px] leading-tight">{user.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">@{user.username || 'user'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-semibold text-slate-700 text-xs tracking-tight">{user.shop?.name || 'Central Admin'}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-xs text-slate-400 font-bold">
                    {new Date(user.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest ${statusColors[user.status] || 'bg-gray-100 text-gray-600'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => router.push(`/users/edit/UR-${String(user.serialId).padStart(2, '0')}`)} className="bg-slate-50 hover:bg-amber-500 hover:text-white text-slate-400 p-2 rounded-lg transition-all shadow-sm border border-slate-100">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => router.push(`/users/UR-${String(user.serialId).padStart(2, '0')}`)} className="bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-400 p-2 rounded-lg transition-all shadow-sm border border-slate-100">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="bg-slate-50 hover:bg-red-500 hover:text-white text-slate-400 p-2 rounded-lg transition-all shadow-sm border border-slate-100">
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} Shop Owners
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
                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${
                      currentPage === i + 1 
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
                <ChevronLeft size={18} className="rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
