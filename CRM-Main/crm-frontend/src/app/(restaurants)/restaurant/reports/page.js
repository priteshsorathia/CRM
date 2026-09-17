"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaRupeeSign,
  FaChartBar,
  FaArrowRight,
  FaClipboardList,
  FaEye,
} from "react-icons/fa";
import RestaurantLoader from "@/components/RestaurantLoader";
import { getApiBase } from "@/utils/apiBase";
import AccessDenied from "@/components/AccessDenied";
import PrevNextPager from "@/components/ui/PrevNextPager";

const API_BASE = getApiBase();

function pad2(n) {
  return String(n).padStart(2, "0");
}

const formatCurrencyShort = (value) => {
  const amount = Number(value) || 0;
  if (amount >= 10000000) return (amount / 10000000).toFixed(2).replace(/\.00$/, '') + "Cr";
  if (amount >= 100000) return (amount / 100000).toFixed(2).replace(/\.00$/, '') + "L";
  if (amount >= 1000) return (amount / 1000).toFixed(2).replace(/\.00$/, '') + "K";
  return amount.toFixed(0);
};

function formatDateInput(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDateInput(value, { endOfDay } = { endOfDay: false }) {
  const [y, m, d] = String(value || "").split("-").map((v) => Number(v));
  if (!y || !m || !d) return new Date(NaN);
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
}

export default function RestaurantReportsPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [preset, setPreset] = useState("today");
  const [datesLoaded, setDatesLoaded] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [error, setError] = useState("");

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
        role.endsWith("_owner");

      setHasAccess(isOwner);
      setAccessChecked(true);
    } catch {
      setHasAccess(false);
      setAccessChecked(true);
    }
  }, []);

  useEffect(() => {
    const savedPreset = localStorage.getItem("restaurantReportsPreset");
    const savedStart = localStorage.getItem("restaurantReportsStartDate");
    const savedEnd = localStorage.getItem("restaurantReportsEndDate");

    if (savedStart && savedEnd) {
      setStartDate(savedStart);
      setEndDate(savedEnd);
      setPreset(savedPreset === "null" ? null : savedPreset || "today");
    } else {
      const d = new Date();
      const todayStr = formatDateInput(d);
      setStartDate(todayStr);
      setEndDate(todayStr);
      setPreset("today");
    }
    setDatesLoaded(true);
  }, []);

  useEffect(() => {
    if (!datesLoaded) return;
    localStorage.setItem("restaurantReportsPreset", preset === null ? "null" : preset);
    localStorage.setItem("restaurantReportsStartDate", startDate);
    localStorage.setItem("restaurantReportsEndDate", endDate);
  }, [preset, startDate, endDate, datesLoaded]);

  useEffect(() => {
    if (!accessChecked || !hasAccess) return;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const token =
          localStorage.getItem("authToken") || localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/restaurant/invoices?dateFrom=2020-01-01&dateTo=2030-12-31&limit=100000`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to load orders");
        }
        const data = await res.json();
        const normalized = (data.invoices || []).map((inv) => ({
          id: inv.id,
          order_token: inv.invoice_number || inv.order_token || `INV-${inv.id}`,
          customer_name: inv.customer_name,
          customer_phone: inv.customer_phone,
          table_number: inv.table_number || "Take away",
          platform: inv.platform || ((inv.table_number && (inv.table_number.toLowerCase().includes("take") || inv.table_number.toLowerCase().includes("away"))) || (inv.order_token && (inv.order_token.toLowerCase().includes("take") || inv.order_token.toLowerCase().includes("away"))) ? "Takeaway" : "Dine-In"),
          created_at: inv.created_at,
          total_amount: Number(inv.rounded_total || inv.total || 0),
          payment_method: inv.payment_method,
          payment_status: inv.payment_status,
          status: "Completed",
          _status: (inv.payment_status || "").toLowerCase() === "paid" ? "completed" : "pending",
          _created: new Date(inv.created_at),
        }));
        setOrders(normalized);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, [accessChecked, hasAccess]);

  const filtered = useMemo(() => {
    const start = parseDateInput(startDate, { endOfDay: false });
    const end = parseDateInput(endDate, { endOfDay: true });
    return orders.filter(
      (o) => o._created >= start && o._created <= end && o._status === "completed"
    );
  }, [orders, startDate, endDate]);

  const metrics = useMemo(() => {
    const revenue = filtered.reduce(
      (sum, o) => sum + (o.total_amount || 0),
      0
    );
    return {
      orders: filtered.length,
      revenue,
    };
  }, [filtered]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => b._created - a._created);
  }, [filtered]);

  const pages = Math.max(1, Math.ceil(sortedFiltered.length / pageSize));
  const pagedOrders = sortedFiltered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), pages));
  }, [pages]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RestaurantLoader variant="container" message="Loading reports..." />
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

  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Reports & Billing Insights
            </h1>
            <p className="text-gray-600 text-sm">
              View orders and revenue by day, week, or month.
            </p>
          </div>
          <button
            onClick={() => router.push("/restaurant")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm active:scale-95"
          >
            <FaArrowRight size={12} className="hidden sm:block" />
            Go to Dashboard
          </button>
        </div>

        {/* Date range selector with quick buttons */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start w-full sm:w-auto">
            {[
              { label: "Today", days: 1, key: "today" },
              { label: "7 Days", days: 7, key: "7d" },
              { label: "30 Days", days: 30, key: "30d" },
            ].map((r) => (
              <button
                key={r.label}
                onClick={() => {
                  const end = new Date();
                  const start = new Date();
                  start.setDate(start.getDate() - (r.days - 1));
                  setStartDate(formatDateInput(start));
                  setEndDate(formatDateInput(end));
                  setPreset(r.key);
                }}
                className={`min-w-[86px] px-3 py-2 rounded-md text-sm font-semibold border transition shadow-sm ${preset === r.key
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex flex-col flex-1 sm:flex-none">
              <label className="text-xs font-semibold text-gray-600">From</label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreset(null);
                }}
                className="px-3 h-10 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full"
              />
            </div>
            <div className="flex flex-col flex-1 sm:flex-none">
              <label className="text-xs font-semibold text-gray-600">To</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreset(null);
                }}
                className="px-3 h-10 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full"
              />
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard
            icon={<FaClipboardList className="text-blue-600" />}
            label="Completed Orders"
            value={metrics.orders}
            accent="border-blue-200"
          />
          <MetricCard
            icon={<FaRupeeSign className="text-emerald-600" />}
            label="Revenue"
            value={
              <>
                <span className="lg:hidden">₹{formatCurrencyShort(metrics.revenue)}</span>
                <span className="hidden lg:inline">₹{metrics.revenue.toFixed(2)}</span>
              </>
            }
            accent="border-emerald-200"
          />
        </div>

        {/* Orders list */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <FaChartBar className="text-gray-700" size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Orders (filtered)
                </h2>
                <p className="text-xs text-gray-600">
                  Showing {pagedOrders.length} of {sortedFiltered.length} in selected range
                </p>
              </div>
            </div>
          </div>
          {sortedFiltered.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No orders found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pagedOrders.map((order) => (
                <div
                  key={order.id}
                  className="px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 gap-4"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {order.order_token}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.customer_name
                        ? `Customer: ${order.customer_name}${order.customer_phone ? ` (${order.customer_phone})` : ""
                        } • `
                        : order.customer_phone
                          ? `Mobile: ${order.customer_phone} • `
                          : ""}
                      {order.table_number || order.platform || "NA"} •{" "}
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 border-t sm:border-0 pt-3 sm:pt-0 shrink-0">
                    <button
                      onClick={() => router.push(`/restaurant/billing/view/${order.id}`)}
                      className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition-colors flex items-center justify-center h-10 w-10 bg-white"
                      title="View order"
                    >
                      <FaEye size={16} />
                    </button>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">
                        ₹{(order.total_amount || 0).toFixed(2)}
                      </p>
                      {order.payment_method ? (
                        <p className="text-[10px] text-gray-500 font-medium">
                          {order.payment_method} • <span className={order.payment_status?.toLowerCase() === 'paid' ? 'text-green-600' : 'text-red-500'}>
                            {order.payment_status || 'Unpaid'}
                          </span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">
                          Unbilled
                        </p>
                      )}
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${order._status === "completed"
                          ? "text-green-700 bg-green-50 border-green-100"
                          : order._status === "pending"
                            ? "text-amber-700 bg-amber-50 border-amber-100"
                            : order._status === "preparing"
                              ? "text-blue-700 bg-blue-50 border-blue-100"
                              : "text-gray-700 bg-gray-50 border-gray-100"
                          }`}
                      >
                        {order._status || "unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {sortedFiltered.length > 0 ? (
            <PrevNextPager page={page} pages={pages} onPageChange={setPage} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, accent }) {
  return (
    <div
      className={`bg-white border ${accent} rounded-lg p-4 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-150`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-600 font-medium">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
