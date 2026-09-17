"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Briefcase, Calendar, IndianRupee, Upload } from 'lucide-react';
import RestaurantLoader from '@/components/RestaurantLoader';
import { expenseCategories, paymentModes } from '../../../data/expenseConstants';
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

export default function EditExpensePage() {
  const { id } = useParams();
  const router = useRouter();
  const [expense, setExpense] = useState(null);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const [expRes, projRes] = await Promise.all([
          fetch(`${getApiBase()}/api/services/expenses/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${getApiBase()}/api/services/projects?limit=-1`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const expJson = await expRes.json().catch(() => ({}));
        const projJson = await projRes.json().catch(() => ({}));

        if (projJson.success) setProjects(Array.isArray(projJson.projects) ? projJson.projects : []);
        else setProjects([]);

        if (expJson.success) {
          const e = expJson.data;
          setExpense(e);
          setForm({
            title: e.title || '',
            category: e.category || '',
            amount: String(e.amount ?? ''),
            date: e.expenseDate ? new Date(e.expenseDate).toISOString().slice(0, 10) : '',
            serviceProjectId: String(e.serviceProjectId || ''),
            paymentMode: e.paymentMode || '',
            notes: e.notes || ''
          });
        } else {
          setExpense({ _notFound: true });
        }
      } catch (e) {
        console.error('Error loading expense edit:', e);
        setExpense({ _notFound: true });
      }
    };
    fetchAll();
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!String(form.title || '').trim()) e.title = 'Required';
    if (!form.category) e.category = 'Required';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Invalid';
    if (!form.date) e.date = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const res = await fetch(`${getApiBase()}/api/services/expenses/${id}`, {
        method: 'PUT',
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
        alert(data.message || 'Failed to update');
        return;
      }

      if (receipt) {
        const fd = new FormData();
        fd.append('receipt', receipt);
        const uploadRes = await fetch(`${getApiBase()}/api/services/expenses/${id}/receipt`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        });
        const uploadJson = await uploadRes.json().catch(() => ({}));
        if (!uploadJson.success) {
          alert(uploadJson.message || 'Expense updated, but receipt upload failed');
        }
      }

      router.push(`/services/expenses/${id}`);
    } catch (err) {
      console.error('Update expense failed:', err);
      alert('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  };

  if (!expense) return <RestaurantLoader />;
  if (expense._notFound) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <button onClick={() => router.back()} className="text-sm font-bold text-indigo-600">← Back</button>
        <p className="mt-4 text-gray-600 font-semibold">Expense not found.</p>
      </div>
    );
  }
  if (!form) return <RestaurantLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 pt-4">
      <div className="flex items-center justify-between gap-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-semibold">
          <ArrowLeft size={18} /> Back
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
        >
          <Save size={18} /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
        <form onSubmit={save} className="p-8 lg:p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="md:col-span-2">
              <Field label="Narration" required error={errors.title}>
                <input value={form.title} onChange={(e) => set('title', e.target.value)} className={inputCls(errors.title)} />
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
              <input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} className={inputCls(errors.amount)} />
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
              <Field label="Notes">
                <textarea rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} className={`${inputCls(false)} resize-none py-4`} />
              </Field>
            </div>

            <div className="md:col-span-2">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Evidence (optional)</label>
              <label className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-[1.5rem] cursor-pointer transition-all ${receipt ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-50 bg-gray-50/30 hover:border-indigo-200 hover:bg-white'}`}>
                <div className={`p-3 rounded-xl bg-white shadow-sm ${receipt ? 'text-indigo-600' : 'text-gray-300'}`}>
                  <Upload size={24} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">{receipt ? receipt.name : 'Upload Receipt'}</p>
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
                      setReceipt(null);
                      return;
                    }
                    setReceipt(file || null);
                  }}
                />
              </label>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
