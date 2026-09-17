"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, FileText, Pencil } from "lucide-react";
import RestaurantLoader from "@/components/RestaurantLoader";
import { getApiBase } from "@/utils/apiBase";

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
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

const statusStyle = {
  Draft: "bg-gray-100 text-gray-600 border border-gray-200",
  Sent: "bg-blue-50 text-blue-700 border border-blue-200",
  Paid: "bg-green-50 text-green-700 border border-green-200",
  "Partially Paid": "bg-amber-50 text-amber-700 border border-amber-200",
  Overdue: "bg-red-50 text-red-700 border border-red-200",
};

export default function ServiceInvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const API_BASE = useMemo(() => getApiBase(), []);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem("authToken") || localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/services/invoices/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (data.success) setInvoice(data.invoice);
        else setInvoice(false);
      } catch (e) {
        console.error("Failed to load invoice", e);
        setInvoice(false);
      }
    };
    fetchInvoice();
  }, [API_BASE, id]);

  if (invoice === null) return <RestaurantLoader />;
  if (invoice === false) return <div className="p-6 text-gray-500">Invoice not found.</div>;

  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const clientLabel = invoice.client?.company || invoice.clientName || "-";
  const projectLabel = invoice.project?.name || invoice.projectName || "-";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors w-fit group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest text-[10px]">Back to Registry</span>
        </button>
        <button
          onClick={() => router.push(`/services/billing/edit/${invoice.id}`)}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-amber-600 shadow-lg shadow-amber-100 transition-all active:scale-95 whitespace-nowrap uppercase tracking-widest"
        >
          <Pencil size={14} /> Edit
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 relative z-10">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0 mt-1">
              <FileText size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight break-words">
                {invoice.invoiceId || `Invoice #${invoice.id}`}
              </h1>
              <p className="text-gray-500 font-bold mt-1 text-[10px] sm:text-xs uppercase tracking-widest break-words leading-relaxed">
                {clientLabel} <span className="text-gray-300 mx-1">/</span> {projectLabel}
              </p>
            </div>
          </div>
          
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-xl sm:rounded-none border border-gray-100 sm:border-0 shadow-sm sm:shadow-none">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest sm:mb-1.5">Registry Status</p>
            <span
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                statusStyle[invoice.status] || "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-500">Issued</p>
            <p className="font-semibold text-gray-900">{formatDate(invoice.issuedDate)}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-500">Due</p>
            <p className="font-semibold text-gray-900">{formatDate(invoice.dueDate)}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-500">Total</p>
            <p className="font-semibold text-gray-900">{formatINR(invoice.amount)}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-500">Paid</p>
            <p className="font-semibold text-gray-900">{formatINR(invoice.paid)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Line Items</h2>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} items</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Description", "Qty", "Rate", "Tax %", "Line Total"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 font-medium">
                    No line items
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => {
                  const qty = Number(it.qty || 0) || 0;
                  const rate = Number(it.rate || 0) || 0;
                  const tax = Number(it.tax || 0) || 0;
                  const line = qty * rate;
                  const gross = line + line * (tax / 100);
                  return (
                    <tr key={idx}>
                      <td className="px-5 py-4 font-semibold text-gray-900">{it.desc || "-"}</td>
                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">{qty}</td>
                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">{formatINR(rate)}</td>
                      <td className="px-5 py-4 text-gray-700 whitespace-nowrap">{tax}%</td>
                      <td className="px-5 py-4 text-gray-900 font-semibold whitespace-nowrap">{formatINR(gross)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
