"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Download, Calendar } from 'lucide-react';
import RestaurantLoader from '@/components/RestaurantLoader';
import { getApiBase } from '@/utils/apiBase';

const metaByKey = {
  trial: { label: 'Trial Balance', desc: 'All ledger balances for verification.' },
  pl: { label: 'Profit & Loss', desc: 'Revenue vs expenses over a period.' },
  bs: { label: 'Balance Sheet', desc: 'Assets, liabilities and equity snapshot.' },
  gst: { label: 'GST Report', desc: 'Tax summary by month.' },
  client: { label: 'Client Ledger', desc: 'Per-client invoice summary.' },
  expense: { label: 'Expense Ledger', desc: 'Expenses grouped by category.' }
};

const toYmd = (d) => new Date(d).toISOString().slice(0, 10);

export default function AccountingReportDetailPage() {
  const router = useRouter();
  const { key } = useParams();
  const reportKey = String(key || '').toLowerCase();
  const meta = metaByKey[reportKey] || { label: 'Report', desc: 'Accounting report' };

  const [dateFrom, setDateFrom] = useState(toYmd(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [dateTo, setDateTo] = useState(toYmd(new Date()));
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    try {
      setError('');
      setData(null);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const qs = new URLSearchParams({ dateFrom, dateTo }).toString();
      const res = await fetch(`${getApiBase()}/api/services/accounting/reports/${reportKey}?${qs}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json().catch(() => ({}));
      if (!json.success) throw new Error(json.message || 'Failed to load report');
      setData(json.data || {});
    } catch (e) {
      console.error('Failed to load report:', e);
      setError(e.message || 'Failed to load report');
      setData({});
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportKey]);

  const exportCsv = () => {
    if (!data) return;
    const rows = [];

    if (reportKey === 'trial') {
      rows.push(['Account', 'Debit', 'Credit']);
      for (const r of data.rows || []) rows.push([r.account, r.debit, r.credit]);
    } else if (reportKey === 'pl') {
      rows.push(['Revenue', 'Amount']);
      for (const r of data.revenue || []) rows.push([r.label, r.amount]);
      rows.push([]);
      rows.push(['Expense', 'Amount']);
      for (const r of data.expenses || []) rows.push([r.label, r.amount]);
      if (data.totals) {
        rows.push([]);
        rows.push(['Net', data.totals.net]);
      }
    } else if (reportKey === 'bs') {
      rows.push(['Assets', 'Amount']);
      for (const r of data.assets || []) rows.push([r.label, r.amount]);
      rows.push([]);
      rows.push(['Liabilities', 'Amount']);
      for (const r of data.liabilities || []) rows.push([r.label, r.amount]);
      rows.push([]);
      rows.push(['Equity', 'Amount']);
      for (const r of data.equity || []) rows.push([r.label, r.amount]);
    } else if (reportKey === 'gst') {
      rows.push(['Month', 'Taxable', 'Tax']);
      for (const r of data.rows || []) rows.push([r.month, r.taxable, r.tax]);
    } else if (reportKey === 'client') {
      rows.push(['Client', 'Invoiced', 'Paid', 'Outstanding']);
      for (const r of data.rows || []) rows.push([r.client, r.invoiced, r.paid, r.outstanding]);
    } else if (reportKey === 'expense') {
      rows.push(['Category', 'Amount']);
      for (const r of data.rows || []) rows.push([r.label, r.amount]);
    }

    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell ?? '').replace(/\"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportKey}-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const content = useMemo(() => {
    if (!data) return null;

    if (reportKey === 'trial') {
      const rows = Array.isArray(data.rows) ? data.rows : [];
      const totalDr = rows.reduce((s, r) => s + Number(r.debit || 0), 0);
      const totalCr = rows.reduce((s, r) => s + Number(r.credit || 0), 0);
      return (
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Debit (₹)</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold text-indigo-900 uppercase tracking-widest">Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.account} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-gray-700">{r.account}</td>
                  <td className="px-5 py-4 text-right font-black text-indigo-600">{r.debit > 0 ? `₹${Number(r.debit).toLocaleString()}` : '—'}</td>
                  <td className="px-5 py-4 text-right font-black text-indigo-900">{r.credit > 0 ? `₹${Number(r.credit).toLocaleString()}` : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50/50">
              <tr>
                <td className="px-5 py-4 font-black text-gray-500 text-xs uppercase tracking-widest">Totals</td>
                <td className="px-5 py-4 text-right font-black text-indigo-600 text-lg">₹{totalDr.toLocaleString()}</td>
                <td className="px-5 py-4 text-right font-black text-indigo-900 text-lg">₹{totalCr.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (reportKey === 'pl') {
      const revenue = Array.isArray(data.revenue) ? data.revenue : [];
      const expenses = Array.isArray(data.expenses) ? data.expenses : [];
      const totals = data.totals || {
        revenue: revenue.reduce((s, r) => s + Number(r.amount || 0), 0),
        expenses: expenses.reduce((s, r) => s + Number(r.amount || 0), 0),
        net: 0
      };
      totals.net = totals.revenue - totals.expenses;

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Revenue</p>
              </div>
              <div className="divide-y divide-gray-100">
                {revenue.map((r) => (
                  <div key={r.label} className="px-5 py-4 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-700">{r.label}</p>
                    <p className="text-sm font-black text-emerald-600">₹{Number(r.amount || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Expenses</p>
              </div>
              <div className="divide-y divide-gray-100">
                {expenses.map((r) => (
                  <div key={r.label} className="px-5 py-4 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-700">{r.label}</p>
                    <p className="text-sm font-black text-rose-600">₹{Number(r.amount || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 border ${totals.net >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Net</p>
                <p className={`text-2xl font-black ${totals.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {totals.net >= 0 ? 'Profit' : 'Loss'}
                </p>
              </div>
              <p className={`text-4xl font-black ${totals.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ₹{Math.abs(Number(totals.net || 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (reportKey === 'bs') {
      const assets = Array.isArray(data.assets) ? data.assets : [];
      const liabilities = Array.isArray(data.liabilities) ? data.liabilities : [];
      const equity = Array.isArray(data.equity) ? data.equity : [];
      const group = (title, rows, color) => (
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{title}</p>
          </div>
          <div className="divide-y divide-gray-100">
            {rows.map((r) => (
              <div key={r.label} className="px-5 py-4 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700">{r.label}</p>
                <p className={`text-sm font-black ${color}`}>₹{Number(r.amount || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      );

      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {group('Assets', assets, 'text-blue-600')}
          {group('Liabilities', liabilities, 'text-rose-600')}
          {group('Equity', equity, 'text-purple-600')}
        </div>
      );
    }

    if (reportKey === 'gst') {
      const rows = Array.isArray(data.rows) ? data.rows : [];
      const totalTaxable = rows.reduce((s, r) => s + Number(r.taxable || 0), 0);
      const totalTax = rows.reduce((s, r) => s + Number(r.tax || 0), 0);
      return (
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Month</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Taxable (₹)</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold text-amber-600 uppercase tracking-widest">Tax (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.month} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-gray-700">{r.month}</td>
                  <td className="px-5 py-4 text-right font-black text-gray-700">₹{Number(r.taxable || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 text-right font-black text-amber-700">₹{Number(r.tax || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50/50">
              <tr>
                <td className="px-5 py-4 font-black text-gray-500 text-xs uppercase tracking-widest">Totals</td>
                <td className="px-5 py-4 text-right font-black text-gray-700 text-lg">₹{totalTaxable.toLocaleString()}</td>
                <td className="px-5 py-4 text-right font-black text-amber-700 text-lg">₹{totalTax.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    const rows = Array.isArray(data.rows) ? data.rows : [];
    if (reportKey === 'client') {
      return (
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Client</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Invoiced (₹)</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Paid (₹)</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold text-rose-600 uppercase tracking-widest">Outstanding (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.client} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-gray-700">{r.client}</td>
                  <td className="px-5 py-4 text-right font-black text-gray-700">₹{Number(r.invoiced || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 text-right font-black text-emerald-700">₹{Number(r.paid || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 text-right font-black text-rose-700">₹{Number(r.outstanding || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (reportKey === 'expense') {
      const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
      return (
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="bg-gray-50 border-y border-gray-100">
              <tr>
                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-5 py-3.5 text-right text-[10px] font-bold text-rose-600 uppercase tracking-widest">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.label} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-bold text-gray-700">{r.label}</td>
                  <td className="px-5 py-4 text-right font-black text-rose-700">₹{Number(r.amount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-gray-200 bg-gray-50/50">
              <tr>
                <td className="px-5 py-4 font-black text-gray-500 text-xs uppercase tracking-widest">Total</td>
                <td className="px-5 py-4 text-right font-black text-rose-700 text-lg">₹{total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-sm font-bold text-gray-500">
        No renderer for this report.
      </div>
    );
  }, [data, reportKey]);

  if (data === null && !error) return <RestaurantLoader />;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 pt-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all active:scale-90 bg-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{meta.label}</h1>
            <p className="text-sm font-semibold text-gray-400">{meta.desc}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm">
            <Calendar size={18} className="text-indigo-400" />
            <div className="flex items-center gap-2">
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="focus:outline-none text-gray-700 bg-transparent text-xs font-bold" />
              <span className="text-gray-300 font-bold px-1">TO</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="focus:outline-none text-gray-700 bg-transparent text-xs font-bold" />
            </div>
          </div>
          <button
            onClick={fetchReport}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all active:scale-95"
          >
            Apply
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 whitespace-nowrap"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-sm font-bold text-rose-700">{error}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">{content}</div>
      )}
    </div>
  );
}

