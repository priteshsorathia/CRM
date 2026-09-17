"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaFilter,
  FaSearch,
  FaEye,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaTv,
  FaCog,
  FaTable,
  FaEdit,
  FaFileInvoice,
  FaPrint,
} from "react-icons/fa";
import RestaurantLoader from "@/components/RestaurantLoader";
import { getApiBase } from "@/utils/apiBase";
import PrevNextPager from "@/components/ui/PrevNextPager";

export default function RunningOrdersPage() {
  const router = useRouter();
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("working"); // "preview" or "working"
  const [filter, setFilter] = useState("all"); // all, pending, preparing, ready
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyToday, setOnlyToday] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 9;
  
  // Preview mode pagination states
  const [pendingPage, setPendingPage] = useState(1);
  const [preparingPage, setPreparingPage] = useState(1);
  const [readyPage, setReadyPage] = useState(1);
  const previewPageSize = 6;

  useEffect(() => {
    const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
    const u = rawUser ? JSON.parse(rawUser) : null;
    setCurrentUser(u);
    const role = String(u?.role || u?.user_role || u?.user?.role || "").trim().toLowerCase();
    setUserRole(role);

    // Default to show only mine for staff if not explicitly changed
    if (['staff', 'waiter', 'server', 'cashier'].includes(role)) {
      setShowOnlyMine(true);
    }
  }, []);

  const isAdmin = [
    "owner",
    "admin",
    "administrator",
    "shop_owner",
    "restaurant_owner",
    "manager",
    "restaurant_manager",
    "floor_manager",
    "supervisor",
  ].includes(userRole);

  const isOrderInToday = (order) => {
    const created = new Date(order?.created_at);
    if (Number.isNaN(created.getTime())) return false;

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return created >= start && created <= end;
  };

  const scopedOrders = allOrders.filter((o) => {
    // 1. Time filter
    if (onlyToday && !isOrderInToday(o)) return false;

    // 2. Personal filter
    if (showOnlyMine && currentUser) {
      const myId = currentUser.id || currentUser.user?.id || null;
      const myName = String(currentUser.name || currentUser.user_name || "").trim().toLowerCase();

      const takenById = o.taken_by_id != null ? Number(o.taken_by_id) : null;
      const takenByName = String(o.taken_by_name || "").trim().toLowerCase();

      const isMine = (myId != null && takenById != null && myId === takenById) ||
        (myName && takenByName && myName === takenByName);

      if (!isMine) return false;
    }

    return true;
  });

  useEffect(() => {
    // Prune selections when orders list refreshes.
    setSelectedTokens((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return [];
      const tokenSet = new Set((allOrders || []).map((o) => String(o?.order_token || "")).filter(Boolean));
      const next = prev.filter((t) => tokenSet.has(String(t)));
      return next.length === prev.length ? prev : next;
    });
  }, [allOrders]);

  // Disable preview mode on mobile screens (Tailwind `sm` breakpoint ~640px).
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(min-width: 640px)");
    const sync = () => {
      if (!mq.matches) setMode("working");
    };

    sync();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }
    // Safari fallback
    mq.addListener(sync);
    return () => mq.removeListener(sync);
  }, []);

  useEffect(() => {
    loadOrders({ silent: false });

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      loadOrders({ silent: true });
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, onlyToday]);

  const loadOrders = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();
      if (!API_BASE) {
        throw new Error("API base URL is not configured (NEXT_PUBLIC_API_URL).");
      }

      const params = new URLSearchParams();
      if (onlyToday) params.set("date", "today");

      const response = await fetch(`${API_BASE}/api/restaurant/orders${params.toString() ? `?${params.toString()}` : ""}`, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAllOrders(data.orders || []);
      } else {
        setAllOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setAllOrders([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();
      if (!API_BASE) {
        throw new Error("API base URL is not configured (NEXT_PUBLIC_API_URL).");
      }

      const response = await fetch(
        `${API_BASE}/api/restaurant/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        loadOrders({ silent: true });
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
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
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaClock className="text-yellow-600" />;
      case "preparing":
        return <FaSpinner className="text-blue-600 animate-spin" />;
      case "ready":
        return <FaCheckCircle className="text-green-600" />;
      case "completed":
        return <FaCheckCircle className="text-gray-600" />;
      case "cancelled":
        return <FaTimesCircle className="text-red-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const getTimeElapsed = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diff = Math.floor((now - created) / 1000 / 60); // minutes
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    const hours = Math.floor(diff / 60);
    return `${hours} hr ${diff % 60} min ago`;
  };

  const getTableLabelValue = (order) => {
    // For online orders, backend may not have table_number. Fall back to platform.
    return order.table_number || order.platform || "Online";
  };

  const formatOrderTime = (dateValue) => {
    try {
      return new Date(dateValue).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const filteredOrders = scopedOrders.filter((order) => {
    // mode preview restrict to pending/preparing/ready
    if (mode === "preview") {
      if (!["pending", "preparing", "ready"].includes(order.status)) return false;
    } else if (filter === "active") {
      if (!["pending", "preparing"].includes(order.status)) return false;
    } else if (filter !== "all") {
      if (order.status !== filter) return false;
    }

    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch) {
      return (
        order.order_token?.toLowerCase().includes(trimmedSearch.toLowerCase()) ||
        order.table_number?.toLowerCase().includes(trimmedSearch.toLowerCase()) ||
        order.platform?.toLowerCase().includes(trimmedSearch.toLowerCase())
      );
    }
    return true;
  });

  const pages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pagedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [mode, filter, searchTerm, onlyToday, showOnlyMine]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), pages));
  }, [pages]);

  const visibleTokens = pagedOrders
    .map((o) => String(o?.order_token || ""))
    .filter(Boolean);
  const selectedSet = new Set(selectedTokens);
  const allVisibleSelected = visibleTokens.length > 0 && visibleTokens.every((t) => selectedSet.has(t));
  const someVisibleSelected = visibleTokens.some((t) => selectedSet.has(t));

  const toggleToken = (token) => {
    const t = String(token || "");
    if (!t) return;
    setSelectedTokens((prev) => {
      const set = new Set(prev);
      if (set.has(t)) set.delete(t);
      else set.add(t);
      return Array.from(set);
    });
  };

  const setAllVisible = (checked) => {
    setSelectedTokens((prev) => {
      const set = new Set(prev);
      if (checked) visibleTokens.forEach((t) => set.add(t));
      else visibleTokens.forEach((t) => set.delete(t));
      return Array.from(set);
    });
  };

  const handlePrintSelected = () => {
    if (selectedTokens.length === 0) {
      alert("Please select at least one order to print.");
      return;
    }

    const tokensParam = selectedTokens.map((t) => String(t)).filter(Boolean).join(",");
    const href = `/restaurant/orders/print?tokens=${encodeURIComponent(tokensParam)}`;
    router.push(href);
  };

  const statusCounts = {
    all: scopedOrders.length,
    active: scopedOrders.filter(
      (o) => o.status === "pending" || o.status === "preparing"
    ).length,
    ready: scopedOrders.filter((o) => o.status === "ready").length,
    completed: scopedOrders.filter((o) => o.status === "completed").length,
  };

  // Preview Mode - Customer Display View (For Restaurant Monitor) - Simple & Clean
  if (mode === "preview") {
    const pendingOrders = filteredOrders.filter((o) => o.status === "pending");
    const preparingOrders = filteredOrders.filter(
      (o) => o.status === "preparing"
    );
    const readyOrders = filteredOrders.filter((o) => o.status === "ready");

    const pendingPages = Math.max(1, Math.ceil(pendingOrders.length / previewPageSize));
    const preparingPages = Math.max(1, Math.ceil(preparingOrders.length / previewPageSize));
    const readyPages = Math.max(1, Math.ceil(readyOrders.length / previewPageSize));

    const activePendingPage = Math.min(pendingPage, pendingPages);
    const activePreparingPage = Math.min(preparingPage, preparingPages);
    const activeReadyPage = Math.min(readyPage, readyPages);

    const pagedPending = pendingOrders.slice((activePendingPage - 1) * previewPageSize, activePendingPage * previewPageSize);
    const pagedPreparing = preparingOrders.slice((activePreparingPage - 1) * previewPageSize, activePreparingPage * previewPageSize);
    const pagedReady = readyOrders.slice((activeReadyPage - 1) * previewPageSize, activeReadyPage * previewPageSize);

    return (
      <div className="min-h-screen bg-white p-6 lg:p-12">
        <div className="max-w-[1800px] mx-auto">
          {/* Preview Mode Header - Clean & Simple */}
          <div className="mb-8 flex justify-between items-center border-b-2 border-gray-200 pb-6">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold mb-3 text-gray-900">
                Live Order Tracking
              </h1>
              <p className="text-gray-600 text-xl lg:text-2xl font-medium">
                Real-time order status updates
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-5 py-3 bg-green-50 border-2 border-green-500 rounded-xl">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="text-green-600 font-bold text-base">LIVE</span>
              </div>
              <button
                onClick={() => setMode("working")}
                className="px-5 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold shadow-lg"
              >
                Back
              </button>
            </div>
          </div>

          {/* Status Sections - Clean Layout with Only Table Numbers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Pending Orders */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 border-4 border-yellow-300 shadow-2xl flex flex-col min-h-[550px] lg:min-h-[600px]">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-gray-200">
                  <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center border-2 border-yellow-300 flex-shrink-0">
                    <FaClock className="text-yellow-600" size={36} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl lg:text-3xl font-bold mb-1 text-gray-900 truncate">
                      Pending
                    </h2>
                    <p className="text-yellow-600 text-lg lg:text-xl font-bold truncate">
                      {pendingOrders.length}{" "}
                      {pendingOrders.length === 1 ? "order" : "orders"}
                    </p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 max-h-[45vh]" style={{ scrollbarWidth: 'thin' }}>
                  {pendingOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <FaClock className="text-gray-300 mx-auto mb-4" size={48} />
                      <p className="text-gray-500 text-lg font-medium">
                        No pending orders
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 pb-2">
                      {pagedPending.map((order) => (
                        <div
                          key={order.id}
                          className="bg-yellow-50 rounded-2xl p-2.5 sm:p-3.5 border-2 border-yellow-300 shadow-md hover:shadow-lg transition-all text-center flex flex-col justify-center min-w-0"
                        >
                          <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-yellow-700 mb-1 truncate" title={getTableLabelValue(order)}>
                            {getTableLabelValue(order)}
                          </div>
                          <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm font-semibold truncate">
                            {getTimeElapsed(order.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {pendingPages > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
                  <button
                    onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                    disabled={activePendingPage === 1}
                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-bold text-gray-500">
                    {activePendingPage} / {pendingPages}
                  </span>
                  <button
                    onClick={() => setPendingPage((p) => Math.min(pendingPages, p + 1))}
                    disabled={activePendingPage === pendingPages}
                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Preparing Orders */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 border-4 border-blue-300 shadow-2xl flex flex-col min-h-[550px] lg:min-h-[600px]">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-gray-200">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center border-2 border-blue-300 flex-shrink-0">
                    <FaSpinner className="text-blue-600 animate-spin" size={36} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl lg:text-3xl font-bold mb-1 text-gray-900 truncate">
                      Preparing
                    </h2>
                    <p className="text-blue-600 text-lg lg:text-xl font-bold truncate">
                      {preparingOrders.length}{" "}
                      {preparingOrders.length === 1 ? "order" : "orders"}
                    </p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 max-h-[45vh]" style={{ scrollbarWidth: 'thin' }}>
                  {preparingOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <FaSpinner className="text-gray-300 mx-auto mb-4 animate-spin" size={48} />
                      <p className="text-gray-500 text-lg font-medium">
                        No orders preparing
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 pb-2">
                      {pagedPreparing.map((order) => (
                        <div
                          key={order.id}
                          className="bg-blue-50 rounded-2xl p-2.5 sm:p-3.5 border-2 border-blue-300 shadow-md hover:shadow-lg transition-all text-center flex flex-col justify-center min-w-0"
                        >
                          <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-blue-700 mb-1 truncate" title={getTableLabelValue(order)}>
                            {getTableLabelValue(order)}
                          </div>
                          <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm font-semibold truncate">
                            {getTimeElapsed(order.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {preparingPages > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
                  <button
                    onClick={() => setPreparingPage((p) => Math.max(1, p - 1))}
                    disabled={activePreparingPage === 1}
                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-bold text-gray-500">
                    {activePreparingPage} / {preparingPages}
                  </span>
                  <button
                    onClick={() => setPreparingPage((p) => Math.min(preparingPages, p + 1))}
                    disabled={activePreparingPage === preparingPages}
                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            {/* Ready Orders */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 border-4 border-green-300 shadow-2xl flex flex-col min-h-[550px] lg:min-h-[600px]">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-gray-200">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center border-2 border-green-300 flex-shrink-0">
                    <FaCheckCircle className="text-green-600" size={36} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl lg:text-3xl font-bold mb-1 text-gray-900 truncate">
                      Ready
                    </h2>
                    <p className="text-green-600 text-lg lg:text-xl font-bold truncate">
                      {readyOrders.length}{" "}
                      {readyOrders.length === 1 ? "order" : "orders"}
                    </p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 max-h-[45vh]" style={{ scrollbarWidth: 'thin' }}>
                  {readyOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <FaCheckCircle className="text-gray-300 mx-auto mb-4" size={48} />
                      <p className="text-gray-500 text-lg font-medium">
                        No ready orders
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 pb-2">
                      {pagedReady.map((order) => (
                        <div
                          key={order.id}
                          className="bg-green-50 rounded-2xl p-2.5 sm:p-3.5 border-2 border-green-300 shadow-md hover:shadow-lg transition-all text-center flex flex-col justify-center min-w-0"
                        >
                          <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-green-700 mb-1 truncate" title={getTableLabelValue(order)}>
                            {getTableLabelValue(order)}
                          </div>
                          <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm font-semibold truncate">
                            {getTimeElapsed(order.created_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {readyPages > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
                  <button
                    onClick={() => setReadyPage((p) => Math.max(1, p - 1))}
                    disabled={activeReadyPage === 1}
                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-bold text-gray-500">
                    {activeReadyPage} / {readyPages}
                  </span>
                  <button
                    onClick={() => setReadyPage((p) => Math.min(readyPages, p + 1))}
                    disabled={activeReadyPage === readyPages}
                    className="px-3 py-1.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer - Restaurant Info */}
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-xl border-2 border-gray-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-gray-600 text-base lg:text-lg font-medium">
                Auto-refreshing every 10 seconds • Last updated:{" "}
                {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Working Mode - Admin Management View
  return (
    <div className="p-4 lg:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1 truncate">
              Running Orders
            </h1>
            <p className="text-gray-600 text-sm lg:text-base">
              View and manage all active orders
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setMode("preview")}
              className="hidden sm:flex flex-1 sm:flex-none whitespace-nowrap px-4 py-2.5 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-colors items-center justify-center gap-2 text-sm font-medium shadow-lg"
            >
              <FaTv size={16} /> <span className="sm:inline">Preview Mode</span>
            </button>
            <button
              onClick={() => router.push("/restaurant/orders/new")}
              className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
            >
              + New Order
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
          {[
            { label: "All", value: statusCounts.all, status: "all" },
            {
              label: "Preparing",
              value: statusCounts.active,
              status: "active",
              color: "indigo",
            },
            {
              label: "Ready",
              value: statusCounts.ready,
              status: "ready",
              color: "green",
            },
            {
              label: "Completed",
              value: statusCounts.completed,
              status: "completed",
              color: "gray",
            },
          ].map((stat) => (
            <button
              key={stat.status}
              onClick={() => setFilter(stat.status)}
              className={`bg-white rounded-xl p-3 sm:p-4 border-2 transition-all hover:shadow-lg ${filter === stat.status
                ? "border-indigo-500 shadow-md sm:shadow-lg"
                : "border-gray-200 hover:border-gray-300"
                }`}
            >
              <p className="text-[11px] sm:text-xs text-gray-600 mb-0.5 sm:mb-1 uppercase tracking-wider font-semibold">{stat.label}</p>
              <p
                className={`text-xl sm:text-2xl font-bold text-${stat.color || "gray"
                  }-600`}
              >
                {stat.value}
              </p>
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
            <div className="flex-1 max-w-md relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders"
                value={searchTerm}
                onChange={(e) => {
                  const cleanedVal = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "").trimStart();
                  setSearchTerm(cleanedVal);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
              {searchTerm.length > 0 && !searchTerm.trim() && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  Search query cannot be empty or only spaces.
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full sm:w-auto sm:justify-end">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 whitespace-nowrap select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyToday}
                    onChange={(e) => setOnlyToday(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                  />
                  Today Only
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 whitespace-nowrap select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyMine}
                    onChange={(e) => setShowOnlyMine(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                  />
                  My Orders
                </label>

                {mode === "working" ? (
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 whitespace-nowrap select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(el) => {
                        if (!el) return;
                        el.indeterminate = !allVisibleSelected && someVisibleSelected;
                      }}
                      onChange={(e) => setAllVisible(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                    />
                    Select visible ({selectedTokens.length} selected)
                  </label>
                ) : null}
              </div>

              {mode === "working" ? (
                <div className="flex items-center gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={handlePrintSelected}
                    disabled={selectedTokens.length === 0}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors text-sm font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaPrint size={14} />
                    Print Selected
                  </button>
                  {selectedTokens.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSelectedTokens([])}
                      className="inline-flex items-center justify-center px-4 py-2 bg-white text-gray-700 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="py-12">
            <RestaurantLoader
              variant="container"
              message="Loading orders..."
            />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 border border-gray-200 text-center">
            <p className="text-gray-500 text-lg">No orders found</p>
            <button
              onClick={() => router.push("/restaurant/orders/new")}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create New Order
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {pagedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-1 sm:mb-4 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedSet.has(String(order.order_token))}
                      onChange={() => toggleToken(order.order_token)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                      aria-label={`Select order ${order.order_token}`}
                    />
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                      {order.order_token}
                    </h3>
                    <span
                      className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border flex items-center gap-1 shrink-0 ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-2 shrink-0 ml-auto">
                    {String(order.status || "").toLowerCase() !== "completed" ? (
                      <button
                        onClick={() =>
                          router.push(
                            `/restaurant/orders/new?editToken=${encodeURIComponent(
                              order.order_token
                            )}`
                          )
                        }
                        disabled={String(order.status || "").toLowerCase() === "cancelled" || !!order.payment_status}
                        className={`p-2 rounded-lg transition-colors ${
                          String(order.status || "").toLowerCase() === "cancelled" || !!order.payment_status
                            ? "text-gray-300 cursor-not-allowed opacity-50 font-normal"
                            : "text-indigo-600 hover:bg-indigo-50 font-semibold"
                        }`}
                        title={
                          String(order.status || "").toLowerCase() === "cancelled"
                            ? "Cancelled orders cannot be edited"
                            : order.payment_status
                              ? "Order with generated bill cannot be edited"
                              : "Edit Order"
                        }
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                    ) : null}
                    {isAdmin &&
                      order.status !== "completed" &&
                      order.status !== "cancelled" ? (
                      <button
                        onClick={() =>
                          router.push(
                            `/restaurant/billing/add?token=${encodeURIComponent(
                              order.order_token
                            )}&table=${encodeURIComponent(
                              getTableLabelValue(order)
                            )}&total=${encodeURIComponent(
                              order.total_amount || 0
                            )}${order.customer_name
                              ? `&customer=${encodeURIComponent(
                                order.customer_name
                              )}`
                              : ""
                            }${order.customer_phone
                              ? `&phone=${encodeURIComponent(
                                order.customer_phone
                              )}`
                              : ""
                            }`
                          )
                        }
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Generate Bill"
                      >
                        <FaFileInvoice className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button
                      onClick={() =>
                        router.push(
                          `/restaurant/orders/receipt?token=${encodeURIComponent(
                            order.order_token
                          )}&table=${encodeURIComponent(
                            getTableLabelValue(order)
                          )}&total=${encodeURIComponent(
                            order.total_amount || 0
                          )}${order.customer_name
                            ? `&customer=${encodeURIComponent(
                              order.customer_name
                            )}`
                            : ""
                          }${order.customer_phone
                            ? `&phone=${encodeURIComponent(
                              order.customer_phone
                            )}`
                            : ""
                          }`
                        )
                      }
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Receipt"
                    >
                      <FaEye className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Details Grid - Now using full card width */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 pt-1 sm:pt-4 border-t border-gray-200">
                  <span>
                    <strong>Table:</strong> {getTableLabelValue(order)}
                  </span>
                  <span className="whitespace-nowrap">
                    <strong>Time:</strong> {formatOrderTime(order.created_at)}
                  </span>
                  <span>
                    <strong>Items:</strong>{" "}
                    {order.items_count || order.items?.length || 0}
                  </span>
                  <span>
                    <strong>Total:</strong> ₹
                    {order.total_amount?.toFixed(2) || "0.00"}
                  </span>
                  <div className="col-span-2">
                    <strong>Customer:</strong> {order.customer_name || "Guest"}
                  </div>
                  {order.taken_by_name ? (
                    <div className="col-span-2">
                      <strong>Taken By:</strong> {order.taken_by_name}
                    </div>
                  ) : order.is_self_order ? (
                    <div className="col-span-2">
                       <strong>Taken By:</strong> <span className="text-indigo-600 font-bold">Self Order</span>
                    </div>
                  ) : null}
                </div>

                {/* Order Items */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Items:
                    </h4>
                    <div className="max-h-32 overflow-y-auto pr-1 thin-scrollbar space-y-1.5">
                      {order.items.map((item, index) => (
                        <div key={index} className="text-sm text-gray-600 flex justify-between gap-2">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-semibold text-gray-900 shrink-0">
                            ₹{item.price?.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Actions - Only in Working Mode */}
                {order.status !== "completed" &&
                  order.status !== "cancelled" && (
                    <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                      {order.status === "pending" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "preparing")
                          }
                          className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === "preparing" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "ready")}
                          className="flex-1 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                        >
                          Mark as Ready
                        </button>
                      )}
                      {order.status === "ready" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(order.id, "completed")
                          }
                          className="flex-1 px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                        >
                          Mark as Completed
                        </button>
                      )}
                      {order.payment_status !== "Paid" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "cancelled")}
                          className="flex-1 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  )}
                {(order.status === "cancelled" || order.status === "completed") &&
                  null}
              </div>
            ))}
            </div>
            <PrevNextPager page={page} pages={pages} onPageChange={setPage} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}
