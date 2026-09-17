'use client';
import { FiSearch, FiRefreshCw } from "react-icons/fi";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, Trash2, FolderOpen, CheckCircle } from "lucide-react";
import BackButton from "@/components/BackButton";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import Pagination from "@/components/ui/Pagination";

export default function DraftInvoicesPage() {
  const [draftInvoices, setDraftInvoices] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftPage, setDraftPage] = useState(1);
  const [draftTotalPages, setDraftTotalPages] = useState(1);
  const [draftTotalCount, setDraftTotalCount] = useState(0);
  const [draftSearch, setDraftSearch] = useState("");
  const [draftCustomerName, setDraftCustomerName] = useState("");
  const [draftLimit, setDraftLimit] = useState(20);

  // Deletion states
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState(null);

  // Complete Draft states
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const [draftToComplete, setDraftToComplete] = useState(null);
  const [completeInvoiceNo, setCompleteInvoiceNo] = useState("");

  // ✅ FETCH DRAFT INVOICES
  const fetchDraftInvoices = async () => {
    setLoadingDrafts(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

      const queryParams = new URLSearchParams({
        page: draftPage,
        limit: draftLimit,
        ...(draftSearch && { search: draftSearch }),
        ...(draftCustomerName && { customer_name: draftCustomerName })
      });

      const response = await fetch(`${API_BASE}/api/draft-invoices/get-all-draft?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDraftInvoices(data.drafts || data.data || []);
        setDraftTotalCount(data.totalCount || data.total || 0);
        setDraftTotalPages(data.totalPages || Math.ceil((data.totalCount || data.total || 0) / draftLimit));
      } else {
        throw new Error('Failed to fetch draft invoices');
      }
    } catch (error) {
      console.error('Error fetching draft invoices:', error);
      toast.error('Failed to load draft invoices');
    } finally {
      setLoadingDrafts(false);
    }
  };

  // Navigate to edit draft page
  const loadDraftInvoice = (draftId) => {
    window.location.href = `/invoices/drafts/edit/${draftId}`;
  };

  const handleDeleteClick = (draftId) => {
    setDraftToDelete(draftId);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!draftToDelete) return;
    const draftId = draftToDelete;
    setShowConfirmDelete(false);
    setDraftToDelete(null);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

      const response = await fetch(`${API_BASE}/api/draft-invoices/delete-draft/${draftId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setDraftInvoices(prev => prev.filter(draft => draft.id !== draftId));
        setDraftTotalCount(prev => prev - 1);
        toast.error('Draft invoice deleted successfully');
        fetchDraftInvoices(); // Refresh the list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete draft invoice');
      }
    } catch (error) {
      console.error('Error deleting draft invoice:', error);
      toast.error('Failed to delete draft invoice: ' + error.message);
    }
  };

  // Complete draft (convert to regular invoice)
  const handleCompleteClick = (draftId, currentInvoiceNo) => {
    setDraftToComplete(draftId);
    setCompleteInvoiceNo(currentInvoiceNo || `INV-${draftId}`);
    setShowConfirmComplete(true);
  };

  const handleConfirmComplete = async () => {
    if (!draftToComplete) return;
    if (!completeInvoiceNo || completeInvoiceNo.trim() === '') {
      toast.error('Invoice number is required');
      return;
    }
    const draftId = draftToComplete;
    const invoiceNumber = completeInvoiceNo.trim();
    setShowConfirmComplete(false);
    setDraftToComplete(null);
    setCompleteInvoiceNo("");

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

      const response = await fetch(`${API_BASE}/api/draft-invoices/complete-draft/${draftId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoice_number: invoiceNumber
        })
      });

      if (response.ok) {
        toast.success('Draft invoice completed successfully!');
        setDraftInvoices(prev => prev.filter(draft => draft.id !== draftId));
        setDraftTotalCount(prev => prev - 1);
        fetchDraftInvoices(); // Refresh the list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete draft invoice');
      }
    } catch (error) {
      console.error('Error completing draft invoice:', error);
      toast.error('Failed to complete draft invoice: ' + error.message);
    }
  };

  // Effect to fetch drafts when filters change
  useEffect(() => {
    fetchDraftInvoices();
  }, [draftPage, draftSearch, draftCustomerName, draftLimit]);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-6 h-6 text-purple-600" />
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Draft Invoices</h1>
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
            {draftTotalCount} drafts
          </span>
        </div>
        <BackButton />
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search drafts"
              className="w-full pl-3 pr-10 py-2 border rounded-lg text-sm"
              value={draftSearch}
              onChange={(e) => {
                setDraftSearch(e.target.value.trimStart());
                setDraftPage(1);
              }}
            />
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <div>
            <input
              type="text"
              placeholder="Filter by customer name"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={draftCustomerName}
              onChange={(e) => {
                setDraftCustomerName(e.target.value.trimStart());
                setDraftPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mb-4 sm:mb-6">
        <div className="text-xs sm:text-sm text-gray-600">
          Showing {(draftPage - 1) * draftLimit + 1} - {Math.min(draftPage * draftLimit, draftTotalCount)} of {draftTotalCount} drafts
        </div>
      </div>

      {/* Drafts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loadingDrafts ? (
          <div className="flex justify-center items-center py-20">
            <FiRefreshCw className="w-6 h-6 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Loading drafts...</span>
          </div>
        ) : draftInvoices.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No draft invoices found</p>
            <p className="text-sm mt-1">Create and save a draft invoice to see it here</p>
            <Link href="/invoices/add" className="mt-4 inline-block">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Create New Invoice
              </button>
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Phone
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Date
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-2 sm:px-3 py-2 sm:py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {draftInvoices.map((draft, index) => (
                    <tr key={draft.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                        {(draftPage - 1) * draftLimit + index + 1}
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap font-medium">
                        {draft.customer_name || 'N/A'}
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                        {draft.customer_phone || '-'}
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                        {draft.invoice_date
                          ? new Date(draft.invoice_date).toLocaleDateString("en-GB")
                          : draft.createdAt
                            ? new Date(draft.createdAt).toLocaleDateString("en-GB")
                            : draft.created_at
                              ? new Date(draft.created_at).toLocaleDateString("en-GB")
                              : '-'}
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                        ₹{parseFloat(draft.total || 0).toFixed(2)}
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                        {draft.items && draft.items.length
                          ? draft.items.length
                          : draft.invoice_items && draft.invoice_items.length
                            ? draft.invoice_items.length
                            : draft.draft_items && draft.draft_items.length
                              ? draft.draft_items.length
                              : draft.item_count || 0}
                      </td>
                      <td className="px-2 sm:px-3 py-2 sm:py-4 whitespace-nowrap">
                        <div className="flex gap-2 sm:gap-3">
                          <button
                            onClick={() => loadDraftInvoice(draft.id)}
                            className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all"
                            title="Continue Editing"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCompleteClick(draft.id, draft.invoice_number)}
                            className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded bg-green-100 text-green-600 hover:bg-green-200 transition-all"
                            title="Complete Draft (Convert to Invoice)"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(draft.id)}
                            className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                            title="Delete Draft"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {draftInvoices.length > 0 && (
        <div className="mt-4 sm:mt-6">
          <Pagination
            currentPage={draftPage}
            totalPages={draftTotalPages}
            onPageChange={setDraftPage}
            itemsPerPage={draftLimit}
            onItemsPerPageChange={(newLimit) => {
              setDraftLimit(newLimit);
              setDraftPage(1);
            }}
          />
        </div>
      )}
      <ConfirmationDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Draft Invoice"
        description="Are you sure you want to delete this draft invoice? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      <ConfirmationDialog
        isOpen={showConfirmComplete}
        onClose={() => {
          setShowConfirmComplete(false);
          setDraftToComplete(null);
          setCompleteInvoiceNo("");
        }}
        onConfirm={handleConfirmComplete}
        title="Complete Draft"
        description="Please confirm or edit the invoice number to complete this draft invoice:"
        confirmText="Complete"
        cancelText="Cancel"
      >
        <div className="mt-3">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Invoice Number*</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
            placeholder="Enter Invoice Number"
            value={completeInvoiceNo}
            onChange={(e) => setCompleteInvoiceNo(e.target.value)}
          />
        </div>
      </ConfirmationDialog>
    </div>
  );
}

