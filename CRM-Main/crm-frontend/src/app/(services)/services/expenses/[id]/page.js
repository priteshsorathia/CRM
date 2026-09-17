"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, Pencil, Trash2, Paperclip, ExternalLink, Upload, Download } from 'lucide-react';
import RestaurantLoader from '@/components/RestaurantLoader';
import { getApiBase } from '@/utils/apiBase';
import { useRole } from '@/app/(services)/context/RoleContext';
import { isSvgFile } from '@/utils/fileValidation';

const toCode = (id) => `EXP-${String(id).padStart(4, '0')}`;

const badge = {
  Pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  Approved: 'bg-green-50 text-green-700 border border-green-200',
  Rejected: 'bg-red-50 text-red-700 border border-red-200',
  Reimbursed: 'bg-blue-50 text-blue-700 border border-blue-200',
};

export default function ExpenseViewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { can } = useRole();
  const [expense, setExpense] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const downloadFile = async (url, fileName) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const fetchExpense = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const res = await fetch(`${getApiBase()}/api/services/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) setExpense(data.data);
      else setExpense({ _notFound: true });
    } catch (e) {
      console.error('Error fetching expense:', e);
      setExpense({ _notFound: true });
    }
  };

  useEffect(() => {
    fetchExpense();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const uploadReceipt = async (file) => {
    if (!file) return;
    try {
      setIsUploadingReceipt(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const fd = new FormData();
      fd.append('receipt', file);
      const res = await fetch(`${getApiBase()}/api/services/expenses/${id}/receipt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) {
        alert(data.message || 'Receipt upload failed');
        return;
      }
      setReceiptFile(null);
      await fetchExpense();
    } catch (e) {
      console.error('Receipt upload failed:', e);
      alert('Receipt upload failed');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const patchStatus = async (action) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const body =
        action === 'reject'
          ? (() => {
            const reason = prompt('Reject reason (optional):') || '';
            return reason ? { rejectionReason: reason } : undefined;
          })()
          : undefined;

      const res = await fetch(`${getApiBase()}/api/services/expenses/${id}/${action}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) throw new Error(data.message || 'Failed');
      await fetchExpense();
    } catch (e) {
      console.error('Status update failed:', e);
      alert(e.message || 'Failed to update status');
    }
  };

  const deleteExpense = async () => {
    if (!confirm('Delete this expense?')) return;
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const res = await fetch(`${getApiBase()}/api/services/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) router.push('/services/expenses');
      else alert(data.message || 'Failed to delete expense');
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Failed to connect to server');
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

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-4 space-y-6 px-4 sm:px-0">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-bold group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] uppercase tracking-widest">Back to List</span>
        </button>

        <div className="flex items-center gap-2">
          {can('EXPENSES', 'UPDATE') && (
            <button
              onClick={() => router.push(`/services/expenses/edit/${expense.id}`)}
              className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
              title="Edit"
            >
              <Pencil size={18} />
            </button>
          )}
          {can('EXPENSES', 'DELETE') && (
            <button
              onClick={deleteExpense}
              className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all shadow-sm active:scale-95"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-indigo-100/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start justify-between gap-6 relative z-10">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight break-words">
                {expense.title}
              </h1>
              <span className={`w-fit px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest shrink-0 ${badge[expense.status] || ''}`}>
                {expense.status}
              </span>
            </div>
            <p className="inline-flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md uppercase tracking-widest">
              ID: {toCode(expense.id)}
            </p>
          </div>

          {expense.status === 'Pending' && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => patchStatus('approve')}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 inline-flex items-center justify-center gap-2"
              >
                <Check size={16} strokeWidth={3} /> Approve
              </button>
              <button
                onClick={() => patchStatus('reject')}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all active:scale-95 inline-flex items-center justify-center gap-2"
              >
                <X size={16} strokeWidth={3} /> Reject
              </button>
            </div>
          )}
        </div>

        <div className="p-6 grid grid-cols-2 md:grid-cols-2 gap-4 sm:gap-6 bg-gray-50/30">
          <div className="col-span-1 rounded-2xl bg-white p-4 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Employee</p>
            <p className="text-sm font-bold text-gray-900 truncate">
              {expense.user?.name || expense.user?.username || '—'}
            </p>
          </div>
          
          <div className="col-span-1 rounded-2xl bg-white p-4 border border-gray-100 shadow-sm font-black">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Amount</p>
            <p className="text-sm font-black text-indigo-600">
              ₹{Number(expense.amount || 0).toLocaleString()}
            </p>
          </div>

          <div className="col-span-2 rounded-2xl bg-white p-4 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Project / Category</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                {expense.serviceProject?.name || 'No Project'}
              </span>
              <span className="text-gray-300">/</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest border border-gray-200">
                {expense.category || 'No Category'}
              </span>
            </div>
          </div>

          <div className="col-span-1 rounded-2xl bg-white p-4 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Date</p>
            <p className="text-xs font-bold text-gray-900 mt-1">
              {expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>

          <div className="col-span-1 rounded-2xl bg-white p-4 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Mode</p>
            <p className="text-xs font-bold text-gray-900 mt-1 uppercase tracking-widest">{expense.paymentMode || '—'}</p>
          </div>

          <div className="col-span-2 rounded-2xl bg-indigo-600/5 p-4 border border-indigo-100/50">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-2">Notes & Description</p>
            <p className="text-sm font-semibold text-gray-700 mt-1 whitespace-pre-wrap leading-relaxed">{expense.notes || 'No additional notes provided.'}</p>
          </div>

          <div className="col-span-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-3">Supporting Documentation</p>
            {expense.receiptUrl ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border border-indigo-100 bg-indigo-50/30 shadow-sm transition-all hover:bg-indigo-50/50">
                <div className="min-w-0 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                    <Paperclip size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate leading-tight">{expense.receiptName || 'Expense Receipt'}</p>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1 truncate">{expense.receiptMime || 'Attachment'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={`${getApiBase()}${expense.receiptUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white border border-indigo-200 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 inline-flex items-center justify-center gap-2"
                  >
                    View <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => downloadFile(`${getApiBase()}${expense.receiptUrl}`, expense.receiptName || 'Receipt')}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 inline-flex items-center justify-center gap-2"
                  >
                    Download <Download size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 shadow-sm">
                  <Upload size={24} />
                </div>
                <div className="max-w-[200px]">
                  <p className="text-sm font-black text-gray-900 leading-tight">No receipt uploaded</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Upload PDF or Images (Max 10MB)</p>
                </div>
                <div className="flex flex-col w-full gap-2">
                  <label className="w-full px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all cursor-pointer shadow-sm text-center">
                    {receiptFile ? receiptFile.name : 'Choose File'}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && isSvgFile(file)) {
                          e.target.value = "";
                          setReceiptFile(null);
                          return;
                        }
                        setReceiptFile(file || null);
                      }}
                    />
                  </label>
                  <button
                    disabled={!receiptFile || isUploadingReceipt}
                    onClick={() => uploadReceipt(receiptFile)}
                    className="w-full px-5 py-3 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isUploadingReceipt ? 'Uploading...' : 'Confirm Upload'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {expense.status === 'Rejected' && expense.rejectionReason && (
            <div className="col-span-2 rounded-2xl bg-rose-50 border border-rose-100 p-4">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none mb-2">Rejection Reason</p>
              <p className="text-sm font-bold text-rose-700 mt-1 whitespace-pre-wrap leading-relaxed">{expense.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

