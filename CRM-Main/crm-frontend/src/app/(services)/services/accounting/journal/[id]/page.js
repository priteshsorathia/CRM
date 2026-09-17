"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Printer, Share2, MoreVertical, Calendar, Hash, FileText, CheckCircle2 } from 'lucide-react';
import RestaurantLoader from '@/components/RestaurantLoader';
import { getApiBase } from '@/utils/apiBase';

const toCode = (id) => `JNL-${String(id).padStart(4, '0')}`;

export default function ViewJournalEntryPage() {
  const router = useRouter();
  const { id } = useParams();
  const [entry, setEntry] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setError('');
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const res = await fetch(`${getApiBase()}/api/services/accounting/journals/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));
        if (!data.success) throw new Error(data.message || 'Failed to load entry');
        setEntry(data.data);
      } catch (e) {
        console.error('Failed to load journal entry:', e);
        setError(e.message || 'Failed to load entry');
        setEntry({});
      }
    })();
  }, [id]);

  const view = useMemo(() => {
    if (!entry || error) return null;
    const lines = Array.isArray(entry.lines) ? entry.lines : [];
    return {
      code: toCode(entry.id),
      date: entry.entryDate ? new Date(entry.entryDate).toLocaleDateString() : '',
      ref: entry.reference || '',
      narration: entry.narration || '',
      status: entry.status || 'Posted',
      postedBy: entry.createdBy?.name || entry.createdBy?.username || '—',
      postedAt: entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '',
      lines: lines.map((l) => ({
        ledger: l.ledger || '',
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
        desc: l.description || ''
      }))
    };
  }, [entry, error]);

  if (entry === null) return <RestaurantLoader />;
  if (error) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 pb-20">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all active:scale-90 bg-white inline-flex"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-sm font-bold text-rose-700">
          {error}
        </div>
      </div>
    );
  }

  const totalDr = view.lines.reduce((s, l) => s + l.debit, 0);
  const totalCr = view.lines.reduce((s, l) => s + l.credit, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-md transition-all active:scale-90 bg-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              {view.code}
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md">
                {view.status}
              </span>
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Transaction Identity Profile</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all bg-white">
            <Printer size={18} />
          </button>
          <button className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all bg-white">
            <Share2 size={18} />
          </button>
          <button className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm transition-all bg-white">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Calendar size={12} className="text-indigo-500" /> Transaction Date
                  </span>
                  <p className="text-lg font-black text-gray-800">{view.date}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Hash size={12} className="text-indigo-500" /> Reference Source
                  </span>
                  <p className="text-lg font-black text-gray-800">{view.ref || 'NA'}</p>
                </div>
                <div className="col-span-2 space-y-1 pt-4 border-t border-gray-50">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <FileText size={12} className="text-indigo-500" /> Primary Narration
                  </span>
                  <p className="text-base font-bold text-gray-700 leading-relaxed">{view.narration}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[540px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-widest">Ledger</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-indigo-600 uppercase tracking-widest">Debit (₹)</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-indigo-900 uppercase tracking-widest">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {view.lines.map((line, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="font-black text-gray-800">{line.ledger}</p>
                        {line.desc ? <p className="text-xs text-gray-400 font-medium mt-0.5">{line.desc}</p> : null}
                      </td>
                      <td className="px-6 py-5 text-right font-black text-indigo-600 text-lg">
                        {line.debit > 0 ? `₹${line.debit.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-6 py-5 text-right font-black text-indigo-900 text-lg">
                        {line.credit > 0 ? `₹${line.credit.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-indigo-100">
                  <tr>
                    <td className="px-6 py-5 text-xs font-black text-gray-500 uppercase tracking-widest">Aggregate Settlement</td>
                    <td className="px-6 py-5 text-right font-black text-indigo-600 text-xl">₹{totalDr.toLocaleString()}</td>
                    <td className="px-6 py-5 text-right font-black text-indigo-900 text-xl">₹{totalCr.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
              <CheckCircle2 size={40} className="text-emerald-50 opacity-10" />
            </div>
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Audit Trail</h4>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0">
                  {(view.postedBy || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-black text-gray-700 uppercase tracking-widest">Posted By</p>
                  <p className="text-sm font-bold text-gray-500 mt-0.5">{view.postedBy}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{view.postedAt}</p>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">System Status</p>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-[11px] font-bold text-gray-500 leading-relaxed">
                  This entry has been posted to the general ledger successfully.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-6 shadow-xl shadow-indigo-100 text-white">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-4">Post-Action Insight</h4>
            <p className="text-sm font-bold leading-relaxed">
              To correct errors, post a reversal entry and re-record the transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

