"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaFire,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaUtensils,
  FaBell,
  FaRupeeSign,
  FaTable,
  FaArrowRight,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import RestaurantLoader from "@/components/RestaurantLoader";
import { getApiBase } from "@/utils/apiBase";
import AccessDenied from "@/components/AccessDenied";

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.error("Audio Context playback error:", e);
  }
};

export default function KitchenDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sortOrder, setSortOrder] = useState("oldest"); // newest, oldest
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  const [pendingPage, setPendingPage] = useState(1);
  const [preparingPage, setPreparingPage] = useState(1);
  const [prevPendingCount, setPrevPendingCount] = useState(0);
  const kitchenPageSize = 4;

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
      const isChef = ["chef", "cook", "kitchen"].includes(role);

      const allowed = isOwner || isChef;
      setHasAccess(allowed);
      setAccessChecked(true);

      if (!allowed) return;

      loadKitchenOrders();
      // Refresh orders every 15 seconds for real-time updates
      const interval = setInterval(loadKitchenOrders, 15000);
      return () => clearInterval(interval);
    } catch {
      setHasAccess(false);
      setAccessChecked(true);
    }
  }, []);

  useEffect(() => {
    // Play notification sound for new orders
    const pendingCount = orders.filter((o) => o.status === "pending").length;
    if (soundEnabled && pendingCount > prevPendingCount) {
      playNotificationSound();
    }
    setPrevPendingCount(pendingCount);
  }, [orders, soundEnabled, prevPendingCount]);

  const loadKitchenOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();

      // Load only pending and preparing orders
      const response = await fetch(
        `${API_BASE}/api/restaurant/orders?status=pending,preparing&date=today`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading kitchen orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();

      const response = await fetch(`${API_BASE}/api/restaurant/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        loadKitchenOrders();
      } else {
        // Update local state
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus, updated_at: new Date().toISOString() } : order
          )
        );
      }
    } catch (error) {
      console.error("Error updating order status:", error);
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

  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const pendingOrders = sortedOrders.filter((o) => o.status === "pending");
  const preparingOrders = sortedOrders.filter((o) => o.status === "preparing");

  const pendingPages = Math.max(1, Math.ceil(pendingOrders.length / kitchenPageSize));
  const preparingPages = Math.max(1, Math.ceil(preparingOrders.length / kitchenPageSize));

  const activePendingPage = Math.min(pendingPage, pendingPages);
  const activePreparingPage = Math.min(preparingPage, preparingPages);

  const pagedPending = pendingOrders.slice((activePendingPage - 1) * kitchenPageSize, activePendingPage * kitchenPageSize);
  const pagedPreparing = preparingOrders.slice((activePreparingPage - 1) * kitchenPageSize, activePreparingPage * kitchenPageSize);

  const groupItemsByCategory = (items) => {
    const grouped = {};
    items.forEach((item) => {
      const category = item.category || "Other";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                  <FaFire className="text-white" size={22} />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Kitchen Dashboard</h1>
                  <p className="text-gray-600 text-sm md:text-base mt-0.5">Manage and prepare active orders</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => setSortOrder(sortOrder === "oldest" ? "newest" : "oldest")}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
              >
                {sortOrder === "oldest" ? (
                  <FaChevronUp className="text-indigo-500" size={16} />
                ) : (
                  <FaChevronDown className="text-indigo-500" size={16} />
                )}
                <span>{sortOrder === "oldest" ? "Oldest First" : "Newest First"}</span>
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium border ${soundEnabled
                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
              >
                <FaBell className={soundEnabled ? "text-green-600" : "text-gray-400"} size={16} />
                <span className="hidden sm:inline">{soundEnabled ? "Sound ON" : "Sound OFF"}</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-5">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left">
                <div>
                  <p className="text-[10px] sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1 leading-tight">Pending</p>
                  <p className="text-lg sm:text-3xl font-bold text-yellow-600">{pendingOrders.length}</p>
                </div>
                <div className="hidden sm:flex w-12 h-12 bg-yellow-50 rounded-xl items-center justify-center">
                  <FaClock className="text-yellow-600 text-xl" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-5">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left">
                <div>
                  <p className="text-[10px] sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1 leading-tight">Preparing</p>
                  <p className="text-lg sm:text-3xl font-bold text-blue-600">{preparingOrders.length}</p>
                </div>
                <div className="hidden sm:flex w-12 h-12 bg-blue-50 rounded-xl items-center justify-center">
                  <FaSpinner className="text-blue-600 text-xl animate-spin" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-5">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left">
                <div>
                  <p className="text-[10px] sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1 leading-tight">Total</p>
                  <p className="text-lg sm:text-3xl font-bold text-gray-900">{orders.length}</p>
                </div>
                <div className="hidden sm:flex w-12 h-12 bg-indigo-50 rounded-xl items-center justify-center">
                  <FaUtensils className="text-indigo-600 text-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="py-12">
            <RestaurantLoader
              variant="container"
              message="Loading kitchen orders..."
            />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-5xl text-green-500" />
            </div>
            <p className="text-gray-700 text-lg font-semibold mb-2">No active orders</p>
            <p className="text-gray-500 text-sm">All caught up! Great job! 👏</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 items-stretch">
            {/* Pending Orders */}
            {pendingOrders.length > 0 && (
              <div className="flex flex-col justify-between h-full space-y-4">
                <div className="space-y-4 flex-grow">
                  <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-2.5 sm:p-4 mb-3 sm:mb-4">
                    <h2 className="text-sm sm:text-lg font-bold text-gray-900 flex items-center gap-1.5">
                      <FaClock className="text-yellow-600" size={18} />
                      <span className="truncate">New Orders</span>
                      <span className="ml-auto px-2 py-0.5 sm:px-3 sm:py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm font-semibold flex-shrink-0">
                        {pendingOrders.length}
                      </span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-2">
                    {pagedPending.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onStatusUpdate={updateOrderStatus}
                        getTimeElapsed={getTimeElapsed}
                        groupItemsByCategory={groupItemsByCategory}
                        priority="pending"
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex-shrink-0">
                  <button
                    onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                    disabled={activePendingPage === 1}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-bold text-gray-500">
                    {activePendingPage} / {pendingPages}
                  </span>
                  <button
                    onClick={() => setPendingPage((p) => Math.min(pendingPages, p + 1))}
                    disabled={activePendingPage === pendingPages}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Preparing Orders */}
            {preparingOrders.length > 0 && (
              <div className="flex flex-col justify-between h-full space-y-4">
                <div className="space-y-4 flex-grow">
                  <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-2.5 sm:p-4 mb-3 sm:mb-4">
                    <h2 className="text-sm sm:text-lg font-bold text-gray-900 flex items-center gap-1.5">
                      <FaSpinner className="text-blue-600 animate-spin" size={18} />
                      <span className="truncate">In Progress</span>
                      <span className="ml-auto px-2 py-0.5 sm:px-3 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-semibold flex-shrink-0">
                        {preparingOrders.length}
                      </span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-2">
                    {pagedPreparing.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onStatusUpdate={updateOrderStatus}
                        getTimeElapsed={getTimeElapsed}
                        groupItemsByCategory={groupItemsByCategory}
                        priority="preparing"
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex-shrink-0">
                  <button
                    onClick={() => setPreparingPage((p) => Math.max(1, p - 1))}
                    disabled={activePreparingPage === 1}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-bold text-gray-500">
                    {activePreparingPage} / {preparingPages}
                  </span>
                  <button
                    onClick={() => setPreparingPage((p) => Math.min(preparingPages, p + 1))}
                    disabled={activePreparingPage === preparingPages}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Empty States */}
            {pendingOrders.length === 0 && preparingOrders.length === 0 && (
              <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-4" />
                <p className="text-gray-700 text-lg font-semibold mb-2">No active orders</p>
                <p className="text-gray-500 text-sm">All caught up! Great job! 👏</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Order Card Component
function OrderCard({
  order,
  onStatusUpdate,
  getTimeElapsed,
  groupItemsByCategory,
  priority,
}) {
  const [expanded, setExpanded] = useState(true);
  const groupedItems = groupItemsByCategory(order.items || []);

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border transition-all ${priority === "pending"
        ? "border-yellow-300 hover:border-yellow-400 hover:shadow-md"
        : "border-blue-300 hover:border-blue-400 hover:shadow-md"
        }`}
    >
      {/* Header */}
      <div
        className="p-2 sm:p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start gap-1 sm:gap-4">
          <div className="flex-1 min-w-0">
            {/* Token + Status */}
            <h3 className="text-xs sm:text-base font-bold text-gray-900 truncate mb-1">
              {order.order_token}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-block px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded text-[9px] sm:text-xs font-semibold ${priority === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-800"
                  }`}
              >
                {order.status.toUpperCase()}
              </span>
            </div>

            {/* Meta — stacked on mobile */}
            <div className="mt-1.5 sm:mt-2 space-y-0.5 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3 sm:text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <FaTable className="text-gray-400 flex-shrink-0" size={14} />
                <span className="text-[10px] sm:text-sm font-semibold truncate">T-{order.table_number}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaClock className="text-gray-400 flex-shrink-0" size={14} />
                <span className="text-[10px] sm:text-sm truncate">{getTimeElapsed(order.created_at)}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <FaRupeeSign className="text-gray-400 flex-shrink-0" size={14} />
                <span className="text-[10px] sm:text-sm font-semibold">{order.total_amount?.toFixed(0)}</span>
              </div>
              {order.customer_name && (
                 <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded-full">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <span className="text-[9px] sm:text-[11px] font-bold text-gray-700 truncate max-w-[80px]">
                        {order.customer_name}
                    </span>
                 </div>
              )}
              {order.is_self_order && (
                 <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-full">
                    <span className="text-[9px] sm:text-[10px] text-indigo-700 font-bold whitespace-nowrap">
                        Taken By: Self Order
                    </span>
                 </div>
              )}
              {order.taken_by_name && !order.is_self_order && (
                 <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-full">
                    <span className="text-[9px] sm:text-[10px] text-gray-600 font-medium whitespace-nowrap">
                        By: {order.taken_by_name}
                    </span>
                 </div>
              )}
            </div>
          </div>
 
          {/* Collapse toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="flex-shrink-0 w-5 h-5 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors mt-0.5"
          >
            {expanded
              ? <FaChevronUp className="text-gray-400" size={14} />
              : <FaChevronDown className="text-gray-400" size={14} />}
          </button>
        </div>
      </div>
 
      {/* Items */}
      {expanded && (
        <div className="px-2 sm:px-5 pb-2 sm:pb-5 border-t border-gray-100">
          <div className="pt-2 sm:pt-4 space-y-2 sm:space-y-4">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category}>
                <h4 className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase mb-1.5 sm:mb-3 tracking-wide">
                  {category}
                </h4>
                <div className="space-y-1 sm:space-y-2">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <span className="font-bold text-[10px] sm:text-sm text-indigo-600 flex-shrink-0">
                        {item.quantity}×
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-900 font-medium block text-[10px] sm:text-sm leading-tight break-words whitespace-normal">
                          {item.name}
                        </span>
                        {item.notes && (
                          <span className="text-[9px] sm:text-xs text-gray-400 italic block break-words whitespace-normal">
                            {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
 
          {/* Actions */}
          <div className="mt-2 sm:mt-5 pt-2 sm:pt-4 border-t border-gray-200">
            {order.status === "pending" && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusUpdate(order.id, "preparing"); }}
                className="w-full py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-1.5 shadow-sm text-[10px] sm:text-sm"
              >
                <FaSpinner className="flex-shrink-0 animate-spin" size={14} />
                <span className="hidden sm:inline">Start Preparing</span>
                <span className="sm:hidden">Prepare</span>
              </button>
            )}
            {order.status === "preparing" && (
              <button
                onClick={(e) => { e.stopPropagation(); onStatusUpdate(order.id, "ready"); }}
                className="w-full py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-1.5 shadow-sm text-[10px] sm:text-sm"
              >
                <FaCheckCircle className="flex-shrink-0" size={14} />
                <span className="hidden sm:inline">Mark as Ready</span>
                <span className="sm:hidden">Ready</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

