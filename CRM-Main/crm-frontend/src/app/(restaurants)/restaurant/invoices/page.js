'use client';
import { useSidebar } from "@/app/(restaurants)/context/SidebarContext";
import { toast } from "sonner";
import { FiSearch, FiPlus, FiDownload, FiFilter, FiRefreshCw, FiCalendar, FiChevronDown } from "react-icons/fi";
import DatePicker from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Printer, Trash2, FolderOpen } from "lucide-react";
import RestaurantLoader from "@/components/RestaurantLoader";
import { getApiBase } from "@/utils/apiBase";
import AccessDenied from "@/components/AccessDenied";
import ConfirmationDialog from "@/components/ConfirmationDialog";

const API_BASE = getApiBase();

const getDisplayTable = (tableNum, orderToken) => {
  const clean = String(tableNum || "").trim();
  if (!clean || clean === "-" || clean === "—") {
    if (orderToken && (orderToken.includes("Take away") || orderToken.includes("Takeaway"))) {
      return "Take away";
    }
    return "—";
  }
  return clean;
};

export default function RestaurantInvoicesPage() {
  const { collapsed, mobileOpen } = useSidebar();
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState(null);
  const [showTrash, setShowTrash] = useState(false);
  const [trashInvoices, setTrashInvoices] = useState([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [openSelectId, setOpenSelectId] = useState(null);
  const [isSortByOpen, setIsSortByOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: null,
  });

  const triggerConfirm = (title, description, onConfirm) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 15;


  const [filters, setFilters] = useState({
    search: "",
    sortBy: "newest",
    dateFrom: new Date(),
    dateTo: new Date(),
    userId: "",
  });

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
        role.endsWith("_owner") ||
        role === "manager" ||
        role === "restaurant_manager";

      setHasAccess(isOwner);
      setAccessChecked(true);
    } catch {
      setHasAccess(false);
      setAccessChecked(true);
    }
  }, []);


  const loadInvoices = async () => {
    if (!accessChecked || !hasAccess) return;
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");

      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", limit);
      if (filters.search) params.append("search", filters.search.trim());
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.dateFrom) params.append("dateFrom", new Date(filters.dateFrom).toISOString());
      if (filters.dateTo) params.append("dateTo", new Date(filters.dateTo).toISOString());

      const response = await fetch(`${API_BASE}/api/restaurant/invoices?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.totalCount || 0);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to load invoices");
        setInvoices([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("Error loading invoices:", err);
      setError("Failed to load invoices");
      setInvoices([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessChecked && hasAccess) {
      loadInvoices();
    }
  }, [currentPage, filters, accessChecked, hasAccess]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.sortBy, filters.dateFrom, filters.dateTo, filters.userId]);

  const loadDeletedInvoices = async () => {
    if (!accessChecked || !hasAccess) return;
    try {
      setLoadingTrash(true);
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/restaurant/invoices/trash`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTrashInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error("Error loading trash:", err);
      toast.error("Failed to load trash");
    } finally {
      setLoadingTrash(false);
    }
  };

  useEffect(() => {
    if (showTrash && accessChecked && hasAccess) {
      loadDeletedInvoices();
    }
  }, [showTrash, accessChecked, hasAccess]);

  useEffect(() => {
    if (showTrash) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape") setShowTrash(false);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [showTrash]);

  const handleRestoreInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/restaurant/invoices/${invoiceId}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Invoice restored successfully");
        loadDeletedInvoices();
        loadInvoices();
      } else {
        toast.error("Failed to restore invoice");
      }
    } catch (err) {
      console.error("Error restoring invoice:", err);
      toast.error("Failed to restore invoice");
    }
  };

  const handlePermanentDeleteInvoice = (invoiceId) => {
    triggerConfirm(
      "Permanently Delete Invoice",
      <span className="text-rose-600 font-semibold">Are you sure? This invoice will be permanently removed!</span>,
      async () => {
        try {
          const token = localStorage.getItem("authToken") || localStorage.getItem("token");
          const response = await fetch(`${API_BASE}/api/restaurant/invoices/${invoiceId}/permanent`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            toast.error("Invoice permanently deleted", {
              style: {
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fca5a5'
              }
            });
            loadDeletedInvoices();
          } else {
            toast.error("Failed to delete invoice");
          }
        } catch (err) {
          console.error("Error deleting invoice:", err);
          toast.error("Failed to delete invoice");
        }
      }
    );
  };

  const deleteInvoice = (invoiceId) => {
    triggerConfirm(
      "Delete Invoice",
      <span className="text-rose-600 font-semibold">Are you sure you want to delete this invoice?</span>,
      async () => {
        try {
          const token = localStorage.getItem("authToken") || localStorage.getItem("token");
          const response = await fetch(`${API_BASE}/api/restaurant/invoices/${invoiceId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
            toast.error('Bill moved to trash', {
              style: {
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fca5a5'
              }
            });
            loadDeletedInvoices();
          } else {
            const errorData = await response.json().catch(() => ({}));
            toast.error(errorData.error || "Failed to delete invoice");
          }
        } catch (err) {
          console.error("Error deleting invoice:", err);
          toast.error("Failed to delete invoice");
        }
      }
    );
  };

  // Add initial trash load to show count
  useEffect(() => {
    if (accessChecked && hasAccess) {
      loadDeletedInvoices();
    }
  }, [accessChecked, hasAccess]);

  const updatePaymentStatus = async (invoiceId, payment_status) => {
    const prev = invoices.find((inv) => inv.id === invoiceId);
    const prevStatus = prev?.payment_status;

    try {
      setUpdatingInvoiceId(invoiceId);
      setInvoices((curr) =>
        curr.map((inv) =>
          inv.id === invoiceId ? { ...inv, payment_status } : inv
        )
      );

      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/restaurant/invoices/${invoiceId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payment_status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update payment status");
      }

      const data = await response.json().catch(() => ({}));
      const updated = data.invoice;
      if (updated?.id) {
        setInvoices((curr) => curr.map((inv) => (inv.id === updated.id ? updated : inv)));
      }

      toast.success("Payment status updated");
    } catch (err) {
      console.error("Error updating payment status:", err);
      setInvoices((curr) =>
        curr.map((inv) =>
          inv.id === invoiceId ? { ...inv, payment_status: prevStatus } : inv
        )
      );
      toast.error(err?.message || "Failed to update payment status");
    } finally {
      setUpdatingInvoiceId(null);
    }
  };

  const printInvoice = (invoiceId) => {
    router.push(`/restaurant/billing/${invoiceId}`);
  };

  const downloadInvoice = (invoiceId) => {
    printInvoice(invoiceId);
  };

  const dateToOptions = useMemo(() => {
    const options = { dateFormat: "d-m-Y", maxDate: new Date() };
    if (filters.dateFrom) {
      options.minDate = filters.dateFrom;
    }
    return options;
  }, [filters.dateFrom]);

  const handleDateFromChange = (date) => {
    setFilters({ ...filters, dateFrom: date[0] });
    if (date[0] && filters.dateTo && date[0] > filters.dateTo) {
      setFilters((prev) => ({ ...prev, dateTo: "" }));
    }
  };

  const applyFilters = () => {
    setCurrentPage(1);
  };

  const resetFilters = () =>
    setFilters({
      search: "",
      sortBy: "newest",
      dateFrom: new Date(),
      dateTo: new Date(),
      userId: "",
    });


  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RestaurantLoader variant="container" message="Verifying access..." />
      </div>
    );
  }

  if (!hasAccess) {
    return <AccessDenied homeHref="/restaurant/tables" homeLabel="Go to Tables" message="This page is restricted to Shop Owners and Managers only." />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Restaurant Billing</h1>
              <p className="text-gray-600 text-sm md:text-base">Manage and view all restaurant bills</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setShowTrash(true)}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm shadow-sm"
              >
                <Trash2 className="text-rose-500 w-4 h-4" />
                <span>Trash</span>
                {trashInvoices.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold">
                    {trashInvoices.length}
                  </span>
                )}
              </button>
              <Link
                href="/restaurant/billing/add"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm flex items-center gap-2"
              >
                <FiPlus className="text-base" />
                New Bill
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search invoices"
                    value={filters.search}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\./g, '');
                      if (val === ' ' || (val.trim() === '' && val.length > 0)) {
                        setFilters({ ...filters, search: '' });
                      } else {
                        setFilters({ ...filters, search: val });
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <DatePicker
                    value={filters.dateFrom}
                    onChange={handleDateFromChange}
                    options={{
                      dateFormat: "d-m-Y",
                      enableTime: false,
                      maxDate: new Date()
                    }}
                    placeholder="Select date"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <DatePicker
                    value={filters.dateTo}
                    onChange={(date) => setFilters({ ...filters, dateTo: date[0] })}
                    options={{ ...dateToOptions, enableTime: false }}
                    placeholder="Select date"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <div className="relative">
                  <select
                    value={filters.sortBy}
                    onFocus={() => setIsSortByOpen(true)}
                    onBlur={() => setIsSortByOpen(false)}
                    onChange={(e) => {
                      setFilters({ ...filters, sortBy: e.target.value });
                      setIsSortByOpen(false);
                    }}
                    className="w-full appearance-none bg-none bg-no-repeat pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount_high">Amount: High to Low</option>
                    <option value="amount_low">Amount: Low to High</option>
                  </select>
                  <FiChevronDown className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 ${isSortByOpen ? "rotate-180" : ""}`} />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <FiFilter className="text-base" />
                Apply Filters
              </button>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                Reset
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <FiRefreshCw className="text-base" />
                Refresh
              </button>

            </div>
          </div>
        </div>

        {/* Billing Table */}
        {loading ? (
          <div className="py-12">
            <RestaurantLoader variant="container" message="Loading invoices..." />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FolderOpen className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-semibold mb-2">No bills found</p>
            <p className="text-gray-500 text-sm mb-4">Get started by creating your first bill</p>
            <Link
              href="/restaurant/billing/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              <FiPlus className="text-base" />
              Create Bill
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Bill #</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer/Table</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{invoice.invoice_number}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="min-w-[160px]">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {invoice.customer_name || "—"}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              Table: {getDisplayTable(invoice.table_number, invoice.order_token)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {new Date(invoice.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">₹{parseFloat(invoice.total || 0).toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                            {invoice.payment_method || "Cash"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="relative inline-block">
                            <select
                              value={invoice.payment_status || "Unpaid"}
                              onFocus={() => setOpenSelectId(invoice.id)}
                              onBlur={() => setOpenSelectId(null)}
                              onChange={(e) => {
                                updatePaymentStatus(invoice.id, e.target.value);
                                setOpenSelectId(null);
                              }}
                              disabled={updatingInvoiceId === invoice.id}
                              className={`appearance-none bg-none bg-no-repeat pr-9 pl-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${(invoice.payment_status || "Unpaid") === "Paid"
                                ? "bg-green-50 text-green-800 border-green-200"
                                : (invoice.payment_status || "Unpaid") === "Partial"
                                  ? "bg-yellow-50 text-yellow-800 border-yellow-200"
                                  : "bg-red-50 text-red-800 border-red-200"
                                } ${updatingInvoiceId === invoice.id
                                  ? "opacity-60 cursor-not-allowed"
                                  : "hover:bg-white"
                                }`}
                              title="Change payment status"
                            >
                              <option value="Unpaid">Unpaid</option>
                              <option value="Paid">Paid</option>
                            </select>
                            <FiChevronDown className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-current opacity-70 transition-all duration-200 ${openSelectId === invoice.id ? "rotate-180" : ""}`} />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/restaurant/billing/view/${invoice.id}`}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => printInvoice(invoice.id)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Print"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteInvoice(invoice.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {currentPage} of {totalPages} ({totalCount} total invoices)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* Trash Modal */}
      {showTrash && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Billing Trash</h2>
                  <p className="text-xs sm:text-sm text-gray-500">Restore or permanently remove deleted bills</p>
                </div>
              </div>
              <button
                onClick={() => setShowTrash(false)}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
              >
                <FiPlus className="rotate-45" size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loadingTrash ? (
                <div className="py-20 text-center">
                  <RestaurantLoader variant="container" message="Checking trash..." />
                </div>
              ) : trashInvoices.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <Trash2 className="text-gray-300" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Trash is currently empty</h3>
                  <p className="text-gray-500 max-w-xs mx-auto text-sm mt-1">Deleted bills will appear here before they are permanently removed.</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left">Bill #</th>
                        <th className="px-4 py-3 text-left">Customer/Table</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {trashInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 font-medium text-gray-900">{inv.invoice_number}</td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-gray-900">{inv.customer_name}</div>
                            <div className="text-[10px] text-gray-500">Table: {getDisplayTable(inv.table_number, inv.order_token)}</div>
                          </td>
                          <td className="px-4 py-4 font-bold text-gray-900">₹{parseFloat(inv.total || 0).toFixed(2)}</td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRestoreInvoice(inv.id)}
                                className="w-9 h-9 flex items-center justify-center text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-100"
                                title="Restore Bill"
                              >
                                <FiRefreshCw size={16} />
                              </button>
                              <button
                                onClick={() => handlePermanentDeleteInvoice(inv.id)}
                                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100"
                                title="Delete Permanently"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Confirm"
        cancelText="Cancel"
        zIndexClass="z-[110]"
      />
    </div>
  );
}
