"use client";
import React, { useState, useEffect, use } from 'react';
import api from '../../../../../lib/axios';
import { useRouter } from 'next/navigation';
import {
  Users,
  ChevronLeft,
  Check,
  UploadCloud,
  Loader2,
  Building2
} from 'lucide-react';

export default function EditCustomerPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
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

  const API_URL = process.env.NEXT_PUBLIC_API_BASE;

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const res = await api.get(`/customer/${id}`);
        if (res.data.success) {
          const item = res.data.data;
          setFormData({
            fullName: item.fullName || '',
            customerCode: item.customerCode || '',
            phone: item.phone || '',
            email: item.email || '',
            address: item.address || '',
            paymentMethod: item.paymentMethod || '',
            paymentStatus: item.paymentStatus || '',
            advanceTaken: item.advanceTaken || 0,
            totalAmount: item.totalAmount || 0,
            additionalFiles: null
          });
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        alert("Failed to load customer profile");
        router.push('/customers');
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id, API_URL, router]);

  const validateStep = (step) => {
    let newErrors = {};
    if (step === 1) {
      if (!formData.businessName) newErrors.businessName = 'Signature required';
    } else if (step === 2) {
      if (!formData.fullName) newErrors.fullName = 'Liaison name required';
      if (!formData.email) newErrors.email = 'Email required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => validateStep(currentStep) && setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.put(`/customer/${id}`, formData);
      if (res.data.success) {
        router.push('/customers');
      }
    } catch (err) {
      console.error("Submit Error:", err);
      alert(err.response?.data?.message || "Modification failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Hydrating Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] animate-in fade-in zoom-in-95 duration-500 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <button onClick={() => router.push('/customers')} className="mb-4 flex items-center space-x-2 text-gray-400 hover:text-indigo-600 transition-colors font-bold text-sm group">
            <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100">
               <Users size={28} />
            </div>
            <div>
               <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-2">Modify Client Profile</h1>
               <p className="text-gray-400 font-medium text-xs uppercase tracking-[0.2em]">Editing record: {id}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-100/20 border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12 space-y-10">
            {/* Primary Details */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Building2 size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Essential Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="Official name"
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 text-sm shadow-sm"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Customer Code *</label>
                  <input
                    required
                    readOnly
                    type="text"
                    className="w-full px-6 py-4 bg-slate-100 border border-transparent rounded-2xl outline-none font-bold text-slate-400 text-sm cursor-not-allowed"
                    value={formData.customerCode}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone *</label>
                  <input
                    required
                    type="text"
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 text-sm shadow-sm"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Liaison Email</label>
                  <input
                    type="email"
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 text-sm shadow-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* Address & Artifacts */}
            <section>
               <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <UploadCloud size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Supporting Evidence</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address Portfolio</label>
                  <textarea
                    rows={3}
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-700 text-sm shadow-sm resize-none"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Update full business address..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Update Document Inventory</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all group">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 mb-4 group-hover:text-indigo-600 transition-colors">
                      <UploadCloud size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em] text-center">Drag & Drop new artifacts here <br/> <span className="opacity-50 text-[10px] mt-1 block">Maximum file size: 5MB per selection</span></p>
                    <input
                      type="file"
                      multiple
                      className="absolute inset-x-0 h-40 opacity-0 cursor-pointer"
                      onChange={(e) => setFormData({ ...formData, additionalFiles: e.target.files })}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Financial Ledger */}
            <section className="bg-slate-50/80 rounded-[2rem] p-8 border border-slate-100">
               <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Check size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Contractual Ledger</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Method</label>
                  <select
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none appearance-none text-sm cursor-pointer shadow-sm"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="">N/A</option>
                    <option value="Cash">Cash Liquidity</option>
                    <option value="Bank Transfer">Institutional Wire</option>
                    <option value="UPI">Digital Wallet (UPI)</option>
                    <option value="Check">Check / Draft</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Status</label>
                  <select
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none appearance-none text-sm cursor-pointer shadow-sm"
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  >
                    <option value="Pending">Pending Audit</option>
                    <option value="Partially Paid">Partial Distribution</option>
                    <option value="Fully Paid">Verified Completion</option>
                    <option value="Overdue">Breach of Terms</option>
                  </select>
                </div>
                 <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Advance Commitment (₹)</label>
                  <input
                    type="number"
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 text-sm shadow-sm"
                    value={formData.advanceTaken}
                    onChange={(e) => setFormData({ ...formData, advanceTaken: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Contract Value (₹)</label>
                  <input
                    type="number"
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-slate-700 text-sm shadow-sm"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="px-12 py-10 bg-white border-t border-slate-50 flex items-center justify-end gap-5">
            <button
               type="button"
               onClick={() => router.push('/customers')}
               className="px-8 py-4 rounded-full font-black text-slate-400 hover:text-slate-600 transition-all text-sm uppercase tracking-widest"
             >
               Discard
             </button>
             <button
               type="submit"
               disabled={submitting}
               className={`px-12 py-4 rounded-full font-black text-sm shadow-2xl transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest ${submitting ? 'bg-slate-300 text-slate-500' : 'bg-indigo-600 hover:bg-slate-900 text-white shadow-indigo-200'}`}
             >
               {submitting ? (
                 <Loader2 size={18} className="animate-spin" />
               ) : (
                 <Check size={18} />
               )}
               {submitting ? 'Executing Sync...' : 'Synchronize Record'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
