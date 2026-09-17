"use client";
import React, { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import { useRouter } from 'next/navigation';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Plus,
  RefreshCw,
  Eye,
  Building2,
  FileText,
  ChevronLeft,
  Check,
  UploadCloud,
  User,
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
    className={`bg-white p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border flex items-center space-x-4 cursor-pointer ${active ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-gray-100'}`}
  >
    <div className={`p-3 rounded-full ${bgColor} text-white shadow-md shrink-0`}>
      {icon}
    </div>
    <div className="flex flex-col">
      <h3 className="text-gray-400 font-semibold tracking-wide text-[10px] uppercase mb-0.5">{title}</h3>
      <p className="text-xl font-black text-gray-800 tracking-tight">{value ?? 0}</p>
    </div>
  </div>
);

export default function CustomersPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [customers, setCustomers] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_BASE;

  const stats = {
    total: customers.length,
    pending: customers.filter(o => o.status === 'Pending').length,
    verified: customers.filter(o => o.status === 'Verified').length,
    rejected: customers.filter(o => o.status === 'Rejected').length
  };

  const [formData, setFormData] = useState({
    fullName: '',
    customerCode: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: '',
    paymentStatus: '',
    advanceTaken: '',
    totalAmount: '',
    additionalFiles: null
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/customer`);
      if (res.data.success) setCustomers(res.data.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const validateStep = (step) => {
    let newErrors = {};
    if (step === 1) {
      if (!formData.businessName) newErrors.businessName = 'Business name is required';
      if (!formData.businessType) newErrors.businessType = 'Business type is required';
      if (!formData.panType) newErrors.panType = 'PAN type is required';
      if (!formData.panNumber) newErrors.panNumber = 'PAN number is required';
      else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber)) newErrors.panNumber = 'Invalid PAN format';
      if (!formData.addressProofType) newErrors.addressProofType = 'Address proof type is required';
    } else if (step === 2) {
      if (!formData.fullName) newErrors.fullName = 'Full name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      else if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = '10 digits required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => validateStep(currentStep) && setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post(`/customer`, formData);
      if (res.data.success) {
        setCustomers(prev => [res.data.data, ...prev]);
        setShowForm(false);
        setFormData({
          fullName: '', customerCode: '', phone: '', email: '',
          address: '', paymentMethod: '', paymentStatus: '',
          advanceTaken: '', totalAmount: '', additionalFiles: null
        });
      }
    } catch (err) {
      console.error("Submit Error:", err);
      alert(err.response?.data?.message || "Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, serialId) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customer/CT-${String(serialId).padStart(2, '0')}`);
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Delete Error:", err);
      alert('Failed to delete customer.');
    }
  };

  const filteredData = customers.filter(item => {
    const searchStr = search.toLowerCase();
    const fullName = item.fullName || '';
    const email = item.email || '';
    const code = item.customerCode || '';
    const matchesSearch = !search ||
      fullName.toLowerCase().includes(searchStr) ||
      email.toLowerCase().includes(searchStr) ||
      code.toLowerCase().includes(searchStr);
    const matchesStatus = !statusFilter || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (showForm) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] animate-in fade-in zoom-in-95 duration-500 pb-20">
        <div className="max-w-4xl mx-auto px-4"> 
          <div className="mb-8 flex items-center justify-between">
            <div>
              <button onClick={() => setShowForm(false)} className="mb-4 flex items-center space-x-2 text-gray-400 hover:text-indigo-600 transition-colors font-bold text-sm group">
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span>Back to Customer Registry</span>
              </button>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Add New Customer</h1>
              <p className="text-gray-400 font-medium text-sm uppercase tracking-widest">Initialize a new business partnership record</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-100/20 border border-gray-100 overflow-hidden">
            <div className="p-8 md:p-12 space-y-10">
              {/* Primary Information */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <User size={18} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Primary Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., John Doe"
                      className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Code *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., CUST-001"
                      className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                      value={formData.customerCode}
                      onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., +91 9876543210"
                      className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                    <input
                      type="email"
                      placeholder="e.g., john@example.com"
                      className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </section>

              {/* Location & Files */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <FileText size={18} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Additional Details</h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                    <textarea
                      rows={3}
                      placeholder="Enter full address"
                      className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm resize-none"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Additional Files (optional)</label>
                    <div className="relative group">
                      <div className="w-full px-6 py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center transition-all group-hover:border-indigo-400 group-hover:bg-indigo-50/30">
                        <UploadCloud size={32} className="text-slate-300 group-hover:text-indigo-500 mb-2 transition-colors" />
                        <p className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">Upload receipts, agreements, or ID proofs (PDF/JPG/PNG)</p>
                        <input
                          type="file"
                          multiple
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => setFormData({ ...formData, additionalFiles: e.target.files })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Financial Information */}
              <section className="bg-slate-50 -mx-8 md:-mx-12 px-8 md:px-12 py-10 border-y border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <RefreshCw size={18} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Financial Status</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                    <select
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 appearance-none text-sm cursor-pointer"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      <option value="">Select Method</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="UPI">UPI</option>
                      <option value="Check">Check</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Status</label>
                    <select
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 appearance-none text-sm cursor-pointer"
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                    >
                      <option value="">Select Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Fully Paid">Fully Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Advance Taken (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g., 5000.00"
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                      value={formData.advanceTaken}
                      onChange={(e) => setFormData({ ...formData, advanceTaken: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g., 15000.00"
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="px-8 md:px-12 py-8 bg-white border-t border-slate-50 flex items-center justify-end gap-4">
               <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-8 py-4 rounded-full font-bold text-slate-400 hover:text-slate-600 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-full font-bold text-sm shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:bg-slate-300 disabled:shadow-none flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                {loading ? 'Creating...' : 'Add Customer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
             <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Customer Registry</h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5 uppercase tracking-widest">Active Business Partnership Portfolio</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button suppressHydrationWarning onClick={fetchCustomers} className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-500 text-xs font-bold px-4 py-2.5 rounded-xl border border-gray-100 transition-all">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync
          </button>
          <button suppressHydrationWarning onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95">
            <Plus size={14} />
            Add New Customer 
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { key: '', title: 'Portfolio Total', value: stats.total, icon: <Building2 size={22} />, bgColor: 'bg-blue-500' },
          { key: 'Pending', title: 'Awaiting Validation', value: stats.pending, icon: <Clock size={22} />, bgColor: 'bg-yellow-500' },
          { key: 'Verified', title: 'Verified Status', value: stats.verified, icon: <CheckCircle2 size={22} />, bgColor: 'bg-green-500' },
          { key: 'Rejected', title: 'Inactive Registry', value: stats.rejected, icon: <AlertCircle size={22} />, bgColor: 'bg-red-500' },
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
          placeholder="Filter by business signature, email or contact..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden pb-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 bg-gray-50/60 font-bold text-gray-400 uppercase text-[10px] tracking-widest">
              <th className="text-left px-8 py-5">Partner Signature</th>
              <th className="text-left px-8 py-5">Main Liaison</th>
              <th className="text-left px-8 py-5">Category</th>
              <th className="text-left px-8 py-5">Status</th>
              <th className="text-left px-8 py-5">Entry Date</th>
              <th className="px-8 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
                <tr><td colSpan={6} className="text-center py-24 text-gray-400 font-bold animate-pulse">Synchronizing Records...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-24">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-4 animate-pulse">
                      <Users size={32} />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic opacity-50 underline decoration-indigo-200 decoration-2 decoration-offset-4">Secure Customer Registry Empty</p>
                  </div>
                </td>
              </tr>
            ) : filteredData.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-8 py-5 text-xs">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                      {item.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{item.fullName}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter self-start">ID: {item.customerCode}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-xs font-bold text-slate-600">
                  <p>{item.phone}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{item.email}</p>
                </td>
                <td className="px-8 py-5">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{item.paymentMethod || 'N/A'}</span>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[item.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {item.paymentStatus || 'Pending'}
                  </span>
                </td>
                <td className="px-8 py-5 text-xs text-slate-400 font-bold" suppressHydrationWarning>
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
                <td className="px-8 py-5 text-right uppercase font-black text-[10px]">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => router.push(`/customers/edit/CT-${String(item.serialId).padStart(2, '0')}`)} className="bg-slate-50 hover:bg-amber-500 hover:text-white text-slate-400 p-2.5 rounded-xl transition-all shadow-sm border border-slate-100">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => router.push(`/customers/CT-${String(item.serialId).padStart(2, '0')}`)} className="bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-400 p-2.5 rounded-xl transition-all shadow-sm border border-slate-100">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => handleDelete(item.id, item.serialId)} className="bg-slate-50 hover:bg-red-500 hover:text-white text-slate-400 p-2.5 rounded-xl transition-all shadow-sm border border-slate-100">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
