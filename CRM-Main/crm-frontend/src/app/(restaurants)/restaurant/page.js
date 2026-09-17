"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaClipboardList,
  FaChair,
  FaDollarSign,
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaUtensils,
  FaFire,
  FaArrowRight,
  FaArrowUp,
  FaArrowDown,
  FaTable,
  FaShoppingCart,
  FaListAlt,
  FaRupeeSign,
  FaChartBar,
  FaMobileAlt,
} from "react-icons/fa";
import RestaurantLoader from "@/components/RestaurantLoader";
import { getApiBase } from "@/utils/apiBase";
import VersionCheck from "@/components/VersionCheck";

export default function RestaurantDashboard() {
  const router = useRouter();
  const INR = "\u20B9";
  const formatCurrencyShort = (value) => {
    const amount = Number(value) || 0;
    if (amount >= 10000000) return (amount / 10000000).toFixed(2).replace(/\.00$/, '') + "Cr";
    if (amount >= 100000) return (amount / 100000).toFixed(2).replace(/\.00$/, '') + "L";
    if (amount >= 1000) return (amount / 1000).toFixed(2).replace(/\.00$/, '') + "K";
    return amount.toFixed(0);
  };
  const [loading, setLoading] = useState(true);
  const [hasDashboardAccess, setHasDashboardAccess] = useState(false);
  const [activeCard, setActiveCard] = useState("todayOrders");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [allOrders, setAllOrders] = useState([]);
  const [allTables, setAllTables] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    activeTables: 0,
    totalTables: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    completedOrders: 0,
    recentOrders: [],
    availableTables: 0,
    topSellingItems: [],
    platformSplit: {
      dineIn: { orders: 0, revenue: 0 },
      takeAway: { orders: 0, revenue: 0 },
    },
  });

  useEffect(() => {
    // Dashboard is Admin/Owner only; staff/manager/chef should not access it.
    try {
      const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
      const u = rawUser ? JSON.parse(rawUser) : null;
      const role = String(u?.role || u?.user_role || u?.user?.role || "").toLowerCase();

      const isAdmin =
        role === "admin" ||
        role === "administrator" ||
        role === "owner" ||
        role === "shop_owner" ||
        role === "restaurant_owner" ||
        role.endsWith("_owner");

      if (!isAdmin) {
        if (["chef", "cook", "kitchen"].includes(role)) {
          router.replace("/restaurant/kitchen");
        } else {
          router.replace("/restaurant/my-dashboard");
        }
        return;
      }

      setHasDashboardAccess(true);
    } catch {
      router.replace("/restaurant/tables");
      return;
    }

    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCard]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();

      const pad2 = (n) => String(n).padStart(2, "0");
      const now = new Date();
      const todayYmd = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
      const todayStr = now.toDateString();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayYmd = `${yesterday.getFullYear()}-${pad2(yesterday.getMonth() + 1)}-${pad2(yesterday.getDate())}`;

      // Fetch multiple data sources
      const [ordersRes, tablesRes, invoicesRes] = await Promise.all([
        fetch(`${API_BASE}/api/restaurant/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch(`${API_BASE}/api/restaurant/tables`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch(
          `${API_BASE}/api/restaurant/invoices?dateFrom=${encodeURIComponent(
            yesterdayYmd
          )}&dateTo=${encodeURIComponent(todayYmd)}&limit=1000`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).catch(() => null),
      ]);

      let orders = [];
      let tables = [];
      let invoices = [];

      if (ordersRes?.ok) {
        const ordersData = await ordersRes.json();
        orders = ordersData.orders || [];
      } else {
        orders = [];
      }

      if (tablesRes?.ok) {
        const tablesData = await tablesRes.json();
        tables = tablesData.tables || [];
      } else {
        tables = [];
      }

      if (invoicesRes?.ok) {
        const invoicesData = await invoicesRes.json();
        invoices = invoicesData.invoices || [];
      } else {
        invoices = [];
      }

      // Normalize status casing for consistent comparisons
      const normalizedOrders = orders.map((o) => ({
        ...o,
        _status: (o.status || "").toLowerCase(),
      }));
      const normalizedTables = tables.map((t) => ({
        ...t,
        _status: (t.status || "").toLowerCase(),
      }));

      setAllOrders(normalizedOrders);
      setAllTables(normalizedTables);
      setAllInvoices(invoices);

      // Calculate statistics based on invoices
      const todayInvoices = invoices.filter(
        (inv) => new Date(inv.created_at).toDateString() === todayStr
      );
      const todayCompletedInvoices = todayInvoices.filter(
        (inv) => (inv.payment_status || "").toLowerCase() === "paid"
      );

      const todayRevenue = todayCompletedInvoices.reduce(
        (sum, inv) => sum + (Number(inv.rounded_total || inv.total || 0) || 0),
        0
      );

      const occupiedTables = normalizedTables.filter((t) => t._status === "occupied").length;
      const reservedTables = normalizedTables.filter((t) => t._status === "reserved").length;
      const availableTables = normalizedTables.filter((t) => t._status === "available").length;

      const pendingOrders = normalizedOrders.filter(
        (o) => o._status === "pending" || o._status === "preparing"
      ).length;
      const preparingOrders = normalizedOrders.filter((o) => o._status === "preparing").length;

      // Map completed invoices to order-like structures for dashboard list/split calculations
      const mappedCompletedInvoices = todayCompletedInvoices.map((inv) => ({
        id: inv.id,
        order_token: inv.invoice_number || inv.order_token,
        customer_name: inv.customer_name,
        customer_phone: inv.customer_phone,
        table_number: inv.table_number,
        platform: inv.platform || ((inv.table_number && (inv.table_number.toLowerCase().includes("take") || inv.table_number.toLowerCase().includes("away"))) || (inv.order_token && (inv.order_token.toLowerCase().includes("take") || inv.order_token.toLowerCase().includes("away"))) ? "Takeaway" : "Dine-In"),
        created_at: inv.created_at,
        total_amount: Number(inv.rounded_total || inv.total || 0),
        payment_method: inv.payment_method,
        payment_status: inv.payment_status,
        status: "Completed",
        _status: "completed",
        items: inv.items || []
      }));

      const completedOrders = mappedCompletedInvoices.length;

      // Recent orders: map recent completed invoices (last 5)
      const recentOrders = mappedCompletedInvoices
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      // Calculate platform split
      const platformSplit = {
        dineIn: { orders: 0, revenue: 0 },
        takeAway: { orders: 0, revenue: 0 },
      };

      mappedCompletedInvoices.forEach((order) => {
        const platform = order.platform.toLowerCase();
        const amount = order.total_amount || 0;

        if (platform.includes("take") || platform.includes("away")) {
          platformSplit.takeAway.orders += 1;
          platformSplit.takeAway.revenue += amount;
        } else {
          platformSplit.dineIn.orders += 1;
          platformSplit.dineIn.revenue += amount;
        }
      });

      // Calculate top selling items
      const itemMap = {};
      mappedCompletedInvoices.forEach((order) => {
        const items = order.items || [];
        items.forEach((item) => {
          const name = item.item_name || item.name;
          if (!name) return;
          if (!itemMap[name]) {
            itemMap[name] = 0;
          }
          itemMap[name] += Number(item.quantity || 1);
        });
      });

      const topSellingItems = Object.entries(itemMap)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setDashboardData({
        todayOrders: todayCompletedInvoices.length,
        todayRevenue,
        activeTables: occupiedTables + reservedTables,
        totalTables: tables.length,
        pendingOrders,
        preparingOrders,
        completedOrders,
        recentOrders,
        availableTables,
        topSellingItems,
        platformSplit,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setDashboardData({
        todayOrders: 0,
        todayRevenue: 0,
        activeTables: 0,
        totalTables: 0,
        pendingOrders: 0,
        preparingOrders: 0,
        completedOrders: 0,
        recentOrders: [],
        availableTables: 0,
        platformSplit: {
          dineIn: { orders: 0, revenue: 0 },
          takeAway: { orders: 0, revenue: 0 },
        },
        topSellingItems: [],
      });
      setAllOrders([]);
      setAllTables([]);
    } finally {
      setLoading(false);
    }
  };

  const cardClass = (key) =>
    [
      "bg-white border rounded-lg p-2.5 lg:p-4 shadow-sm transition-all duration-200 ease-in-out text-left h-full flex flex-row lg:flex-col items-center lg:items-start lg:justify-between gap-3 lg:gap-0",
      "hover:shadow-md hover:-translate-y-[1px] cursor-pointer",
      activeCard === key ? "border-gray-900 ring-2 ring-gray-900/10" : "border-gray-200",
    ].join(" ");

  const getTimeAgo = (date) => {
    const now = new Date();
    const orderDate = new Date(date);
    const diff = Math.floor((now - orderDate) / 1000 / 60); // minutes
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    const hours = Math.floor(diff / 60);
    return `${hours} hr ${diff % 60} min ago`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "preparing":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "ready":
        return "bg-green-100 text-green-800 border-green-300";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (!hasDashboardAccess || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RestaurantLoader
          variant="container"
          message={hasDashboardAccess ? "Loading dashboard..." : "Verifying access..."}
        />
      </div>
    );
  }

  const todayStr = new Date().toDateString();
  const todayCompletedOrders = allInvoices
    .filter(
      (inv) =>
        new Date(inv.created_at).toDateString() === todayStr &&
        (inv.payment_status || "").toLowerCase() === "paid"
    )
    .map((inv) => ({
      id: inv.id,
      order_token: inv.invoice_number || inv.order_token,
      customer_name: inv.customer_name,
      customer_phone: inv.customer_phone,
      table_number: inv.table_number,
      platform: inv.platform || ((inv.table_number && (inv.table_number.toLowerCase().includes("take") || inv.table_number.toLowerCase().includes("away"))) || (inv.order_token && (inv.order_token.toLowerCase().includes("take") || inv.order_token.toLowerCase().includes("away"))) ? "Takeaway" : "Dine-In"),
      created_at: inv.created_at,
      total_amount: Number(inv.rounded_total || inv.total || 0),
      payment_method: inv.payment_method,
      payment_status: inv.payment_status,
      status: "Completed",
      _status: "completed",
    }));
  const preparingOrdersList = allOrders.filter((o) => o._status === "preparing");
  const activeTablesList = allTables.filter((t) =>
    ["occupied", "reserved"].includes(t._status)
  );

  const listConfig = (() => {
    switch (activeCard) {
      case "todayOrders":
        return {
          title: "Completed Orders (Today)",
          subtitle: "Today",
          kind: "orders",
          items: [...todayCompletedOrders].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          ),
          viewAllLabel: "View All",
          onViewAll: () => router.push("/restaurant/orders"),
        };
      case "todayRevenue":
        return {
          title: "Revenue Orders (Today)",
          subtitle: "Highest first",
          kind: "orders",
          items: [...todayCompletedOrders].sort(
            (a, b) => (b.total_amount || 0) - (a.total_amount || 0)
          ),
          viewAllLabel: "View All",
          onViewAll: () => router.push("/restaurant/reports"),
        };
      case "activeTables":
        return {
          title: "Active Tables",
          subtitle: "Occupied / Reserved",
          kind: "tables",
          items: [...activeTablesList].sort((a, b) =>
            String(a.table_number || "").localeCompare(String(b.table_number || ""))
          ),
          viewAllLabel: "Manage",
          onViewAll: () => router.push("/restaurant/tables"),
        };
      case "preparingOrders":
        return {
          title: "Preparing Orders",
          subtitle: "In kitchen",
          kind: "orders",
          items: [...preparingOrdersList].sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          ),
          viewAllLabel: "View All",
          onViewAll: () => router.push("/restaurant/orders"),
        };
      default:
        return {
          title: "Recent Orders",
          subtitle: "Latest activity",
          kind: "orders",
          items: dashboardData.recentOrders || [],
          viewAllLabel: "View All",
          onViewAll: () => router.push("/restaurant/orders"),
        };
    }
  })();

  return (
    <div className="p-4 lg:p-5 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 lg:mb-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                Restaurant Dashboard
              </h1>
              <p className="text-gray-600 text-xs lg:text-sm mt-0.5">
                Welcome back! Here&apos;s what&apos;s happening today
              </p>
            </div>
            <button
              onClick={() => router.push("/restaurant/orders/new")}
              className="hidden lg:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm"
            >
              <FaShoppingCart size={14} /> New Order
            </button>
          </div>
          {/* Version & Status Banner */}
          <div className="mb-4 lg:mb-5">
            <VersionCheck />
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-5">
            {/* Today's Orders */}
            <button
              type="button"
              onClick={() => setActiveCard("todayOrders")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${activeCard === "todayOrders" ? "bg-blue-50 border-blue-600 ring-2 ring-blue-100" : "bg-blue-50/40 border-blue-100 hover:border-blue-300"}`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100/50 rounded-lg flex items-center justify-center shrink-0">
                    <FaClipboardList className="text-blue-600" size={18} />
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 leading-none">{dashboardData.todayOrders}</p>
                </div>
                <p className="text-blue-500/70 text-[10px] font-bold uppercase tracking-widest ml-12 leading-none">Total Orders</p>
              </div>
            </button>

            {/* Today's Revenue */}
            <button
              type="button"
              onClick={() => setActiveCard("todayRevenue")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${activeCard === "todayRevenue" ? "bg-green-50 border-green-600 ring-2 ring-green-100" : "bg-green-50/40 border-green-100 hover:border-green-300"}`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100/50 rounded-lg flex items-center justify-center shrink-0">
                    <FaRupeeSign className="text-green-600" size={16} />
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 leading-none">
                    <span className="lg:hidden">{INR}{formatCurrencyShort(dashboardData.todayRevenue)}</span>
                    <span className="hidden lg:inline">{INR}{dashboardData.todayRevenue.toFixed(0)}</span>
                  </p>
                </div>
                <p className="text-green-600/70 text-[10px] font-bold uppercase tracking-widest ml-12 leading-none">Total Sales</p>
              </div>
            </button>

            {/* Active Tables */}
            <button
              type="button"
              onClick={() => setActiveCard("activeTables")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${activeCard === "activeTables" ? "bg-purple-50 border-purple-600 ring-2 ring-purple-100" : "bg-purple-50/40 border-purple-100 hover:border-purple-300"}`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-100/50 rounded-lg flex items-center justify-center shrink-0">
                    <FaChair className="text-purple-600" size={18} />
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 leading-none">{dashboardData.activeTables}</p>
                </div>
                <p className="text-purple-500/70 text-[10px] font-bold uppercase tracking-widest ml-12 leading-none">Active Tables</p>
              </div>
            </button>

            {/* Preparing Orders */}
            <button
              type="button"
              onClick={() => setActiveCard("preparingOrders")}
              className={`p-4 rounded-xl border-2 transition-all text-left ${activeCard === "preparingOrders" ? "bg-amber-50 border-amber-500 ring-2 ring-amber-100" : "bg-amber-50/40 border-amber-100 hover:border-amber-300"}`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100/50 rounded-lg flex items-center justify-center shrink-0">
                    <FaSpinner className="text-amber-600 animate-spin" size={18} />
                  </div>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 leading-none">{dashboardData.preparingOrders}</p>
                </div>
                <p className="text-amber-600/70 text-[10px] font-bold uppercase tracking-widest ml-12 leading-none">Preparing</p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mb-4 lg:mb-5">
            {/* Main List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-fit">
              <div className="p-3 lg:p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FaUtensils className="text-gray-700" size={14} lg={16} />
                  </div>
                  <div>
                    <h2 className="text-sm lg:text-base font-bold text-gray-900">{listConfig.title}</h2>
                    <p className="text-[10px] lg:text-xs text-gray-600">{listConfig.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={listConfig.onViewAll}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-xs lg:text-sm flex items-center gap-1 transition-colors"
                >
                  {listConfig.viewAllLabel} <FaArrowRight size={10} lg={12} />
                </button>
              </div>
              <div className="divide-y divide-gray-200">
                {listConfig.items.length === 0 ? (
                  <div className="p-8 text-center">
                    <FaUtensils className="text-gray-300 mx-auto mb-3" size={32} />
                    <p className="text-gray-500 font-medium">
                      {listConfig.kind === "tables" ? "No active tables" : "No orders found"}
                    </p>
                    {listConfig.kind !== "tables" && (
                      <button
                        onClick={() => router.push("/restaurant/orders/new")}
                        className="mt-4 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs lg:text-sm font-medium"
                      >
                        Create First Order
                      </button>
                    )}
                  </div>
                ) : (
                  listConfig.items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) =>
                    listConfig.kind === "tables" ? (
                      <div
                        key={item.id ?? item.table_number}
                        onClick={() => router.push("/restaurant/tables")}
                        className="p-3 lg:p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 lg:gap-3">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FaTable className="text-gray-600" size={12} lg={14} />
                            </div>
                            <div>
                              <p className="font-semibold text-[13px] lg:text-base text-gray-900">Table {item.table_number}</p>
                              <p className="text-[11px] lg:text-sm text-gray-600">{item.status}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium border capitalize ${item._status === "occupied"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : item._status === "reserved"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-gray-100 text-gray-800 border-gray-300"
                            }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={item.id}
                        onClick={() =>
                          router.push(
                            `/restaurant/orders/receipt?token=${encodeURIComponent(
                              item.order_token
                            )}${item.table_number
                              ? `&table=${encodeURIComponent(item.table_number)}`
                              : item.platform
                                ? `&table=${encodeURIComponent(item.platform)}`
                                : ""
                            }${item.total_amount != null
                              ? `&total=${encodeURIComponent(item.total_amount)}`
                              : ""
                            }${item.customer_name
                              ? `&customer=${encodeURIComponent(item.customer_name)}`
                              : ""
                            }${item.customer_phone
                              ? `&phone=${encodeURIComponent(item.customer_phone)}`
                              : ""
                            }`
                          )
                        }
                        className="p-2.5 lg:p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5 lg:mb-2">
                          <div className="flex items-center gap-2 lg:gap-3">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              {item.platform?.toLowerCase().includes("take") || item.platform?.toLowerCase().includes("away") ? (
                                <FaShoppingCart className="text-emerald-600" size={12} lg={14} />
                              ) : item.platform?.toLowerCase().includes("zomato") ? (
                                <FaMobileAlt className="text-red-600" size={12} lg={14} />
                              ) : item.platform?.toLowerCase().includes("swiggy") ? (
                                <FaMobileAlt className="text-orange-600" size={12} lg={14} />
                              ) : (
                                <FaTable className="text-gray-600" size={12} lg={14} />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-[13px] lg:text-base text-gray-900 leading-tight">{item.order_token}</p>
                              <p className="text-[11px] lg:text-sm text-gray-600">
                                {item.table_number
                                  ? `Table ${item.table_number}`
                                  : item.platform || "Dine-In"}
                              </p>
                              {item.customer_name ? (
                                <p className="text-[10px] text-gray-500">
                                  {item.customer_name}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 lg:gap-2">
                            {(item.platform?.toLowerCase().includes("take") || item.platform?.toLowerCase().includes("away")) && (
                              <span className="px-1.5 py-0.5 lg:px-2 lg:py-1 bg-white border border-emerald-300 text-emerald-700 rounded text-[10px] lg:text-xs font-medium">
                                Takeaway
                              </span>
                            )}
                            {item.platform?.toLowerCase().includes("zomato") && (
                              <span className="px-1.5 py-0.5 lg:px-2 lg:py-1 bg-white border border-red-300 text-red-700 rounded text-[10px] lg:text-xs font-medium">
                                Zomato
                              </span>
                            )}
                            {item.platform?.toLowerCase().includes("swiggy") && (
                              <span className="px-1.5 py-0.5 lg:px-2 lg:py-1 bg-white border border-orange-300 text-orange-700 rounded text-[10px] lg:text-xs font-medium">
                                Swiggy
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 lg:px-3 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium border ${getStatusColor(
                                (item.status || "").toLowerCase()
                              )}`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 lg:mt-3">
                          <span className="text-[11px] lg:text-sm text-gray-600">{getTimeAgo(item.created_at)}</span>
                          <span className="font-bold text-[13px] lg:text-base text-gray-900">
                            {INR}
                            {item.total_amount?.toFixed(0) || "0"}
                          </span>
                        </div>
                      </div>
                    )
                  ))}
              </div>

              {/* Pagination Controls */}
              {listConfig.items.length > itemsPerPage && (
                <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-xs font-semibold text-gray-600 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-600 transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                    Page {currentPage} of {Math.ceil(listConfig.items.length / itemsPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(Math.ceil(listConfig.items.length / itemsPerPage), p + 1))}
                    disabled={currentPage >= Math.ceil(listConfig.items.length / itemsPerPage)}
                    className="px-3 py-1 text-xs font-semibold text-gray-600 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-600 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>


            <div className="space-y-4 lg:space-y-5">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FaFire className="text-gray-700" size={16} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Quick Actions</h2>
                      <p className="text-xs text-gray-600">Fast access to key features</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  <button
                    onClick={() => router.push("/restaurant/orders/new")}
                    className="flex flex-col items-center sm:items-start p-2.5 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-in-out group text-center sm:text-left bg-white cursor-pointer"
                  >
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-50 rounded-md sm:rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                      <FaShoppingCart className="text-blue-600" size={14} />
                    </div>
                    <p className="font-bold text-[10px] sm:text-base text-gray-900 mb-0.5 line-clamp-1">New Order</p>
                    <p className="text-[9px] sm:text-xs text-gray-600 line-clamp-1">Take order</p>
                    <FaArrowRight className="text-gray-400 mt-1.5 sm:mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={8} />
                  </button>

                  <button
                    onClick={() => router.push("/restaurant/billing")}
                    className="flex flex-col items-center sm:items-start p-2.5 sm:p-4 border border-gray-200 rounded-lg hover:border-emerald-400 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-in-out group text-center sm:text-left bg-white cursor-pointer"
                  >
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-emerald-50 rounded-md sm:rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                      <FaListAlt className="text-emerald-600" size={14} />
                    </div>
                    <p className="font-bold text-[10px] sm:text-base text-gray-900 mb-0.5 line-clamp-1">Billing</p>
                    <p className="text-[9px] sm:text-xs text-gray-600 line-clamp-1">Create bill</p>
                    <FaArrowRight className="text-gray-400 mt-1.5 sm:mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={8} />
                  </button>

                  <button
                    onClick={() => router.push("/restaurant/tables")}
                    className="flex flex-col items-center sm:items-start p-2.5 sm:p-4 border border-gray-200 rounded-lg hover:border-purple-400 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-in-out group text-center sm:text-left bg-white cursor-pointer"
                  >
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-50 rounded-md sm:rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                      <FaTable className="text-purple-600" size={14} />
                    </div>
                    <p className="font-bold text-[10px] sm:text-base text-gray-900 mb-0.5 line-clamp-1">Tables</p>
                    <p className="text-[9px] sm:text-xs text-gray-600 line-clamp-1">Manage tables</p>
                    <FaArrowRight className="text-gray-400 mt-1.5 sm:mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={8} />
                  </button>

                  <button
                    onClick={() => router.push("/restaurant/orders")}
                    className="flex flex-col items-center sm:items-start p-2.5 sm:p-4 border border-gray-200 rounded-lg hover:border-indigo-400 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-in-out group text-center sm:text-left bg-white cursor-pointer"
                  >
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-indigo-50 rounded-md sm:rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                      <FaClipboardList className="text-indigo-600" size={14} />
                    </div>
                    <p className="font-bold text-[10px] sm:text-base text-gray-900 mb-0.5 line-clamp-1">Running Orders</p>
                    <p className="text-[9px] sm:text-xs text-gray-600 line-clamp-1">View active</p>
                    <FaArrowRight className="text-gray-400 mt-1.5 sm:mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={8} />
                  </button>

                  <button
                    onClick={() => router.push("/restaurant/kitchen")}
                    className="flex flex-col items-center sm:items-start p-2.5 sm:p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-in-out group text-center sm:text-left bg-white cursor-pointer"
                  >
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-50 rounded-md sm:rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                      <FaFire className="text-orange-600" size={14} />
                    </div>
                    <p className="font-bold text-[10px] sm:text-base text-gray-900 mb-0.5 line-clamp-1">Kitchen</p>
                    <p className="text-[9px] sm:text-xs text-gray-600 line-clamp-1">Chef view</p>
                    <FaArrowRight className="text-gray-400 mt-1.5 sm:mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={8} />
                  </button>

                  <button
                    onClick={() => router.push("/restaurant/hrms")}
                    className="flex flex-col items-center sm:items-start p-2.5 sm:p-4 border border-gray-200 rounded-lg hover:border-teal-400 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-in-out group text-center sm:text-left bg-white cursor-pointer"
                  >
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-teal-50 rounded-md sm:rounded-lg flex items-center justify-center mb-2 sm:mb-3">
                      <FaUsers className="text-teal-600" size={14} />
                    </div>
                    <p className="font-bold text-[10px] sm:text-base text-gray-900 mb-0.5 line-clamp-1">HRMS</p>
                    <p className="text-[9px] sm:text-xs text-gray-600 line-clamp-1">Staff details</p>
                    <FaArrowRight className="text-gray-400 mt-1.5 sm:mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={8} />
                  </button>
                </div>
              </div>

              {/* Top Selling Items Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-4 lg:mt-5">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FaChartBar className="text-gray-700" size={16} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Top Selling Items</h2>
                      <p className="text-xs text-gray-600">Best performers today</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {dashboardData.topSellingItems.length === 0 ? (
                    <div className="py-8 text-center">
                      <FaUtensils className="text-gray-300 mx-auto mb-3" size={32} />
                      <p className="text-gray-500 font-medium text-sm">No items sold today yet</p>
                    </div>
                  ) : (
                    dashboardData.topSellingItems.map((item, index) => (
                      <div key={index} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-gray-700 truncate mr-2">{item.name}</span>
                          <span className="text-gray-900 font-bold whitespace-nowrap">{item.quantity} sold</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(item.quantity / dashboardData.topSellingItems[0].quantity) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Platform Split Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FaChartBar className="text-gray-700" size={16} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Platform Split</h2>
                  <p className="text-xs text-gray-600">Orders & revenue by platform</p>
                </div>
              </div>
            </div>
            <div className="p-4 flex flex-nowrap overflow-x-auto md:grid md:grid-cols-2 gap-3 lg:gap-4 scrollbar-hide pb-4">
              {/* Dine-In */}
              <div className="flex-shrink-0 w-[140px] md:w-auto h-full bg-white border border-gray-200 rounded-lg p-2.5 md:p-4 shadow-sm hover:border-indigo-400 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-in-out cursor-pointer flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FaChair className="text-indigo-600" size={14} />
                  </div>
                  <span className="text-[9px] md:text-xs font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                    Restaurant
                  </span>
                </div>
                <div>
                  <p className="text-gray-600 text-[10px] md:text-xs font-medium mb-0.5">Dine-In</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 mb-1">{dashboardData.platformSplit.dineIn.orders}</p>
                  <div className="space-y-0.5">
                    <p className="text-gray-500 text-[9px] md:text-xs">Revenue</p>
                    <p className="text-sm md:text-base font-semibold text-gray-900">
                      {INR}
                      {dashboardData.platformSplit.dineIn.revenue.toFixed(0)}
                    </p>
                  </div>
                  {/* Progress bar hidden on mobile to save height */}
                  <div className="hidden md:block mt-3 pt-2 border-t border-gray-200">
                    <div className="w-full bg-indigo-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${dashboardData.todayOrders > 0
                            ? (dashboardData.platformSplit.dineIn.orders /
                              dashboardData.todayOrders) *
                            100
                            : 0
                            }%`,
                        }}
                      />
                    </div>
                    <p className="text-gray-500 text-[10px] md:text-xs mt-2">
                      {dashboardData.todayOrders > 0
                        ? Math.round(
                          (dashboardData.platformSplit.dineIn.orders /
                            dashboardData.todayOrders) *
                          100
                        )
                        : 0}
                      % of total orders
                    </p>
                  </div>
                </div>
              </div>

              {/* Take Away */}
              <div className="flex-shrink-0 w-[140px] md:w-auto h-full bg-white border border-gray-200 rounded-lg p-2.5 md:p-4 shadow-sm hover:border-emerald-400 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-in-out cursor-pointer flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FaShoppingCart className="text-emerald-600" size={14} />
                  </div>
                  <span className="text-[9px] md:text-xs font-medium text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                    Takeaway
                  </span>
                </div>
                <div>
                  <p className="text-gray-600 text-[10px] md:text-xs font-medium mb-0.5">Take Away</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 mb-1">{dashboardData.platformSplit.takeAway.orders}</p>
                  <div className="space-y-0.5">
                    <p className="text-gray-500 text-[9px] md:text-xs">Revenue</p>
                    <p className="text-sm md:text-base font-semibold text-gray-900">
                      {INR}
                      {dashboardData.platformSplit.takeAway.revenue.toFixed(0)}
                    </p>
                  </div>
                  {/* Progress bar hidden on mobile to save height */}
                  <div className="hidden md:block mt-3 pt-2 border-t border-gray-200">
                    <div className="w-full bg-emerald-100 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${dashboardData.todayOrders > 0
                            ? (dashboardData.platformSplit.takeAway.orders /
                              dashboardData.todayOrders) *
                            100
                            : 0
                            }%`,
                        }}
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                      {dashboardData.todayOrders > 0
                        ? Math.round(
                          (dashboardData.platformSplit.takeAway.orders /
                            dashboardData.todayOrders) *
                          100
                        )
                        : 0}
                      % of total orders
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile New Order Button */}
        <button
          onClick={() => router.push("/restaurant/orders/new")}
          className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <FaShoppingCart size={24} />
        </button>
      </div>
    </div>
  );
}
