'use client';

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
    FiSearch,
    FiFilter,
    FiPlus,
} from "react-icons/fi";
import { Calendar, Trash2, Edit, Eye, ChevronDown } from "lucide-react";
import DatePicker from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import Pagination from "@/components/ui/Pagination";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function ExpensePage() {

    const [expenses, setExpenses] = useState([]);

    // Dashboard stats
    const [stats, setStats] = useState({
        totalToday: 0,
        totalThisMonth: 0,
        totalThisYear: 0,
        countThisMonth: 0,
        averagePerEntryMonth: 0,
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [limit, setLimit] = useState(10);

    // Filters
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: "",
        dateFrom: "",
        dateTo: "",
        category: "",
        paymentMethod: "",
    });

    // Deletion states
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);

    const [isOpenCategory, setIsOpenCategory] = useState(false);
    const [isOpenPayment, setIsOpenPayment] = useState(false);

    const dateToOptions = useMemo(() => {
        const options = { dateFormat: "d-m-Y" }; // Removed maxDate constraint
        if (filters.dateFrom) {
            options.minDate = filters.dateFrom;
        }
        return options;
    }, [filters.dateFrom]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleDateFromChange = (date) => {
        const dateFrom = date[0] || "";
        setFilters((prev) => {
            const nextFilters = { ...prev, dateFrom };
            if (dateFrom && prev.dateTo && dateFrom > prev.dateTo) {
                nextFilters.dateTo = "";
            }
            return nextFilters;
        });
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({
            search: "",
            dateFrom: "",
            dateTo: "",
            category: "",
            paymentMethod: "",
        });
        setCurrentPage(1);
        setIsOpenCategory(false);
        setIsOpenPayment(false);
    };

    const getToken = () => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("authToken") || localStorage.getItem("token");
        }
        return null;
    };

    // Fetch dashboard stats
    const fetchDashboard = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch(`${API_BASE}/api/expenses/get-expense-dashboard`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) return;

            const data = await res.json();
            const dashboard = data.data || data;

            // Map API response:
            // todayTotal, monthTotal, yearTotal, averagePerEntryMonth, monthEntryCount
            setStats({
                totalToday: dashboard.todayTotal || 0,
                totalThisMonth: dashboard.monthTotal || 0,
                totalThisYear: dashboard.yearTotal || 0,
                countThisMonth: dashboard.monthEntryCount || 0,
                averagePerEntryMonth: dashboard.averagePerEntryMonth || 0,
            });
        } catch (err) {
            console.error("Error fetching expense dashboard:", err);
        }
    };

    const formatDateToYYYYMMDD = (date) => {
        if (!date) return "";
        try {
            const d = new Date(date);
            if (isNaN(d.getTime())) return "";
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch {
            return "";
        }
    };

    // Fetch expenses list
    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const token = getToken();
                if (!token) return;

                const queryParams = new URLSearchParams({
                    page: String(currentPage),
                    limit: String(limit),
                });

                const trimmedSearch = filters.search.trim();
                if (trimmedSearch) queryParams.set("search", trimmedSearch);
                if (filters.category) queryParams.set("category", filters.category);
                if (filters.paymentMethod)
                    queryParams.set("paymentMode", filters.paymentMethod);
                if (filters.dateFrom)
                    queryParams.set("dateFrom", formatDateToYYYYMMDD(filters.dateFrom));
                if (filters.dateTo)
                    queryParams.set("dateTo", formatDateToYYYYMMDD(filters.dateTo));

                const res = await fetch(
                    `${API_BASE}/api/expenses/get-all-expense?${queryParams.toString()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) {
                    console.error("Failed to fetch expenses:", await res.text());
                    return;
                }

                const data = await res.json();

                // API shape:
                // {
                //   success: true,
                //   data: [ ...expenses ],
                //   summary: { totalAmount },
                //   pagination: { total, pages, currentPage }
                // }
                const list = data.data || data.expenses || [];
                const pagination = data.pagination || {};

                setExpenses(list);
                setTotalCount(pagination.total || list.length || 0);
                setTotalPages(pagination.pages || 1);
            } catch (err) {
                console.error("Error fetching expenses:", err);
            }
        };

        fetchExpenses();
        fetchDashboard();
    }, [
        currentPage,
        limit,
        filters.search,
        filters.category,
        filters.paymentMethod,
        filters.dateFrom,
        filters.dateTo,
    ]);

    const handleDelete = (id) => {
        setExpenseToDelete(id);
        setShowConfirmDelete(true);
    };

    const handleConfirmDelete = async () => {
        if (!expenseToDelete) return;
        const id = expenseToDelete;
        setShowConfirmDelete(false);
        setExpenseToDelete(null);

        try {
            const token = getToken();
            if (!token) {
                toast.error("No authentication token found. Please login again.");
                return;
            }

            const res = await fetch(
                `${API_BASE}/api/expenses/delete-expense/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!res.ok) {
                console.error("Failed to delete expense:", await res.text());
                toast.error("Failed to delete expense");
                return;
            }

            setExpenses((prev) => prev.filter((exp) => exp.id !== id));
            setTotalCount((prev) => Math.max(0, prev - 1));
            toast.error("Expense deleted successfully");
            fetchDashboard();
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Failed to delete expense");
        }
    };

    const formatCurrency = (val) => {
        if (!val) return "0.00";
        if (val >= 100000) {
            return new Intl.NumberFormat('en-IN', { notation: "compact", maximumFractionDigits: 2 }).format(val);
        }
        return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    };

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Shop Expenses
                </h1>
                <div className="w-full sm:w-auto">
                    <Link href="/expense/add" className="w-full sm:w-auto">
                        <button className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-blue-100 active:scale-95">
                            <FiPlus className="shrink-0" />
                            <span>Add Expense</span>
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 sm:p-4 shadow-sm">
                    <div className="text-[11px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1 truncate font-medium">
                        Today&apos;s Expense
                    </div>
                    <div className="text-base sm:text-xl font-bold text-blue-700 truncate" title={`₹${stats.totalToday.toLocaleString('en-IN')}`}>
                        ₹{formatCurrency(stats.totalToday)}
                    </div>
                    <div className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">
                        All expenses today
                    </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 sm:p-4 shadow-sm">
                    <div className="text-[11px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1 truncate font-medium">
                        <span className="sm:hidden">This Month</span>
                        <span className="hidden sm:inline">This Month&apos;s Expense</span>
                    </div>
                    <div className="text-base sm:text-xl font-bold text-emerald-700 truncate" title={`₹${stats.totalThisMonth.toLocaleString('en-IN')}`}>
                        ₹{formatCurrency(stats.totalThisMonth)}
                    </div>
                    <div className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">
                        {stats.countThisMonth} entries this month
                    </div>
                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-xl p-2.5 sm:p-4 shadow-sm">
                    <div className="text-[11px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1 truncate font-medium">
                        <span className="sm:hidden">This Year</span>
                        <span className="hidden sm:inline">This Year&apos;s Expense</span>
                    </div>
                    <div className="text-base sm:text-xl font-bold text-purple-700 truncate" title={`₹${stats.totalThisYear.toLocaleString('en-IN')}`}>
                        ₹{formatCurrency(stats.totalThisYear)}
                    </div>
                    <div className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">
                        Overview for year
                    </div>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-xl p-2.5 sm:p-4 shadow-sm">
                    <div className="text-[11px] sm:text-sm text-gray-600 mb-0.5 sm:mb-1 truncate font-medium">
                        <span className="sm:hidden">Avg Per Entry</span>
                        <span className="hidden sm:inline">Average Per Entry (Month)</span>
                    </div>
                    <div className="text-base sm:text-xl font-bold text-orange-700 truncate" title={`₹${(stats.countThisMonth ? (stats.totalThisMonth / stats.countThisMonth) : 0).toLocaleString('en-IN')}`}>
                        ₹{formatCurrency(stats.countThisMonth ? (stats.totalThisMonth / stats.countThisMonth) : 0)}
                    </div>
                    <div className="text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">
                        Per record this month
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5 mb-4 sm:mb-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Search & Toggle Row */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search by note, category, or amount"
                                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={filters.search}
                                onChange={(e) =>
                                    handleFilterChange("search", e.target.value.trimStart())
                                }
                            />
                            <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                        </div>
                        
                        {/* Mobile Toggle Button */}
                        <button 
                            type="button"
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className={`sm:hidden p-2.5 rounded-xl border transition-all ${showMobileFilters ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-700'}`}
                        >
                            <FiFilter className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Filters grid */}
                    <div className={`${showMobileFilters ? 'block' : 'hidden'} sm:block space-y-4 animate-in fade-in slide-in-from-top-2 duration-200`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Date From */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Date From
                                </label>
                                <DatePicker
                                    options={{ dateFormat: "d-m-Y" }}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={filters.dateFrom}
                                    onChange={handleDateFromChange}
                                    placeholder="Select date"
                                />
                            </div>

                            {/* Date To */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Date To
                                </label>
                                <DatePicker
                                    options={dateToOptions}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={filters.dateTo}
                                    onChange={([date]) => handleFilterChange("dateTo", date || "")}
                                    placeholder="Select date"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Category
                                </label>
                                <div className="relative">
                                    <select
                                        className="peer w-full px-3 py-2 pr-10 bg-none bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                                        value={filters.category}
                                        onClick={() => setIsOpenCategory(!isOpenCategory)}
                                        onBlur={() => setIsOpenCategory(false)}
                                        onChange={(e) => {
                                            handleFilterChange("category", e.target.value);
                                            setIsOpenCategory(false);
                                        }}
                                    >
                                        <option value="">All Categories</option>
                                        <option value="Rent">Rent</option>
                                        <option value="Salary">Salary</option>
                                        <option value="Utilities">Utilities</option>
                                        <option value="Purchase">Purchase</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpenCategory ? "rotate-180" : "rotate-0"}`} />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Payment Method
                                </label>
                                <div className="relative">
                                    <select
                                        className="peer w-full px-3 py-2 pr-10 bg-none bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer"
                                        value={filters.paymentMethod}
                                        onClick={() => setIsOpenPayment(!isOpenPayment)}
                                        onBlur={() => setIsOpenPayment(false)}
                                        onChange={(e) => {
                                            handleFilterChange("paymentMethod", e.target.value);
                                            setIsOpenPayment(false);
                                        }}
                                    >
                                        <option value="">All</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpenPayment ? "rotate-180" : "rotate-0"}`} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filter buttons */}
                        <div className="flex gap-2 pt-2 justify-end">
                            <button
                                onClick={resetFilters}
                                className="w-full sm:w-auto px-6 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition flex items-center justify-center"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    <span>
                        Showing {(currentPage - 1) * limit + 1} -{" "}
                        {Math.min(currentPage * limit, totalCount)} of {totalCount} expense
                        records
                    </span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                                    #
                                </th>
                                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                    Description
                                </th>
                                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                    Payment
                                </th>
                                <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {expenses.map((exp, index) => (
                                <tr key={exp.id} className="hover:bg-gray-50">
                                    <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                                        {(currentPage - 1) * limit + index + 1}
                                    </td>
                                    <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                                        {exp.expenseDate || exp.expense_date
                                            ? new Date(
                                                exp.expenseDate || exp.expense_date
                                            ).toLocaleDateString("en-GB")
                                            : "-"}
                                    </td>
                                    <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap capitalize">
                                        {exp.category || "-"}
                                    </td>
                                    <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap hidden sm:table-cell truncate max-w-[150px]">
                                        {exp.description || "-"}
                                    </td>
                                    <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap font-medium">
                                        ₹{Number(exp.amount || 0).toFixed(2)}
                                    </td>
                                    <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap hidden sm:table-cell capitalize">
                                        {exp.paymentMode || exp.payment_mode || "-"}
                                    </td>
                                    <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap flex gap-2 sm:gap-3">
                                        {/* View detail */}
                                        <Link
                                            href={`/expense/${exp.id}`}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200"
                                            title="View"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Link>
                                        {/* Edit */}
                                        <Link
                                            href={`/expense/edit/${exp.id}`}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all duration-200"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(exp.id)}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Empty state */}
            {expenses.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center mt-4">
                    <div className="text-gray-400 text-5xl mb-3">💸</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">
                        No expenses recorded
                    </h3>
                    <p className="text-gray-500 mb-4 text-sm">
                        Start tracking your shop expenses to monitor profitability.
                    </p>
                    <Link href="/expense/add">
                        <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-bold shadow-lg shadow-blue-100 active:scale-95">
                            Add First Expense
                        </button>
                    </Link>
                </div>
            )}

            {/* Pagination */}
            {expenses.length > 0 && (
                <div className="mt-4 sm:mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={limit}
                        onItemsPerPageChange={(newLimit) => {
                            setLimit(newLimit);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            )}
            
            <ConfirmationDialog
                isOpen={showConfirmDelete}
                onClose={() => {
                    setShowConfirmDelete(false);
                    setExpenseToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Delete Expense"
                description="Are you sure you want to delete this expense? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </div>
    );
} 