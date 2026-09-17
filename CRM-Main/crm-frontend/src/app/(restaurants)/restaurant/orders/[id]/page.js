"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaArrowLeft, FaPrint } from "react-icons/fa";
import RestaurantLoader from "@/components/RestaurantLoader";
import { getApiBase } from "@/utils/apiBase";

const API_BASE = getApiBase();

function formatMoney(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const routeParams = useParams();
  const orderId = routeParams?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("authToken") || localStorage.getItem("token");

        const tryGetById = async () => {
          const res = await fetch(`${API_BASE}/api/restaurant/orders/${orderId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return null;
          const data = await res.json().catch(() => ({}));
          return data.order || data;
        };

        const tryFindInList = async () => {
          const res = await fetch(`${API_BASE}/api/restaurant/orders`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return null;
          const data = await res.json().catch(() => ({}));
          const list = data.orders || [];
          return list.find((o) => String(o.id) === String(orderId)) || null;
        };

        const byId = await tryGetById();
        const found = byId || (await tryFindInList());
        if (!found) throw new Error("Order not found");

        setOrder(found);
      } catch (err) {
        console.error(err);
        setError(err?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) load();
  }, [orderId]);

  const tableLabel = useMemo(() => {
    if (!order) return "";
    return order.table_number || order.platform || "Online";
  }, [order]);

  const customerName = useMemo(() => {
    return order?.customer_name ? String(order.customer_name).trim() : "";
  }, [order?.customer_name]);

  const customerPhone = useMemo(() => {
    return order?.customer_phone ? String(order.customer_phone).trim() : "";
  }, [order?.customer_phone]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RestaurantLoader variant="container" message="Loading order..." />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 max-w-3xl mx-auto text-center text-red-600">{error}</div>;
  }

  if (!order) return null;

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            <FaArrowLeft size={12} />
            Back
          </button>

          <button
            onClick={() =>
              router.push(
                `/restaurant/orders/receipt?token=${encodeURIComponent(
                  order.order_token || ""
                )}&table=${encodeURIComponent(tableLabel)}&total=${encodeURIComponent(
                  order.total_amount || 0
                )}${order.customer_name ? `&customer=${encodeURIComponent(order.customer_name)}` : ""}${order.customer_phone ? `&phone=${encodeURIComponent(order.customer_phone)}` : ""
                }`
              )
            }
            className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            title="Print bill"
          >
            <FaPrint size={12} />
            Print
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Order: {order.order_token || order.id}
              </h1>
              <p className="text-sm text-gray-600">
                {tableLabel} •{" "}
                {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
              </p>
              {order.taken_by_name ? (
                <p className="text-sm text-gray-600">
                  Taken By: <span className="font-semibold text-gray-900">{order.taken_by_name}</span>
                </p>
              ) : null}
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold bg-gray-50 border-gray-200 text-gray-800 capitalize">
              {order.status || "unknown"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-semibold">Items</p>
              <p className="text-lg font-bold text-gray-900">
                {order.items_count || order.items?.length || 0}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-semibold">Total</p>
              <p className="text-lg font-bold text-gray-900">₹{formatMoney(order.total_amount)}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-semibold">Payment</p>
              <div className="flex flex-col">
                {order.payment_method || order.payment_mode ? (
                  <>
                    <p className="text-lg font-bold text-gray-900 leading-tight">
                      {order.payment_method || order.payment_mode}
                    </p>
                    {order.payment_status && (
                      <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${order.payment_status.toLowerCase() === 'paid' ? 'text-green-600' : 'text-red-500'
                        }`}>
                        {order.payment_status}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-bold text-amber-600 uppercase tracking-tight py-1">
                    Unbilled
                  </p>
                )}
              </div>
            </div>
          </div>

          {(customerName || customerPhone) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-semibold">Customer</p>
                <p className="text-sm font-bold text-gray-900">{customerName || "-"}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-semibold">Mobile</p>
                <p className="text-sm font-bold text-gray-900">{customerPhone || "-"}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-base font-bold text-gray-900">Order Items</h2>
          </div>

          {!order.items || order.items.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No items found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name || "Item"}</p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity || 0} • Price: ₹{formatMoney(item.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{formatMoney((item.quantity || 0) * (item.price || 0))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
