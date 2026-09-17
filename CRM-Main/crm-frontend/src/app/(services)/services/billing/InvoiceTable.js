"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { useRole } from "@/app/(services)/context/RoleContext";

const PAGE_SIZE = 6;

const statusStyle = {
  Draft: "bg-gray-100 text-gray-600 border border-gray-200",
  Sent: "bg-blue-50 text-blue-700 border border-blue-200",
  Paid: "bg-green-50 text-green-700 border border-green-200",
  "Partially Paid": "bg-amber-50 text-amber-700 border border-amber-200",
  Overdue: "bg-red-50 text-red-700 border border-red-200",
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

const formatINR = (value) => {
  const n = Number(value || 0) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
};

export default function InvoiceTable({ invoices = [], allInvoices = [], filters, onFiltersChange, onDelete } = {}) {
  const { can } = useRole();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  const handleReset = () => {
    setSearch('');
    onFiltersChange({ client: 'All', from: '', to: '', status: 'totalInvoiced' });
    setPage(0);
  };

  // Extract unique clients
  const clients = ['All', ...new Set((allInvoices || []).map(inv => inv.client?.company || inv.clientName).filter(Boolean))].sort();

  const filtered = safeInvoices.filter((inv) => {
    const q = search.toLowerCase();
    const invoiceId = String(inv.invoiceId || inv.id || "").toLowerCase();
    const clientName = String(inv.client?.company || inv.clientName || "").toLowerCase();
    const projectName = String(inv.project?.name || inv.projectName || "").toLowerCase();
    const matchesSearch = invoiceId.includes(q) || clientName.includes(q) || projectName.includes(q);
    return matchesSearch;
  });

  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const outstanding = (inv) =>
    (Number(inv.amount || 0) || 0) - (Number(inv.paid || 0) || 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Controls */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Invoice Register</h3>
          <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
            {filtered.length} of {allInvoices.length} invoices
          </p>
        </div>
        <div className="flex-1 flex flex-wrap items-center gap-2 justify-end w-full">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xl">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search invoices..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 text-sm font-medium text-gray-700 transition-all"
            />
          </div>

          {/* Client Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={filters.client}
              onChange={(e) => {
                onFiltersChange({ ...filters, client: e.target.value });
                setPage(0);
              }}
              className="appearance-none w-full pl-4 pr-10 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 focus:border-indigo-500 bg-white transition-all shadow-sm"
            >
              {clients.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Clients' : c}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={14}
            />
          </div>

          {/* Date Filters */}
          <div className="flex items-center gap-2 bg-gray-50/50 p-1 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 px-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">From</span>
              <input 
                type="date"
                value={filters.from}
                onChange={(e) => {
                    const newFrom = e.target.value;
                    let newTo = filters.to;
                    if (newTo && newFrom && new Date(newTo) < new Date(newFrom)) {
                        newTo = newFrom;
                    }
                    onFiltersChange({ ...filters, from: newFrom, to: newTo });
                    setPage(0);
                }}
                className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 p-1"
              />
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2 px-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To</span>
              <input 
                type="date"
                value={filters.to}
                min={filters.from}
                onChange={(e) => {
                    onFiltersChange({ ...filters, to: e.target.value });
                    setPage(0);
                }}
                className="bg-transparent border-none text-xs font-bold text-gray-700 focus:ring-0 p-1"
              />
            </div>
          </div>

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95"
            title="Reset Filters"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="bg-gray-50 border-y border-gray-100 sticky top-0 z-10">
            <tr>
              {["Invoice", "Client / Project", "Amount", "Outstanding", "Issued", "Due", "Status", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-sm text-gray-400 font-medium">
                  No invoices found
                </td>
              </tr>
            ) : (
              rows.map((inv) => {
                const bal = outstanding(inv);
                const invoiceLabel = inv.invoiceId || String(inv.id || "");
                const clientLabel = inv.client?.company || inv.clientName || "-";
                const projectLabel = inv.project?.name || inv.projectName || "-";
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-bold text-indigo-600">{invoiceLabel}</p>
                      <p className="text-xs text-gray-400 mt-0.5">#{inv.id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{clientLabel}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[320px]">
                        {projectLabel}
                      </p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap font-semibold text-gray-900">
                      {formatINR(inv.amount)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {bal > 0 ? (
                        <span className="font-semibold text-rose-600">
                          {formatINR(bal)}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600">Settled</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                      {formatDate(inv.issuedDate)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                          statusStyle[inv.status] || "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => router.push(`/services/billing/${inv.id}`)}
                          className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-bold"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {can('BILLING', 'UPDATE') && (
                          <button
                            onClick={() => router.push(`/services/billing/edit/${inv.id}`)}
                            className="p-2 rounded-xl text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-all font-bold"
                            title="Edit"
                          >
                            <Pencil size={18} />
                          </button>
                        )}
                        
                        {can('BILLING', 'DELETE') && (
                          <button
                            onClick={() => onDelete?.(inv.id)}
                            className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
        <p className="text-gray-500 font-medium font-bold">
          Page {page + 1} of {Math.max(1, pages)}
        </p>
        <div className="flex gap-1">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            disabled={page >= pages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
