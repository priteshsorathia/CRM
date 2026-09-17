"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ShieldAlert, Trash2, AlertCircle } from "lucide-react";
import RestaurantLoader from "@/components/RestaurantLoader";
import { getApiBase } from "@/utils/apiBase";

export default function DeleteInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const API_BASE = useMemo(() => getApiBase(), []);
  const [invoice, setInvoice] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleDelete = async () => {
    if (!invoice || String(confirmText).trim() !== String(invoice.invoiceId || invoice.id)) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/services/invoices/${invoice.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        router.push("/services/billing");
      } else {
        alert(data.message || "Failed to delete invoice");
      }
    } catch (e) {
      console.error("Failed to delete invoice", e);
      alert("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (invoice === null) return <RestaurantLoader />;
  if (invoice === false) return <div className="p-6 text-gray-500">Invoice not found.</div>;

  const label = invoice.invoiceId || String(invoice.id);
  const isConfirmed = String(confirmText).trim() === label;

  return (
    <div className="max-w-xl mx-auto py-20 px-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors mb-8 group"
      >
        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back</span>
      </button>

      <div className="bg-white rounded-[32px] border border-rose-100 shadow-xl shadow-rose-100/20 overflow-hidden text-center p-10 relative">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-sm border border-rose-100/50">
          <ShieldAlert size={34} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">Delete invoice?</h1>
        <p className="text-gray-500 font-medium mb-8 text-sm leading-relaxed">
          Deleting <span className="text-rose-600 font-bold">{label}</span> will permanently remove it.
        </p>

        <div className="space-y-2 text-left">
          <label className="text-xs font-semibold text-gray-600">
            Type <span className="font-bold text-gray-900">{label}</span> to confirm
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/20 text-center text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-rose-50 focus:border-rose-300"
            placeholder={label}
          />
        </div>

        <div className="flex flex-col gap-3 pt-6">
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || loading}
            className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${
              isConfirmed && !loading
                ? "bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98]"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            {loading ? "Deleting..." : (
              <>
                <Trash2 size={18} /> Delete Invoice
              </>
            )}
          </button>
          <button
            onClick={() => router.back()}
            className="w-full py-3 bg-white text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all border border-gray-200 active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-center gap-2 text-xs font-medium text-rose-500">
          <AlertCircle size={14} /> This action cannot be undone.
        </div>
      </div>
    </div>
  );
}

