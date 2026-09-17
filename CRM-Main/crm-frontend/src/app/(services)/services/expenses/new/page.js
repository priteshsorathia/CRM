"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Send, ShieldCheck, Briefcase, Calendar, IndianRupee } from 'lucide-react';
import { expenseCategories, paymentModes } from '../../data/expenseConstants';
import { getApiBase } from '@/utils/apiBase';
import { isSvgFile } from '@/utils/fileValidation';

const inputCls = (err) =>
  `w-full px-4 py-3 rounded-xl border ${err ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-100 focus:ring-indigo-100 bg-gray-50/20'} focus:outline-none focus:ring-4 focus:border-indigo-400 text-sm font-semibold text-gray-800 transition-all`;

const Field = ({ label, required, error, children, icon: Icon }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
      {Icon && <Icon size={11} className="text-indigo-400" />}
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider ml-1">{error}</span>}
  </div>
);

const blank = { title: '', category: '', amount: '', date: '', serviceProjectId: '', paymentMode: '', notes: '', receipt: null };

export default function NewExpensePage() {
  const router = useRouter();
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const res = await fetch(`${getApiBase()}/api/services/projects?limit=-1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));
        if (data.success) setProjects(Array.isArray(data.projects) ? data.projects : []);
        else setProjects([]);
      } catch (e) {
        console.error('Error fetching projects:', e);
        setProjects([]);
      }
    };
    fetchProjects();
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!String(form.title || '').trim()) e.title = 'Narration is required';
    if (!form.category) e.category = 'Category is required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Invalid amount';
    if (!form.date) e.date = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const res = await fetch(`${getApiBase()}/api/services/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          amount: Number(form.amount),
          expenseDate: form.date,
          paymentMode: form.paymentMode || null,
          notes: form.notes || null,
          serviceProjectId: form.serviceProjectId ? Number(form.serviceProjectId) : null
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        alert(data.message || 'Failed to create expense');
        return;
      }

      const createdId = data?.data?.id;
      if (createdId && form.receipt) {
        const fd = new FormData();
        fd.append('receipt', form.receipt);
        const uploadRes = await fetch(`${getApiBase()}/api/services/expenses/${createdId}/receipt`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        });
        const uploadJson = await uploadRes.json().catch(() => ({}));
        if (!uploadJson.success) {
          alert(uploadJson.message || 'Expense created, but receipt upload failed');
        }
      }

      router.push('/services/expenses');
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 pt-4">
      {/* Header */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all active:scale-90 bg-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-0.5 w-4 bg-indigo-500 rounded-full" />
            <span className="text-[9px] font-bold tracking-[0.2em] text-indigo-500 uppercase">Expense Submission</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">New Claim</h1>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 lg:p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="md:col-span-2">
              <Field label="Narration" required error={errors.title}>
                <input value={form.title} onChange={(e) => set('title', e.target.value)} className={inputCls(errors.title)} placeholder="e.g. Flight to Mumbai" />
              </Field>
            </div>

            <Field label="Category" required error={errors.category}>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls(errors.category)}>
                <option value="" className="font-semibold text-xs">Select</option>
                {expenseCategories.map((c) => (
                  <option key={c} className="font-semibold text-xs">{c}</option>
                ))}
              </select>
            </Field>

            <Field label="Amount (₹)" required error={errors.amount} icon={IndianRupee}>
              <input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} className={inputCls(errors.amount)} placeholder="0.00" />
            </Field>

            <Field label="Date" required error={errors.date} icon={Calendar}>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={inputCls(errors.date)} />
            </Field>

            <Field label="Project Relation" error={errors.serviceProjectId} icon={Briefcase}>
              <select value={form.serviceProjectId} onChange={(e) => set('serviceProjectId', e.target.value)} className={inputCls(errors.serviceProjectId)}>
                <option value="" className="font-semibold text-xs">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="font-semibold text-xs">
                    {p.name} ({p.projectId})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Payment Mode">
              <select value={form.paymentMode} onChange={(e) => set('paymentMode', e.target.value)} className={inputCls(false)}>
                <option value="" className="font-semibold text-xs">Select</option>
                {paymentModes.map((m) => (
                  <option key={m} className="font-semibold text-xs">{m}</option>
                ))}
              </select>
            </Field>

            <div className="md:col-span-2">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Evidence (optional)</label>
              <label className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-[1.5rem] cursor-pointer transition-all ${form.receipt ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-50 bg-gray-50/30 hover:border-indigo-200 hover:bg-white'}`}>
                <div className={`p-3 rounded-xl bg-white shadow-sm ${form.receipt ? 'text-indigo-600' : 'text-gray-300'}`}>
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">{form.receipt ? form.receipt.name : 'Upload Receipt'}</p>
                  <p className="text-[9px] font-semibold text-gray-400 mt-0.5 uppercase tracking-widest">PDF, JPG (MAX 10MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && isSvgFile(file)) {
                      e.target.value = "";
                      set('receipt', null);
                      return;
                    }
                    set('receipt', file || null);
                  }}
                />
              </label>
              <p className="text-[10px] text-gray-400 font-semibold mt-2 px-1">PDF/JPG/PNG supported. Max 10MB.</p>
            </div>

            <div className="md:col-span-2">
              <Field label="Notes">
                <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} className={`${inputCls(false)} resize-none py-4`} placeholder="Add justification notes..." />
              </Field>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 text-indigo-300">
              <ShieldCheck size={20} />
              <p className="text-[9px] font-semibold uppercase tracking-widest max-w-[180px] leading-relaxed">System-authorized audit entry</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button type="button" onClick={() => router.back()} className="flex-1 sm:flex-none px-8 py-3 rounded-xl border border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                {loading ? 'Sending...' : <><Send size={14} /> Submit Claim</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
