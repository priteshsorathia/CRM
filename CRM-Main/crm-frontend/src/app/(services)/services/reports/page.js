"use client";
import React, { useEffect, useMemo, useState } from 'react';
import FilterBar from './FilterBar';
import AnalyticCharts from './AnalyticCharts';
import RestaurantLoader from '@/components/RestaurantLoader';
import { TrendingUp, Users, Briefcase, IndianRupee, AlertCircle } from 'lucide-react';
import { getApiBase } from '@/utils/apiBase';

const QuickStat = ({ label, value, trend, icon: Icon, color }) => (
  <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-3">
    <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 border border-current border-opacity-10 shrink-0`}>
      <Icon size={18} className={color.replace('bg-', 'text-')} />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex justify-between items-start w-full">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5 truncate">{label}</p>
      </div>
      <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
    </div>
  </div>
);

const todayYmd = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const startOfMonthYmd = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
};

export default function ReportsPage() {
  const [filters, setFilters] = useState({ from: startOfMonthYmd(), to: todayYmd(), projectId: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async (next = filters) => {
    if (next.from && next.to && new Date(next.from) > new Date(next.to)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const qs = new URLSearchParams();
      if (next.from) qs.set('from', next.from);
      if (next.to) qs.set('to', next.to);
      if (next.projectId) qs.set('projectId', next.projectId);

      const res = await fetch(`${getApiBase()}/api/services/reports/dashboard?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json().catch(() => ({}));
      setData(json?.success ? json : { success: false, charts: {}, quickStats: {}, filters: { projects: [] } });
    } catch (e) {
      console.error('Reports fetch failed:', e);
      setData({ success: false, charts: {}, quickStats: {}, filters: { projects: [] } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.projectId]);

  const projects = data?.filters?.projects || [];
  const stats = data?.quickStats || {};

  const quick = useMemo(() => {
    const npm = Number(stats.netProfitMargin || 0);
    const bu = Number(stats.billableUtilization || 0);
    const pv = Number(stats.projectVelocity || 0);
    const cf = Number(stats.dailyCashFlow || 0);
    return [
      { label: 'Net Profit Margin', value: `${npm.toFixed(1)}%`, icon: TrendingUp, color: 'bg-indigo-600' },
      { label: 'Billable Utilization', value: `${bu.toFixed(0)}%`, icon: Users, color: 'bg-green-600' },
      { label: 'Project Velocity', value: `${pv.toFixed(0)}`, icon: Briefcase, color: 'bg-blue-600' },
      { label: 'Daily Cash Flow', value: `₹${cf.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-amber-600' },
    ];
  }, [stats]);

  const exportCsv = async () => {
    if (filters.from && filters.to && new Date(filters.from) > new Date(filters.to)) {
      alert('Cannot export: "From" date cannot be later than "To" date');
      return;
    }

    // Check if there's actually data to export
    const c = data?.charts || {};
    const hasAnyData = (
      (c.projectProfitability?.length > 0) || 
      (c.clientRevenue?.length > 0) || 
      (c.expenseTrends?.length > 0) || 
      (c.assetUtilization?.length > 0) || 
      (c.employeeAllocation?.length > 0) || 
      (c.outstandingInvoices?.length > 0)
    );

    if (!hasAnyData) {
      alert('No data found for the selected filters. Export cancelled.');
      return;
    }

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const qs = new URLSearchParams();
      if (filters.from) qs.set('from', filters.from);
      if (filters.to) qs.set('to', filters.to);
      if (filters.projectId) qs.set('projectId', filters.projectId);

      const res = await fetch(`${getApiBase()}/api/services/reports/export?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      const text = await res.text();
      const blob = new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'services_report.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed');
    }
  };

  if (loading && !data) return <RestaurantLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Executive Reports & Analytics</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        {quick.map((q) => (
          <QuickStat key={q.label} {...q} />
        ))}
      </div>

      <FilterBar
        value={filters}
        projects={projects}
        onChange={(v) => setFilters(v)}
        onExport={() => exportCsv()}
        onReset={() => setFilters({ from: startOfMonthYmd(), to: todayYmd(), projectId: '' })}
        disabled={!data?.success || !(
          (data.charts?.projectProfitability?.length > 0) || 
          (data.charts?.clientRevenue?.length > 0) || 
          (data.charts?.expenseTrends?.length > 0) || 
          (data.charts?.assetUtilization?.length > 0) || 
          (data.charts?.employeeAllocation?.length > 0) || 
          (data.charts?.outstandingInvoices?.length > 0)
        )}
      />

      {filters.from && filters.to && new Date(filters.from) > new Date(filters.to) && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2 duration-300 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-sm font-bold">Invalid Date Range</p>
            <p className="text-[11px] opacity-80 font-medium">Select a valid date range. To date must be greater than or equal to From date.</p>
          </div>
        </div>
      )}

      {loading ? (
        <RestaurantLoader />
      ) : (
        <AnalyticCharts data={data?.charts} />
      )}

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-center text-center">
        <p className="text-xs text-indigo-600 font-medium italic">
          * Data is aggregated from invoices, expenses, projects, employees and timesheets. Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

