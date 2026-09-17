"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    FaClipboardList,
    FaChair,
    FaClock,
    FaCheckCircle,
    FaSpinner,
    FaUtensils,
    FaFire,
    FaArrowRight,
    FaRupeeSign,
    FaShoppingCart,
    FaTable,
    FaMobileAlt,
    FaChartBar,
    FaUsers,
} from "react-icons/fa";
import RestaurantLoader from "@/components/RestaurantLoader";
import { getApiBase } from "@/utils/apiBase";

export default function MyDashboard() {
    const router = useRouter();
    const INR = "\u20B9";
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeCard, setActiveCard] = useState("myOrders");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [allOrders, setAllOrders] = useState([]);
    const [attendanceData, setAttendanceData] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        todayOrders: 0,
        todayRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        recentOrders: [],
        topSellingItems: [],
    });

    useEffect(() => {
        try {
            const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
            const u = rawUser ? JSON.parse(rawUser) : null;
            if (!u) {
                router.replace("/login");
                return;
            }
            setCurrentUser(u);
            const role = String(u?.role || u?.user_role || u?.user?.role || "").toLowerCase();
            const isAdmin =
                role === "admin" ||
                role === "administrator" ||
                role === "owner" ||
                role === "shop_owner" ||
                role === "restaurant_owner" ||
                role.endsWith("_owner");

            if (isAdmin) {
                router.replace("/restaurant");
                return;
            }

        } catch {
            router.replace("/login");
        }

        loadDashboardData();
        // Refresh every 30 seconds
        const intervalId = setInterval(loadDashboardData, 30000);
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeCard]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("authToken") || localStorage.getItem("token");
            const API_BASE = getApiBase();

            // Get current user info for filtering
            const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
            const u = rawUser ? JSON.parse(rawUser) : null;
            const myName = String(u?.name || u?.user_name || u?.user?.name || "").trim();

            const pad2 = (n) => String(n).padStart(2, "0");
            const now = new Date();
            const todayYmd = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
            const todayStr = now.toDateString();

            // Fetch orders, invoices, attendance and tables (if manager)
            const fetchPromises = [
                fetch(`${API_BASE}/api/restaurant/orders?date=today`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).catch(() => null),
                fetch(
                    `${API_BASE}/api/restaurant/invoices?dateFrom=${encodeURIComponent(
                        todayYmd
                    )}&dateTo=${encodeURIComponent(todayYmd)}&limit=500`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                ).catch(() => null),
                fetch(`${API_BASE}/api/hrms/attendance?date=${todayYmd}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(() => null),
            ];


            const [ordersRes, invoicesRes, attendanceRes] = await Promise.all(fetchPromises);

            let orders = [];
            let invoices = [];

            if (ordersRes?.ok) {
                const ordersData = await ordersRes.json();
                orders = ordersData.orders || [];
            }

            if (invoicesRes?.ok) {
                const invoicesData = await invoicesRes.json();
                invoices = invoicesData.invoices || [];
            }

            if (attendanceRes?.ok) {
                const attendanceJson = await attendanceRes.json();
                const records = attendanceJson.data || [];
                // Filter for current user match
                const myNameNorm = myName.toLowerCase();
                const record = records.find(r =>
                    String(r.user_name || r.full_name || "").toLowerCase() === myNameNorm
                );
                setAttendanceData(record || null);
            }


            // Filter data for the current user ("My Data")
            const myOrders = orders.filter(
                (o) =>
                    String(o.taken_by_name || "").trim().toLowerCase() === myName.toLowerCase() ||
                    String(o.staff_name || "").trim().toLowerCase() === myName.toLowerCase()
            );


            // Normalize status
            const normalizedMyOrders = myOrders.map((o) => ({
                ...o,
                _status: (o.status || "").toLowerCase(),
            }));

            // Invoices filtering - assuming invoices might have table_number or order reference
            // but let's try to match by normalized name if available or just use orders' revenue
            // Actually, many invoices might not have staff name explicitly in the same way, 
            // but let's see if we can derive revenue from orders directly for Staff Dashboard.

            const todayCompletedMyOrders = normalizedMyOrders.filter(
                (o) => o._status === "completed"
            );

            const myRevenue = todayCompletedMyOrders.reduce(
                (sum, o) => sum + (Number(o.total_amount || 0) || 0),
                0
            );

            const pendingOrdersCount = normalizedMyOrders.filter(
                (o) => o._status === "pending" || o._status === "preparing"
            ).length;

            const completedOrdersCount = todayCompletedMyOrders.length;

            // Recent orders I took
            const recentOrders = [...normalizedMyOrders]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 10);

            // Calculate my top selling items
            const itemMap = {};
            todayCompletedMyOrders.forEach((order) => {
                const items = order.items || [];
                items.forEach((item) => {
                    if (!item.name) return;
                    if (!itemMap[item.name]) {
                        itemMap[item.name] = 0;
                    }
                    itemMap[item.name] += Number(item.quantity || 1);
                });
            });

            const topSellingItems = Object.entries(itemMap)
                .map(([name, quantity]) => ({ name, quantity }))
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            setAllOrders(normalizedMyOrders);
            setDashboardData({
                todayOrders: normalizedMyOrders.length,
                todayRevenue: myRevenue,
                pendingOrders: pendingOrdersCount,
                completedOrders: completedOrdersCount,
                recentOrders,
                topSellingItems,
            });
        } catch (error) {
            console.error("Error loading staff dashboard data:", error);
        } finally {
            setLoading(false);
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
            default:
                return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const orderDate = new Date(date);
        const diff = Math.floor((now - orderDate) / 1000 / 60); // minutes
        if (diff < 1) return "Just now";
        if (diff < 60) return `${diff} min ago`;
        const hours = Math.floor(diff / 60);
        return `${hours} hr ${diff % 60} min ago`;
    };

    if (loading && !dashboardData.recentOrders.length) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RestaurantLoader variant="container" message="Loading your dashboard..." />
            </div>
        );
    }

    const listItems = (() => {
        switch (activeCard) {
            case "pending":
                return allOrders.filter(o => o._status === "pending" || o._status === "preparing");
            case "completed":
            case "sales":
                return allOrders.filter(o => o._status === "completed");
            default:
                return dashboardData.recentOrders;
        }
    })();

    const paginatedItems = listItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(listItems.length / itemsPerPage) || 1;

    return (
        <div className="p-4 lg:p-5 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-4 lg:mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                                My Dashboard
                            </h1>
                            <div className="flex items-center gap-4 mt-2 mb-2">
                                <p className="text-gray-600 text-xs lg:text-sm">
                                    Hello {currentUser?.name || "Member"}! Here's your activity for today.
                                </p>
                                {attendanceData && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
                                        <div className={`w-2 h-2 rounded-full ${attendanceData.status === 'present' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tight">
                                            Punch: {attendanceData.check_in || '--'} - {attendanceData.check_out || '--'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => router.push("/restaurant/orders/new")}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold text-sm shadow-lg hover:shadow-indigo-200 active:scale-95"
                        >
                            <FaShoppingCart size={14} /> New Order
                        </button>
                    </div>
                </div>


                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
                    {/* Total Orders Taken By Me */}
                    <button
                        onClick={() => setActiveCard("myOrders")}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${activeCard === "myOrders" ? "bg-indigo-50 border-indigo-600 ring-2 ring-indigo-100" : "bg-indigo-50/40 border-indigo-100 hover:border-indigo-300"}`}
                    >
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-indigo-100/50 rounded-lg flex items-center justify-center shrink-0">
                                    <FaClipboardList className="text-indigo-600" size={18} />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 leading-none">{dashboardData.todayOrders}</p>
                            </div>
                            <p className="text-indigo-600/70 text-[10px] font-bold uppercase tracking-widest ml-12 leading-none">Total Orders</p>
                        </div>
                    </button>

                    {/* Sales Generated By Me */}
                    <button
                        onClick={() => setActiveCard("sales")}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${activeCard === "sales" ? "bg-green-50 border-green-600 ring-2 ring-green-100" : "bg-green-50/40 border-green-100 hover:border-green-300"}`}
                    >
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-green-100/50 rounded-lg flex items-center justify-center shrink-0">
                                    <FaRupeeSign className="text-green-600" size={16} />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 leading-none">{INR}{dashboardData.todayRevenue.toFixed(0)}</p>
                            </div>
                            <p className="text-green-600/70 text-[10px] font-bold uppercase tracking-widest ml-12 leading-none">My Sales</p>
                        </div>
                    </button>

                    {/* Pending Orders I took */}
                    <button
                        onClick={() => setActiveCard("pending")}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${activeCard === "pending" ? "bg-yellow-50 border-yellow-600 ring-2 ring-yellow-100" : "bg-yellow-50/40 border-yellow-100 hover:border-yellow-300"}`}
                    >
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-yellow-100/50 rounded-lg flex items-center justify-center shrink-0">
                                    <FaSpinner className={`text-yellow-600 ${dashboardData.pendingOrders > 0 ? 'animate-spin' : ''}`} size={18} />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 leading-none">{dashboardData.pendingOrders}</p>
                            </div>
                            <p className="text-yellow-600/70 text-[10px] font-bold uppercase tracking-widest ml-12 leading-none">My Pending</p>
                        </div>
                    </button>

                    {/* Completed Orders I took */}
                    <button
                        onClick={() => setActiveCard("completed")}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${activeCard === "completed" ? "bg-green-50 border-green-600 ring-2 ring-green-100" : "bg-green-50/40 border-green-100 hover:border-green-300"}`}
                    >
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-green-100/50 rounded-lg flex items-center justify-center shrink-0">
                                    <FaCheckCircle className="text-green-600" size={18} />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 leading-none">{dashboardData.completedOrders}</p>
                            </div>
                            <p className="text-green-600/70 text-[10px] font-bold uppercase tracking-widest ml-12 leading-none">My Completed</p>
                        </div>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Main List Column */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FaUtensils className="text-gray-400" />
                                <h2 className="font-bold text-gray-900">
                                    {activeCard === "pending" ? "My Pending Orders" : activeCard === "completed" ? "My Completed Orders" : "My Recent Orders"}
                                </h2>
                            </div>
                            <button
                                onClick={() => router.push("/restaurant/orders")}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                            >
                                View All
                            </button>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {paginatedItems.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    <FaClipboardList className="mx-auto mb-3 opacity-20" size={48} />
                                    <p>No orders found in this category</p>
                                </div>
                            ) : (
                                paginatedItems.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => router.push(`/restaurant/orders/receipt?token=${item.order_token}`)}
                                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <span className="font-bold text-gray-900">{item.order_token}</span>
                                                <span className="ml-2 text-xs text-gray-500">
                                                    {item.table_number ? `Table ${item.table_number}` : item.platform || "Dine-In"}
                                                </span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(item._status)}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                            <span>{getTimeAgo(item.created_at)}</span>
                                            <span className="font-bold text-gray-900">₹{item.total_amount?.toFixed(0)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="px-3 py-1 text-xs font-bold text-indigo-600 disabled:opacity-30"
                                >
                                    Prev
                                </button>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="px-3 py-1 text-xs font-bold text-indigo-600 disabled:opacity-30"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Quick Actions & Top Items */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <h2 className="font-bold text-gray-900 mb-4">My Best Performers</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => router.push("/restaurant/orders/new")}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-blue-600 hover:shadow-md transition-all group bg-blue-50/30"
                                >
                                    <FaShoppingCart className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" size={24} />
                                    <span className="text-xs font-bold text-gray-900">New Order</span>
                                </button>
                                <button
                                    onClick={() => router.push("/restaurant/orders")}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-indigo-600 hover:shadow-md transition-all group bg-indigo-50/30"
                                >
                                    <FaClipboardList className="text-indigo-600 mb-2 group-hover:scale-110 transition-transform" size={24} />
                                    <span className="text-xs font-bold text-gray-900">Running Orders</span>
                                </button>
                                <button
                                    onClick={() => router.push("/restaurant/tables")}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-purple-600 hover:shadow-md transition-all group bg-purple-50/30"
                                >
                                    <FaTable className="text-purple-600 mb-2 group-hover:scale-110 transition-transform" size={24} />
                                    <span className="text-xs font-bold text-gray-900">Tables</span>
                                </button>
                                <button
                                    onClick={() => router.push("/restaurant/hrms")}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 hover:border-teal-600 hover:shadow-md transition-all group bg-teal-50/30"
                                >
                                    <FaUsers className="text-teal-600 mb-2 group-hover:scale-110 transition-transform" size={24} />
                                    <span className="text-xs font-bold text-gray-900 text-center">HRMS / Attendance</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <FaChartBar className="text-gray-400" />
                                <h2 className="font-bold text-gray-900">My Top Selling Items</h2>
                            </div>
                            <div className="space-y-4">
                                {dashboardData.topSellingItems.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
                                ) : (
                                    dashboardData.topSellingItems.map((item, idx) => (
                                        <div key={idx} className="space-y-1.5">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-gray-700">{item.name}</span>
                                                <span className="font-bold text-gray-900">{item.quantity} sold</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${(item.quantity / dashboardData.topSellingItems[0].quantity) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
