"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const Empty = ({ text = 'No data' }) => (
  <div className="h-full w-full flex items-center justify-center text-sm font-semibold text-gray-400">
    {text}
  </div>
);

const ChartCard = ({ title, children, id, height = 300, hasData }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const DETAIL_LINKS = {
    profitability: '/services/projects',
    revenue: '/services/clients',
    expenses: '/services/expenses',
    utilization: '/services/assets',
    allocation: '/services/employees',
    aging: '/services/billing',
  };

  const targetHref = DETAIL_LINKS[id] || `/services/reports/${id}`;

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 flex flex-col h-full hover:shadow-xl hover:border-indigo-100 transition-all group">
      <h3 className="text-gray-900 font-bold mb-8 flex items-center justify-between text-lg uppercase tracking-tight">
        {title}
        {id && (
          <Link
            href={targetHref}
            className="text-[10px] text-indigo-500 font-black uppercase tracking-widest hover:text-indigo-700 hover:scale-110 transition-all"
          >
            Details
          </Link>
        )}
      </h3>
      <div className="relative" style={{ width: '100%', height }}>
        {mounted ? (
          <ResponsiveContainer>
            {hasData ? children : <Empty />}
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-2xl animate-pulse">
            <p className="text-gray-300 text-xs font-bold uppercase tracking-widest">Loading Analytics...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AnalyticCharts({ data }) {
  const charts = data || {};

  const projectProfitability = Array.isArray(charts.projectProfitability) ? charts.projectProfitability : [];
  const clientRevenue = Array.isArray(charts.clientRevenue) ? charts.clientRevenue : [];
  const expenseTrends = Array.isArray(charts.expenseTrends) ? charts.expenseTrends : [];
  const assetUtilization = Array.isArray(charts.assetUtilization) ? charts.assetUtilization : [];
  const employeeAllocation = Array.isArray(charts.employeeAllocation) ? charts.employeeAllocation : [];
  const outstandingInvoices = Array.isArray(charts.outstandingInvoices) ? charts.outstandingInvoices : [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <ChartCard title="Project Profitability" id="profitability" hasData={projectProfitability.length > 0}>
        <BarChart data={projectProfitability} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 'bold', dy: 10 }} 
            interval={0}
            angle={-45}
            textAnchor="end"
            height={100}
            tickFormatter={(v) => v.length > 15 ? `${v.substring(0, 12)}...` : v}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `₹${Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'k' : v}`} />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} 
            formatter={(val) => [money(val), '']}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 'bold' }} />
          <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
          <Bar dataKey="cost" name="Cost" fill="#fecaca" radius={[6, 6, 0, 0]} barSize={24} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Revenue by Client" id="revenue" hasData={clientRevenue.length > 0}>
        <PieChart>
          <Pie 
            data={clientRevenue} 
            cx="50%" 
            cy="50%" 
            innerRadius={65} 
            outerRadius={95} 
            paddingAngle={5} 
            dataKey="value"
            stroke="none"
          >
            {clientRevenue.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} 
            formatter={(val) => [money(val), 'Revenue']} 
          />
          <Legend 
            verticalAlign="bottom" 
            align="center" 
            iconType="circle" 
            wrapperStyle={{ paddingTop: '30px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} 
          />
        </PieChart>
      </ChartCard>

      <ChartCard title="Expense Category Trends" id="expenses" hasData={expenseTrends.length > 0}>
        <AreaChart data={expenseTrends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPayroll" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `₹${Number(v || 0) / 1000}k`} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(val) => money(val)} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }} />
          <Area type="monotone" dataKey="payroll" name="Payroll" stroke="#4f46e5" fillOpacity={1} fill="url(#colorPayroll)" strokeWidth={3} />
          <Area type="monotone" dataKey="operations" name="Operations" stroke="#10b981" fill="transparent" strokeWidth={2} />
          <Area type="monotone" dataKey="marketing" name="Marketing" stroke="#f59e0b" fill="transparent" strokeWidth={2} />
        </AreaChart>
      </ChartCard>

      <ChartCard title="Asset Utilization" id="utilization" hasData={assetUtilization.length > 0}>
        <BarChart data={assetUtilization} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }} />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }} 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} 
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '15px', fontSize: '11px', fontWeight: 'bold' }} />
          <Bar dataKey="inUse" name="In Use" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={16} />
          <Bar dataKey="total" name="Total" fill="#f1f5f9" radius={[0, 6, 6, 0]} barSize={16} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Employee Allocation" id="allocation" hasData={employeeAllocation.length > 0}>
        <PieChart>
          <Pie 
            data={employeeAllocation} 
            cx="50%" 
            cy="50%" 
            innerRadius={65}
            outerRadius={100} 
            paddingAngle={5}
            dataKey="value"
          >
            {employeeAllocation.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
            formatter={(val) => [`${val} Assigned`, 'Count']}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center" 
            iconType="circle" 
            wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }} 
          />
        </PieChart>
      </ChartCard>

      <ChartCard title="Invoice Aging" id="aging" hasData={outstandingInvoices.length > 0}>
        <BarChart data={outstandingInvoices} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={(v) => `₹${Number(v || 0) / 1000}k`} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(val) => money(val)} />
          <Bar dataKey="amount" name="Pending Amount" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}

