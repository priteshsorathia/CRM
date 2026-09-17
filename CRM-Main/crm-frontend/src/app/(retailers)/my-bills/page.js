'use client';

import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { FiPlus, FiFilter, FiSearch } from "react-icons/fi";
import { Eye, Trash2, Edit, Check, ChevronDown } from "lucide-react";
import DatePicker from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import Pagination from "@/components/ui/Pagination";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function PurchaseBillsPage() {

    const [bills, setBills] = useState([]);
    const [lendedBills, setLendedBills] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    const [filters, setFilters] = useState({
        search: "",
        dateFrom: "",
        dateTo: "",
        paymentMode: "",
    });
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);
    const [lendedSearchTerm, setLendedSearchTerm] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [billToDelete, setBillToDelete] = useState(null);
    const [isMarkPaidDialogOpen, setIsMarkPaidDialogOpen] = useState(false);
    const [billToMarkPaid, setBillToMarkPaid] = useState(null);

    /* ---------------- Helpers ---------------- */
    const getToken = () =>
        typeof window !== "undefined"
            ? localStorage.getItem("authToken") || localStorage.getItem("token")
            : null;

    const getShopId = () => {
        if (typeof window === "undefined") return null;

        const shopId = localStorage.getItem("shopId");
        if (shopId) return shopId;

        const currentShop = localStorage.getItem("currentShop");
        if (currentShop) {
            try {
                const parsed = JSON.parse(currentShop);
                return parsed.id || parsed.shopId || null;
            } catch {
                return currentShop;
            }
        }

        const userData = localStorage.getItem("userData");
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                return parsed?.shop?.id || null;
            } catch {
                return null;
            }
        }

        return null;
    };

    /* ---------------- Fetch Purchase Bills ---------------- */
    useEffect(() => {
        const fetchBills = async () => {
            try {
                const token = getToken();
                const shopId = getShopId();
                if (!token || !shopId) return;

                const params = new URLSearchParams({
                    shopId,
                    page: currentPage,
                    limit: itemsPerPage,
                });

                if (filters.search) params.set("search", filters.search);
                if (filters.paymentMode) params.set("paymentMode", filters.paymentMode);
                if (filters.dateFrom) {
                    const start = new Date(filters.dateFrom);
                    start.setHours(0, 0, 0, 0);
                    params.set("startDate", start.toISOString());
                }
                if (filters.dateTo) {
                    const end = new Date(filters.dateTo);
                    end.setHours(23, 59, 59, 999);
                    params.set("endDate", end.toISOString());
                }

                const res = await fetch(
                    `${API_BASE}/api/bill/get-bills/shop?${params.toString()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) {
                    console.error("Failed to fetch purchase bills");
                    return;
                }

                const json = await res.json();

                setBills(json.data || []);
                setTotalCount(json.pagination?.totalRecords || 0);
                setTotalPages(json.pagination?.totalPages || 1);
            } catch (err) {
                console.error("Purchase bill fetch error:", err);
            }
        };

        fetchBills();
    }, [currentPage, itemsPerPage, filters]);

    /* ---------------- Fetch Lended / Udhar Bills ---------------- */
    useEffect(() => {
        const fetchLendedBills = async () => {
            try {
                const token = getToken();
                const shopId = getShopId();
                if (!token || !shopId) return;

                const params = new URLSearchParams({ shopId });

                const res = await fetch(
                    `${API_BASE}/api/bill/get-udhar-bills/shop?${params.toString()}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) {
                    console.error("Failed to fetch lended (udhar) bills");
                    return;
                }

                const json = await res.json();

                setLendedBills(json.data || []);
            } catch (err) {
                console.error("Lended bill fetch error:", err);
            }
        };

        fetchLendedBills();
    }, [filters]);

    /* ---------------- Delete Bill ---------------- */
    const confirmDelete = (id) => {
        setBillToDelete(id);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!billToDelete) return;
        const id = billToDelete;
        setIsDeleteDialogOpen(false);

        try {
            const token = getToken();
            if (!token) {
                toast.error("Please login again");
                return;
            }

            const res = await fetch(
                `${API_BASE}/api/bill/delete-bill/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to delete bill");
                return;
            }

            setBills((prev) => prev.filter((b) => b.id !== id));
            setTotalCount((prev) => Math.max(0, prev - 1));
            toast.error("Purchase bill deleted successfully");
        } catch (err) {
            console.error("Delete bill error:", err);
            toast.error("Server error while deleting bill");
        }
    };

    /* ---------------- Mark Bill Paid ---------------- */
    const confirmMarkPaid = (id) => {
        setBillToMarkPaid(id);
        setIsMarkPaidDialogOpen(true);
    };

    const handleMarkPaid = async () => {
        if (!billToMarkPaid) return;
        const id = billToMarkPaid;
        setIsMarkPaidDialogOpen(false);

        try {
            const token = getToken();
            if (!token) {
                toast.error("Please login again");
                return;
            }

            const res = await fetch(
                `${API_BASE}/api/bill/purchase-bills/${id}/mark-paid`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        paymentMode: "upi",
                        note: `Paid via UPI on ${new Date().toLocaleDateString()}`,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to mark bill as paid");
                return;
            }

            // Update local state for immediate UI feedback
            setBills((prev) => prev.map((b) => (b.id === id ? { ...b, paymentMode: data.paymentMode || "UPI", paymentStatus: data.paymentStatus || "Paid" } : b)));
            setLendedBills((prev) => prev.map((b) => (b.id === id ? { ...b, paymentMode: data.paymentMode || "UPI", paymentStatus: data.paymentStatus || "Paid" } : b)));

            toast.success("Bill marked as paid");
        } catch (err) {
            console.error("Mark paid error:", err);
            toast.error("Server error while marking bill paid");
        }
    };

    const filteredLendedBills = lendedBills.filter(bill => {
        const searchLower = lendedSearchTerm.toLowerCase();
        const supplierMatch = (bill.supplierName || bill.customerName || "").toLowerCase().includes(searchLower);
        const billNoMatch = (bill.billNumber || "").toLowerCase().includes(searchLower);
        return supplierMatch || billNoMatch;
    });

    /* ---------------- UI ---------------- */
    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Purchase Bills</h1>
                <div className="w-full sm:w-auto">
                    <Link href="/my-bills/add" className="w-full sm:w-auto">
                        <button className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all font-bold text-sm shadow-lg shadow-blue-100 active:scale-95">
                            <FiPlus className="shrink-0" />
                            <span className="whitespace-nowrap">Add Purchase Bill</span>
                        </button>
                    </Link>
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
                                placeholder="Search supplier or bill number"
                                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={filters.search}
                                onChange={(e) =>
                                    setFilters(prev => ({ ...prev, search: e.target.value.trimStart() }))
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Date From
                                </label>
                                <DatePicker
                                    placeholder="Select date"
                                    options={{ dateFormat: "d-m-Y" }}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={filters.dateFrom}
                                    onChange={([d]) => setFilters(prev => ({ ...prev, dateFrom: d }))}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Date To
                                </label>
                                <DatePicker
                                    placeholder="Select date"
                                    options={{ dateFormat: "d-m-Y" }}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    value={filters.dateTo}
                                    onChange={([d]) => setFilters(prev => ({ ...prev, dateTo: d }))}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                                    Payment Method
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-none appearance-none pr-8"
                                        value={filters.paymentMode}
                                        onChange={(e) => {
                                            setFilters(prev => ({ ...prev, paymentMode: e.target.value }));
                                            setIsPaymentDropdownOpen(false);
                                        }}
                                        onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
                                        onBlur={() => setIsPaymentDropdownOpen(false)}
                                    >
                                        <option value="">All Payments</option>
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CARD">Card</option>
                                        <option value="BANK_TRANSFER">Bank</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isPaymentDropdownOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Date</th>
                            <th className="px-4 py-3 text-left">Supplier</th>
                            <th className="px-4 py-3 text-left">Bill No</th>
                            <th className="px-4 py-3 text-left">Amount</th>
                            <th className="px-4 py-3 text-left">Payment</th>
                            <th className="px-4 py-3 text-left">View Image</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {bills.map((bill, idx) => (
                            <tr key={bill.id} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    {(currentPage - 1) * itemsPerPage + idx + 1}
                                </td>
                                <td className="px-4 py-3">
                                    {new Date(bill.billDate).toLocaleDateString("en-GB")}
                                </td>
                                <td className="px-4 py-3">{bill.supplierName}</td>
                                <td className="px-4 py-3">{bill.billNumber || "-"}</td>
                                <td className="px-4 py-3 font-semibold">
                                    ₹{Number(bill.totalAmount || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 capitalize">
                                    {bill.paymentMode ? bill.paymentMode.replace(/_/g, ' ') : "-"}
                                </td>
                                <td className="px-4 py-3">
                                    {bill.billFileUrl ? (
                                        <a
                                            href={`${process.env.NEXT_PUBLIC_API_URL}${bill.billFileUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:underline"
                                        >
                                            View File
                                        </a>
                                    ) : (
                                        "-"
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 flex gap-2">
                                    <Link
                                        href={`/my-bills/${bill.id}`}
                                        className="w-8 h-8 flex items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                                        title="View"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Link>

                                    <Link
                                        href={`/my-bills/edit/${bill.id}`}
                                        className="w-8 h-8 flex items-center justify-center rounded bg-gray-50 text-gray-600 hover:bg-gray-100"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>

                                    <button
                                        onClick={() => confirmDelete(bill.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded bg-red-50 text-red-600 hover:bg-red-100"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Empty State */}
                {bills.length === 0 && (
                    <div className="py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                        <span className="text-4xl mb-3">📦</span>
                        <span className="text-sm font-medium">No purchase bills recorded</span>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 mb-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={(size) => {
                            setItemsPerPage(size);
                            setCurrentPage(1); // reset to page 1 on limit change
                        }}
                    />
                </div>
            )}

            {/* Lended / Udhar Bills */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                <div className="p-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h2 className="text-lg font-semibold whitespace-nowrap">Lended Bills (Udhar)</h2>
                    <div className="relative w-full sm:max-w-xs">
                        <input
                            type="text"
                            placeholder="Search supplier or bill no..."
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            value={lendedSearchTerm}
                            onChange={(e) => setLendedSearchTerm(e.target.value.trimStart())}
                        />
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                    </div>
                </div>

                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Date</th>
                            <th className="px-4 py-3 text-left">Supplier</th>
                            <th className="px-4 py-3 text-left">Bill No</th>
                            <th className="px-4 py-3 text-left">Amount</th>
                            <th className="px-4 py-3 text-left">Payment</th>
                            <th className="px-4 py-3 text-left">View Image</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredLendedBills.map((bill, idx) => (
                            <tr key={bill.id || idx} className="border-t hover:bg-gray-50">
                                <td className="px-4 py-3">{idx + 1}</td>
                                <td className="px-4 py-3">{bill.billDate ? new Date(bill.billDate).toLocaleDateString("en-GB") : "-"}</td>
                                <td className="px-4 py-3">{bill.supplierName || bill.customerName || "-"}</td>
                                <td className="px-4 py-3">{bill.billNumber || "-"}</td>
                                <td className="px-4 py-3 font-semibold">₹{Number(bill.totalAmount || 0).toFixed(2)}</td>
                                <td className="px-4 py-3 capitalize">{bill.paymentMode ? bill.paymentMode.replace(/_/g, ' ') : "-"}</td>
                                <td className="px-4 py-3">
                                    {bill.billFileUrl ? (
                                        <a
                                            href={`${process.env.NEXT_PUBLIC_API_URL}${bill.billFileUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:underline"
                                        >
                                            View File
                                        </a>
                                    ) : (
                                        "-"
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 flex gap-2">
                                    <button
                                        onClick={() => confirmMarkPaid(bill.id)}
                                        className="w-8 h-8 flex items-center justify-center rounded bg-green-50 text-green-600 hover:bg-green-100"
                                        title="Mark Paid"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredLendedBills.length === 0 && (
                    <div className="py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                        <span className="text-4xl mb-3">🤝</span>
                        <span className="text-sm font-medium">No lended (udhar) bills found</span>
                    </div>
                )}
            </div>

            <ConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setBillToDelete(null);
                }}
                onConfirm={handleDelete}
                title="Delete Purchase Bill"
                description="Are you sure you want to delete this purchase bill? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />

            <ConfirmationDialog
                isOpen={isMarkPaidDialogOpen}
                onClose={() => {
                    setIsMarkPaidDialogOpen(false);
                    setBillToMarkPaid(null);
                }}
                onConfirm={handleMarkPaid}
                title="Mark Bill as Paid"
                description="Are you sure you want to mark this bill as paid?"
                confirmText="Mark Paid"
                cancelText="Cancel"
            />
        </div>
    );
}
