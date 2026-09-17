"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RestaurantLoader from '@/components/RestaurantLoader';
import { getApiBase } from '@/utils/apiBase';
import AnalyticCharts from '../AnalyticCharts';

const titles = {
  profitability: 'Project Profitability',
  revenue: 'Revenue by Client',
  expenses: 'Expense Category Trends',
  utilization: 'Asset Utilization',
  allocation: 'Employee Allocation',
  aging: 'Invoice Aging',
};

export default function ReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        const res = await fetch(`${getApiBase()}/api/services/reports/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json().catch(() => ({}));
        setData(json?.success ? json : { success: false, charts: {} });
      } catch (e) {
        console.error('Report detail fetch failed:', e);
        setData({ success: false, charts: {} });
      }
    };
    fetchDashboard();
  }, []);

  const chartData = useMemo(() => {
    const c = data?.charts || {};
    const keep = {};
    if (id === 'profitability') keep.projectProfitability = c.projectProfitability;
    if (id === 'revenue') keep.clientRevenue = c.clientRevenue;
    if (id === 'expenses') keep.expenseTrends = c.expenseTrends;
    if (id === 'utilization') keep.assetUtilization = c.assetUtilization;
    if (id === 'allocation') keep.employeeAllocation = c.employeeAllocation;
    if (id === 'aging') keep.outstandingInvoices = c.outstandingInvoices;
    return keep;
  }, [data, id]);

  if (!data) return <RestaurantLoader />;

  return (
    <div className="space-y-6 pt-4 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-semibold">
          <ArrowLeft size={18} /> Back
        </button>
        <h1 className="text-lg font-extrabold text-gray-900">{titles[id] || 'Report'}</h1>
        <div />
      </div>

      <AnalyticCharts data={chartData} />
    </div>
  );
}

