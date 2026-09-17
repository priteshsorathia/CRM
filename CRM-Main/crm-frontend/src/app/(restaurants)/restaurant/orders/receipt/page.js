"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FaCheckCircle, FaTable } from "react-icons/fa";
import { getApiBase } from "@/utils/apiBase";

export default function ReceiptPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const table = searchParams.get("table");
  const total = searchParams.get("total");
  const customer = searchParams.get("customer") || "";
  const phone = searchParams.get("phone") || "";

  const [orderData, setOrderData] = useState(null);
  const [shopDetails, setShopDetails] = useState(null);
  const [error, setError] = useState("");
  const [isBillPaid, setIsBillPaid] = useState(false);
  const [canGenerateBill, setCanGenerateBill] = useState(false);
  const [sessionOrders, setSessionOrders] = useState([]);

  useEffect(() => {
    if (token) {
      loadOrderData();
    }
  }, [token]);

  // For dine-in tables: show all items for the current table session (orders since the last bill),
  // so the receipt reflects everything ordered for that table, not just a single token.
  useEffect(() => {
    if (!orderData) return;

    const tableNumber = orderData?.table_number || "";
    if (!tableNumber) {
      setSessionOrders([]);
      return;
    }

    const loadSessionOrders = async () => {
      try {
        const authToken = localStorage.getItem("authToken") || localStorage.getItem("token");
        const API_BASE = getApiBase();

        let sessionStartAt = null;
        try {
          const billRes = await fetch(
            `${API_BASE}/api/restaurant/invoices?table=${encodeURIComponent(
              tableNumber
            )}&sortBy=newest&page=1&limit=1`,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          if (billRes.ok) {
            const billJson = await billRes.json().catch(() => ({}));
            const latest = Array.isArray(billJson?.invoices) ? billJson.invoices[0] : null;
            if (latest?.created_at) {
              const ms = new Date(latest.created_at).getTime();
              if (Number.isFinite(ms)) sessionStartAt = ms;
            }
          }
        } catch {
          sessionStartAt = null;
        }

        const ordersRes = await fetch(
          `${API_BASE}/api/restaurant/orders?table=${encodeURIComponent(
            tableNumber
          )}&status=pending,preparing,ready,completed&date=today`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (!ordersRes.ok) {
          setSessionOrders([]);
          return;
        }

        const ordersJson = await ordersRes.json().catch(() => ({}));
        const orders = Array.isArray(ordersJson?.orders) ? ordersJson.orders : [];

        // Today boundaries (client-side safety net)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartMs = todayStart.getTime();

        const filtered = orders
          .filter((o) => o && String(o.status || "").toLowerCase() !== "cancelled")
          .filter((o) => {
            // Only today's orders
            const t = new Date(o.created_at).getTime();
            if (!Number.isFinite(t) || t < todayStartMs) return false;
            if (!sessionStartAt) return true;
            return t > sessionStartAt;
          })
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        setSessionOrders(filtered);
      } catch {
        setSessionOrders([]);
      }
    };

    loadSessionOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderData?.table_number]);

  // If there's an invoice for this order token and it's paid, hide "Add Order".
  useEffect(() => {
    if (!token) return;

    const fetchInvoicePayment = async () => {
      try {
        const authToken = localStorage.getItem("authToken") || localStorage.getItem("token");
        const API_BASE = getApiBase();

        const params = new URLSearchParams();
        params.append("page", "1");
        params.append("limit", "10");
        params.append("sortBy", "newest");
        params.append("search", token);

        const res = await fetch(`${API_BASE}/api/restaurant/invoices?${params.toString()}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!res.ok) {
          setIsBillPaid(false);
          return;
        }

        const data = await res.json().catch(() => ({}));
        const invoices = Array.isArray(data?.invoices) ? data.invoices : [];

        const paid = invoices.some((inv) => {
          const paymentStatus = String(inv?.payment_status || "").toLowerCase();
          const orderTokenStr = String(inv?.order_token || inv?.order_tokens || inv?.notes || "");
          const matchesToken = orderTokenStr.includes(token);
          return matchesToken && paymentStatus === "paid";
        });

        setIsBillPaid(paid);
      } catch {
        setIsBillPaid(false);
      }
    };

    fetchInvoicePayment();
  }, [token]);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
      const u = rawUser ? JSON.parse(rawUser) : null;
      const role = String(u?.role || u?.user_role || u?.user?.role || "").trim().toLowerCase();

      const isAdmin =
        role === "admin" ||
        role === "administrator" ||
        role === "owner" ||
        role === "shop_owner" ||
        role === "restaurant_owner" ||
        role.endsWith("_owner");

      const isManager =
        role === "manager" ||
        role === "restaurant_manager" ||
        role === "floor_manager" ||
        role === "supervisor";

      setCanGenerateBill(isAdmin || isManager);
    } catch {
      setCanGenerateBill(false);
    }
  }, []);

  // Persist customer details per order token so they still show even if user navigates back and prints later.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!token) return;
    if (!customer && !phone) return;

    try {
      const key = `orderCustomer_${token}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          customer: customer || "",
          phone: phone || "",
          savedAt: Date.now(),
        })
      );
    } catch {
      // non-blocking
    }
  }, [token, customer, phone]);

  // Also persist customer details once we have the order payload (covers cases where receipt is opened later without query params).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!token) return;
    if (!orderData) return;

    const name = orderData?.customer_name || "";
    const mobile = orderData?.customer_phone || "";
    if (!name && !mobile) return;

    try {
      const key = `orderCustomer_${token}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          customer: name,
          phone: mobile,
          savedAt: Date.now(),
        })
      );
    } catch {
      // non-blocking
    }
  }, [token, orderData]);

  useEffect(() => {
    loadShopDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadShopDetails = async () => {
    try {
      const authToken = localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/api/invoices/shop-details`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) return;
      const data = await response.json().catch(() => ({}));

      const resolveLogoUrl = (value) => {
        const v = String(value || "").trim();
        if (!v) return "";
        if (v.startsWith("http://") || v.startsWith("https://")) return v;
        const base = String(API_BASE || "").replace(/\/+$/, "");
        const path = v.startsWith("/") ? v : `/${v}`;
        return base ? `${base}${path}` : path;
      };

      setShopDetails({
        name: data.shop_name || "Restaurant",
        address: data.shop_address || "",
        phone: data.shop_phone || "",
        email: data.shop_email || "",
        gst: data.shop_gst || "",
        logo: resolveLogoUrl(data.logo_path),
      });
    } catch {
      // non-blocking
    }
  };

  const loadOrderData = async () => {
    try {
      const authToken = localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();

      const response = await fetch(`${API_BASE}/api/restaurant/orders/token/${token}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrderData(data.order);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Order not found");
        setOrderData(null);
      }
    } catch (error) {
      console.error("Error loading order:", error);
      setError("Failed to load order");
    }
  };

  const order = orderData;
  const tableValue = order?.table_number || table || "";

  const displayOrders =
    tableValue && sessionOrders.length > 0 ? sessionOrders : order ? [order] : [];
  const displayOrderTokens = displayOrders.map((o) => o.order_token).filter(Boolean);

  const mergedItems = (() => {
    const merged = new Map();
    displayOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const name = String(it.name || it.item_name || "").trim();
        const price = Number(it.price ?? it.price_per_unit ?? 0);
        const qty = Number(it.quantity ?? 0);
        if (!name || !Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return;
        const k = `${name}__${price.toFixed(2)}`;
        const prev = merged.get(k);
        if (prev) prev.quantity += qty;
        else merged.set(k, { name, price, quantity: qty });
      });
    });
    return Array.from(merged.values()).sort((a, b) =>
      String(a.name).localeCompare(String(b.name))
    );
  })();
  const storedCustomer = (() => {
    if (typeof window === "undefined" || !token) return null;
    try {
      const raw = localStorage.getItem(`orderCustomer_${token}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const customerNameValue =
    order?.customer_name || customer || storedCustomer?.customer || "";
  const customerPhoneValue =
    order?.customer_phone || phone || storedCustomer?.phone || "";
  const INR = "\u20B9";
  const GST_RATE = 0.18;

  const subtotalValue = mergedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const taxValue = subtotalValue * GST_RATE;
  const totalCalc = subtotalValue + taxValue;
  const netTotal = Math.round(totalCalc);
  const roundOff = netTotal - totalCalc;

  const totalValue =
    total && Number.isFinite(Number(total)) ? parseFloat(total) : netTotal;

  const normalizedStatus = String(order?.status || "").toLowerCase();
  const isCompleted = normalizedStatus === "completed";
  const canAddItems = !!token && !!order && !isCompleted && !isBillPaid;

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/restaurant/orders")}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            {canAddItems ? (
              <button
                onClick={() =>
                  router.push(
                    `/restaurant/orders/new?editToken=${encodeURIComponent(token)}`
                  )
                }
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Items
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.print();
              }}
              disabled={!order}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Print Receipt
            </button>
          </div>
        </div>

        {/* Receipt Container */}
        <div className="receipt-container thermal bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          {!order ? (
            <div className="text-center py-10">
              <p className="text-lg font-semibold text-gray-800 mb-2">
                {error || "Order not found"}
              </p>
              <p className="text-gray-500">
                Please check the order token or create a new order.
              </p>
            </div>
          ) : (
            <>
              {/* Header section removed per request */}

              <div className="tr-billto">
                <div className="tr-billto-label">Bill To:</div>
                <div className="tr-billto-value">Table {tableValue}</div>
                {customerNameValue ? (
                  <div className="tr-billto-sub">Customer: {customerNameValue}</div>
                ) : null}
                {customerPhoneValue ? (
                  <div className="tr-billto-sub">Mobile: {customerPhoneValue}</div>
                ) : null}
                {orderData?.customer_notes || order?.customer_notes ? (
                  <div className="tr-billto-sub whitespace-pre-wrap">Notes: {orderData?.customer_notes || order?.customer_notes}</div>
                ) : null}
              </div>

              <table className="tr-items">
                <thead>
                  <tr>
                    <th style={{ width: "8mm" }}>#</th>
                    <th>Item</th>
                    <th style={{ width: "14mm" }}>Price</th>
                    <th style={{ width: "10mm" }}>Qty</th>
                    <th style={{ width: "16mm", textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {mergedItems.map((item, idx) => {
                    const price = Number(item.price || 0);
                    const qty = Number(item.quantity || 0);
                    const amt = price * qty;
                    return (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td title={item.name}>{item.name}</td>
                        <td>
                          {INR}
                          {price.toFixed(2)}
                        </td>
                        <td>{qty}</td>
                        <td style={{ textAlign: "right" }}>
                          {INR}
                          {amt.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals section removed per request */}
            </>
          )}
        </div>

        {canGenerateBill && order && (
          <div className="mt-8 mb-12 max-w-[80mm] mx-auto">
            <button
              onClick={() => {
                const notesValue = orderData?.customer_notes || order?.customer_notes || "";
                router.push(
                  `/restaurant/billing/add?token=${token}&table=${tableValue}&total=${totalValue}${customerNameValue ? `&customer=${encodeURIComponent(customerNameValue)}` : ""
                  }${customerPhoneValue ? `&phone=${encodeURIComponent(customerPhoneValue)}` : ""}${notesValue ? `&notes=${encodeURIComponent(notesValue)}` : ""}`
                );
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold text-base shadow-md"
            >
              <FaCheckCircle className="text-lg" /> Generate Bill
            </button>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        .receipt-container.thermal {
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          font-family: monospace;
          font-size: 12px;
          line-height: 1.25;
        }
        .tr-header {
          text-align: center;
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .tr-logo {
          display: block;
          margin: 0 auto 6px;
          max-width: 34mm;
          height: auto;
        }
        .tr-shop {
          font-size: 11px;
          color: #111;
        }
        .tr-shop-name {
          font-weight: 700;
          font-size: 13px;
          margin-bottom: 2px;
        }
        .tr-title {
          margin-top: 8px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .tr-meta {
          margin-top: 6px;
          font-size: 11px;
        }
        .tr-billto {
          padding: 10px 0;
          border-bottom: 1px dashed #000;
          margin-bottom: 10px;
        }
        .tr-billto-label {
          font-weight: 700;
          margin-bottom: 4px;
        }
        .tr-billto-value {
          font-weight: 700;
        }
        .tr-billto-sub {
          margin-top: 4px;
          font-size: 11px;
        }
        .tr-items {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          table-layout: fixed;
        }
        .tr-items th,
        .tr-items td {
          border: none;
          padding: 6px 0;
          border-bottom: 1px dashed #ddd;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tr-items th:nth-child(2),
        .tr-items td:nth-child(2) {
          white-space: normal;
          overflow: visible;
          text-overflow: clip;
          word-break: break-word;
        }
        .tr-items th {
          border-bottom: 1px solid #000;
          padding-bottom: 8px;
          font-weight: 700;
          text-align: left;
        }
        .tr-items tbody tr:last-child td {
          border-bottom: 1px solid #000;
        }
        .tr-totals {
          margin-top: 12px;
          font-size: 12px;
        }
        .tr-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-top: 1px dashed #000;
        }
        .tr-row:first-child {
          border-top: none;
        }
        .tr-strong {
          font-weight: 700;
        }
        .tr-net {
          font-weight: 700;
          border-top: 2px dashed #000;
          margin-top: 6px;
          padding-top: 10px;
        }

        @media print {
          @page {
            /* 80mm thermal roll */
            size: 80mm auto;
            margin: 0;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          /* Hide everything by default */
          body * {
            visibility: hidden !important;
          }
          /* Ensure common layout elements never print */
          header,
          footer,
          nav,
          aside,
          .no-print {
            display: none !important;
          }
          /* Show only receipt */
          .receipt-container,
          .receipt-container * {
            visibility: visible !important;
          }
          .receipt-container {
            position: fixed !important;
            left: 50% !important;
            top: 0 !important;
            transform: translateX(-50%) !important;
            width: 80mm;
            max-width: 80mm;
            padding: 4mm !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            font-size: 12px;
            line-height: 1.25;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
