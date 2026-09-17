"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import ExpenseOverview from './ExpenseOverview';
import ExpenseTable from './ExpenseTable';
import RestaurantLoader from '@/components/RestaurantLoader';
import { getApiBase } from '@/utils/apiBase';
import { useRole } from '@/app/(services)/context/RoleContext';

const toCode = (id) => `EXP-${String(id).padStart(4, '0')}`;

const mapExpense = (e) => ({
  dbId: e.id,
  code: toCode(e.id),
  title: e.title || '',
  employee: e.user?.name || e.user?.username || '—',
  project: e.serviceProject?.name || '',
  projectId: e.serviceProjectId || null,
  category: e.category || '',
  amount: Number(e.amount || 0),
  date: e.expenseDate ? new Date(e.expenseDate).toISOString().slice(0, 10) : '',
  receipt: Boolean(e.receiptUrl),
  status: e.status || 'Pending',
  approvalStep: Number.isFinite(Number(e.approvalStep)) ? Number(e.approvalStep) : 1,
  rejectionReason: e.rejectionReason || null
});

export default function ExpensesPage() {
  const { can } = useRole();
  const router = useRouter();
  const [expenses, setExpenses] = useState(null);
  const [filters, setFilters] = useState({ category: 'All', from: '', to: '', status: 'All' });

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const res = await fetch(`${getApiBase()}/api/services/expenses?limit=-1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        const mapped = Array.isArray(data.data) ? data.data.map(mapExpense) : [];
        mapped.sort((a, b) => Number(b.dbId || 0) - Number(a.dbId || 0));
        setExpenses(mapped);
      }
      else setExpenses([]);
    } catch (e) {
      console.error('Error fetching expenses:', e);
      setExpenses([]);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const setStatus = async (dbId, action, body) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const res = await fetch(`${getApiBase()}/api/services/expenses/${dbId}/${action}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json().catch(() => ({}));
      if (!data.success) throw new Error(data.message || 'Failed');
      await fetchExpenses();
    } catch (e) {
      console.error('Status update failed:', e);
      alert(e.message || 'Failed to update status');
    }
  };

  const handleApprove = (dbId) => setStatus(dbId, 'approve');
  const handleReject = (dbId) => {
    const reason = prompt('Reject reason (optional):') || '';
    return setStatus(dbId, 'reject', reason ? { rejectionReason: reason } : undefined);
  };
  const handleReimburse = (dbId) => setStatus(dbId, 'reimburse');

  const handleDelete = async (dbId) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const res = await fetch(`${getApiBase()}/api/services/expenses/${dbId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) await fetchExpenses();
      else alert(data.message || 'Error deleting expense');
    } catch (e) {
      console.error('Delete expense failed:', e);
      alert('Failed to connect to server');
    }
  };

  if (!expenses) return <RestaurantLoader />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xl shadow-indigo-100/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group">
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-gray-900 leading-none tracking-tight">Expense Management</h1>
          <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">
            Submit, track, and manage financial claims
          </p>
        </div>
        
        {can('EXPENSES', 'CREATE') && (
            <button
            onClick={() => router.push('/services/expenses/new')}
            className="relative z-10 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 transition-all active:scale-95 whitespace-nowrap uppercase tracking-widest"
            >
            <Plus size={20} strokeWidth={2.5} /> Submit Expense
            </button>
        )}
        
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-50/50 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-100/50 transition-all duration-700" />
      </div>

      {/* Content */}
      <div className="space-y-6">
        <ExpenseOverview 
            expenses={expenses} 
            currentFilter={filters.status || 'All'} 
            onFilterChange={(s) => setFilters({ ...filters, status: s })} 
        />
        <ExpenseTable
          expenses={expenses}
          filters={filters}
          onFiltersChange={setFilters}
          onApprove={handleApprove}
          onReject={handleReject}
          onReimburse={handleReimburse}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
