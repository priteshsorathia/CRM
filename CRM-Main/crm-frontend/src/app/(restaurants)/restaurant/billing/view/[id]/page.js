"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RestaurantLoader from "@/components/RestaurantLoader";
import { Printer, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { getApiBase } from "@/utils/apiBase";
import AccessDenied from "@/components/AccessDenied";
import ConfirmationDialog from "@/components/ConfirmationDialog";

const API_BASE = getApiBase();

const getDisplayTable = (tableNum, orderToken) => {
  const clean = String(tableNum || "").trim();
  if (!clean || clean === "-" || clean === "—") {
    if (orderToken && (orderToken.includes("Take away") || orderToken.includes("Takeaway"))) {
      return "Take away";
    }
    return "";
  }
  return clean;
};

function formatMoney(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function toTitleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function BillingInvoiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
      const u = rawUser ? JSON.parse(rawUser) : null;
      const role = String(u?.role || u?.user_role || u?.user?.role || "").trim().toLowerCase();

      const isOwner =
        role === "admin" ||
        role === "administrator" ||
        role === "owner" ||
        role === "shop_owner" ||
        role === "restaurant_owner" ||
        role.endsWith("_owner") ||
        role === "manager" ||
        role === "restaurant_manager";

      setHasAccess(isOwner);
      setAccessChecked(true);
    } catch {
      setHasAccess(false);
      setAccessChecked(true);
    }
  }, []);

  useEffect(() => {
    if (!accessChecked || !hasAccess) return;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const token =
          localStorage.getItem("authToken") || localStorage.getItem("token");

        const res = await fetch(`${API_BASE}/api/restaurant/invoices/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Bill not found");
        }

        const data = await res.json().catch(() => ({}));
        setInvoice(data.invoice || data);
      } catch (err) {
        console.error(err);
        setError(err?.message || "Failed to load bill");
      } finally {
        setLoading(false);
      }
    };

    if (id && accessChecked && hasAccess) load();
  }, [id, accessChecked, hasAccess]);

  const status = useMemo(
    () => invoice?.payment_status || "Unpaid",
    [invoice?.payment_status]
  );

  const updatePaymentStatus = async (payment_status) => {
    if (!invoice?.id) return;
    const prevStatus = invoice.payment_status;
    try {
      setUpdatingStatus(true);
      setInvoice((curr) => (curr ? { ...curr, payment_status } : curr));

      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/restaurant/invoices/${invoice.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payment_status }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update payment status");
      }

      const data = await res.json().catch(() => ({}));
      setInvoice((curr) => data.invoice || curr);
      toast.success("Payment status updated");
    } catch (err) {
      console.error(err);
      setInvoice((curr) => (curr ? { ...curr, payment_status: prevStatus } : curr));
      toast.error(err?.message || "Failed to update payment status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    setIsConfirmOpen(false);
    if (!invoice?.id) return;

    try {
      setDeleting(true);
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/restaurant/invoices/${invoice.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete bill");
      }

      toast.error("Bill deleted", {
        style: {
          background: "#fef2f2",
          border: "1px solid #fca5a5",
          color: "#dc2626",
        },
      });
      router.push("/restaurant/billing");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Failed to delete bill");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RestaurantLoader variant="container" message="Loading bill..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center text-red-600">
        {error}
      </div>
    );
  }

  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RestaurantLoader variant="container" message="Verifying access..." />
      </div>
    );
  }

  if (!hasAccess) {
    return <AccessDenied homeHref="/restaurant/tables" homeLabel="Go to Tables" />;
  }

  if (!invoice) return null;

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Back
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/restaurant/billing/${invoice.id}`)}
              disabled={deleting || updatingStatus}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${deleting || updatingStatus
                ? "bg-indigo-300 text-white cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              title="Print"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={() => setIsConfirmOpen(true)}
              disabled={deleting || updatingStatus}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium border ${deleting || updatingStatus
                ? "bg-white text-red-300 border-red-100 cursor-not-allowed"
                : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                }`}
              title="Delete bill"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">
                Bill #{invoice.invoice_number || invoice.id}
              </h1>
              <p className="text-sm text-gray-600">
                {new Date(invoice.created_at).toLocaleString()}
              </p>
            </div>
            <div className="relative inline-block">
              <select
                value={status}
                onFocus={() => setIsSelectOpen(true)}
                onBlur={() => setIsSelectOpen(false)}
                onChange={(e) => {
                  updatePaymentStatus(e.target.value);
                  setIsSelectOpen(false);
                }}
                disabled={deleting || updatingStatus}
                className={`appearance-none bg-none bg-no-repeat pr-9 pl-3 py-1.5 rounded-full border text-sm font-bold transition-colors ${status === "Paid"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : status === "Partial"
                    ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                    : "bg-red-50 text-red-700 border-red-200"
                  } ${deleting || updatingStatus
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-white"
                  }`}
                title="Change payment status"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
              </select>
              <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-current opacity-70 h-4 w-4 transition-transform duration-200 ${isSelectOpen ? "rotate-180" : ""}`} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <InfoCard
              label="Customer/Table"
              value={`${invoice.customer_name || "N/A"}${
                getDisplayTable(invoice.table_number, invoice.order_token)
                  ? ` (${getDisplayTable(invoice.table_number, invoice.order_token)})`
                  : ""
              }`}
            />
            <InfoCard label="Payment Method" value={invoice.payment_method || "—"} />
            <InfoCard label="Order Token" value={invoice.order_token || "—"} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
            <InfoCard label="Subtotal" value={`₹${formatMoney(invoice.subtotal)}`} />
            <InfoCard label="Tax" value={`₹${formatMoney(invoice.tax_amount)} (${formatMoney(invoice.tax_percentage)}%)`} />
            <InfoCard label="Discount" value={`₹${formatMoney(invoice.discount)}`} />
            <InfoCard label="Total" value={`₹${formatMoney(invoice.rounded_total ?? invoice.total)}`} />
          </div>

          {(invoice.customer_phone || invoice.customer_address || invoice.customer_gst || invoice.notes) && (
            <div className="mt-4 border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoRow label="Phone" value={invoice.customer_phone} />
              <InfoRow label="GST" value={invoice.customer_gst} />
              <InfoRow label="Address" value={invoice.customer_address} />
              <InfoRow label="Notes" value={invoice.notes} />
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-gray-900">
              Items ({invoice.items?.length || 0})
            </h2>
          </div>

          {!invoice.items || invoice.items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No items found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">
                          {item.item_name || "Item"}
                        </div>
                        {item.item_code && (
                          <div className="text-xs text-gray-500">
                            Code: {item.item_code}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Unit: {item.unit_symbol || item.unit_name || "pcs"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        ₹{formatMoney(item.price_per_unit)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                        ₹{formatMoney(item.item_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <ConfirmationDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Bill"
          description="Are you sure you want to delete this bill? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <p className="text-xs text-gray-600 font-semibold">{label}</p>
      <p className="text-sm font-bold text-gray-900 truncate">{value || "—"}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <p className="text-xs text-gray-600 font-semibold">{toTitleCase(label)}</p>
      <p className="text-sm font-semibold text-gray-900 break-words">
        {String(value)}
      </p>
    </div>
  );
}
