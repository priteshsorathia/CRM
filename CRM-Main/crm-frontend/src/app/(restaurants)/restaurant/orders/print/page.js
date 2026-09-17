"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import RestaurantLoader from "@/components/RestaurantLoader";
import { getApiBase } from "@/utils/apiBase";

const INR = "₹";

function safeString(v) {
  return String(v == null ? "" : v).trim();
}

function formatDateTime(value) {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString([], { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatMoney(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export default function PrintSelectedOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokensParam = searchParams.get("tokens") || "";

  const tokens = useMemo(() => {
    return safeString(tokensParam)
      .split(",")
      .map((t) => safeString(t))
      .filter(Boolean);
  }, [tokensParam]);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setOrders([]);

        if (tokens.length === 0) {
          setError("No order tokens provided.");
          return;
        }

        const token = localStorage.getItem("authToken") || localStorage.getItem("token");
        const API_BASE = getApiBase();
        if (!API_BASE) {
          setError("API base URL is not configured.");
          return;
        }

        const results = await Promise.all(
          tokens.map(async (t) => {
            const res = await fetch(`${API_BASE}/api/restaurant/orders/token/${encodeURIComponent(t)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json?.order) {
              return { token: t, error: json?.error || "Order not found" };
            }
            return { token: t, order: json.order };
          })
        );

        const ok = results.filter((r) => r.order).map((r) => r.order);
        const errs = results.filter((r) => r.error);

        setOrders(ok);
        if (errs.length > 0 && ok.length === 0) {
          setError(errs.map((e) => `${e.token}: ${e.error}`).join("\n"));
        }
      } catch (e) {
        setError(e?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tokens]);

  if (loading) {
    return (
      <div className="p-4">
        <RestaurantLoader variant="container" message="Preparing print..." className="py-10" />
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="p-4 max-w-xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-red-600 font-semibold mb-2">Unable to print</p>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap">{error}</pre>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-md"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="no-print max-w-3xl mx-auto mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black"
        >
          Print
        </button>
      </div>

      <div className="print-root">
        {orders.map((order) => {
          const token = safeString(order?.order_token);
          const tableLabel = safeString(order?.table_number || order?.platform || "");
          const createdAt = formatDateTime(order?.created_at);
          const customer = safeString(order?.customer_name);
          const phone = safeString(order?.customer_phone);
          const items = Array.isArray(order?.items) ? order.items : [];

          return (
            <div key={token || order?.id} className="print-order">
              <div className="po-head">
                <div className="po-row po-strong">
                  <span>Order</span>
                  <span>{token}</span>
                </div>
                {tableLabel ? (
                  <div className="po-row">
                    <span>Table</span>
                    <span>{tableLabel}</span>
                  </div>
                ) : null}
                {createdAt ? (
                  <div className="po-row">
                    <span>Time</span>
                    <span>{createdAt}</span>
                  </div>
                ) : null}
                {customer ? (
                  <div className="po-row">
                    <span>Customer</span>
                    <span>{customer}</span>
                  </div>
                ) : null}
                {phone ? (
                  <div className="po-row">
                    <span>Mobile</span>
                    <span>{phone}</span>
                  </div>
                ) : null}
              </div>

              <div className="po-rule" aria-hidden="true" />

              <table className="po-items">
                <thead>
                  <tr>
                    <th style={{ width: "7mm" }}>#</th>
                    <th>Item</th>
                    <th style={{ width: "14mm" }}>Price</th>
                    <th style={{ width: "10mm" }}>Qty</th>
                    <th style={{ width: "16mm", textAlign: "right" }}>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const name = safeString(it?.name);
                    const price = Number(it?.price_per_unit ?? it?.price ?? 0);
                    const qty = Number(it?.quantity ?? 0);
                    const amt = (Number.isFinite(price) ? price : 0) * (Number.isFinite(qty) ? qty : 0);

                    return (
                      <tr key={`${token}_${idx}`}>
                        <td>{idx + 1}</td>
                        <td title={name}>{name}</td>
                        <td>
                          {INR}
                          {formatMoney(price)}
                        </td>
                        <td>{Number.isFinite(qty) ? qty : 0}</td>
                        <td style={{ textAlign: "right" }}>
                          {INR}
                          {formatMoney(amt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="po-totals">
                <div className="po-row po-strong">
                  <span>Total</span>
                  <span>
                    {INR}
                    {formatMoney(order?.total_amount)}
                  </span>
                </div>
              </div>

              <div className="po-cut" aria-hidden="true" />
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        .print-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .print-order {
          width: 80mm;
          max-width: 80mm;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px;
          font-family: monospace;
          font-size: 11px;
          line-height: 1.2;
        }
        .po-head {
          padding-bottom: 6px;
        }
        .po-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .po-row span:last-child {
          text-align: right;
          word-break: break-word;
        }
        .po-strong {
          font-weight: 800;
        }
        .po-rule,
        .po-cut {
          width: 100%;
          border-top: 1px dashed #000;
        }
        .po-rule {
          margin: 6px 0 8px;
        }
        .po-cut {
          margin-top: 10px;
        }
        .po-items {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .po-items th,
        .po-items td {
          padding: 6px 0;
          border-bottom: 1px dashed #ddd;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .po-items th {
          border-bottom: 1px solid #000;
          padding-bottom: 8px;
          font-weight: 800;
          text-align: left;
        }
        .po-items th:nth-child(2),
        .po-items td:nth-child(2) {
          white-space: normal;
          overflow: visible;
          text-overflow: clip;
          word-break: break-word;
        }
        .po-items tbody tr:last-child td {
          border-bottom: none;
        }
        .po-totals {
          margin-top: 8px;
        }

        @media print {
          @page {
            size: 80mm auto;
            margin: 2mm;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
          .print-order {
            border: none !important;
            border-radius: 0 !important;
            padding: 2mm !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          .print-root {
            gap: 0 !important;
          }
          .po-cut {
            margin-top: 6mm;
          }
        }
      `}</style>
    </div>
  );
}

