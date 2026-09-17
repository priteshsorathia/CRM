'use client';
import { useState, useEffect, useCallback } from "react";
import StockTable from "./components/StockTable";
import StockFilter from "./components/StockFilter";
import Link from "next/link";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import BackButton from "@/components/BackButton";
import { useShop } from "@/context/ShopContext";

export default function StockManagementPage() {
  const { currentShop } = useShop();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [itemFilter, setItemFilter] = useState("");
  const [stockTypeFilter, setStockTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [stockEntries, setStockEntries] = useState([]);
  const [filtersData, setFiltersData] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const shopId = currentShop?.id;

  // Get authentication token
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  };

  // Fetch stock entries with filters
  const fetchStockEntries = useCallback(async () => {
    if (!shopId) return;

    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add filters
      if (searchTerm) params.append('search', searchTerm);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (itemFilter) params.append('itemId', itemFilter);
      if (stockTypeFilter) params.append('stockType', stockTypeFilter);
      if (sortBy) params.append('sortBy', sortBy);
      
      // Add pagination
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/stock/${shopId}?${params.toString()}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`Failed to fetch stock entries: ${response.status}`);
      }
      
      const result = await response.json();

      if (result.success) {
        setStockEntries(result.data || []);
        setFiltersData(result.filters || { items: [] });
        setTotalCount(result.pagination?.total || 0);
        setTotalPages(result.pagination?.pages || 0);
      } else {
        throw new Error(result.error || 'Failed to fetch stock entries');
      }
      
    } catch (error) {
      setError(error.message);
      setStockEntries([]);
      setFiltersData({ items: [] });
    } finally {
      setLoading(false);
    }
  }, [shopId, searchTerm, dateFrom, dateTo, itemFilter, stockTypeFilter, sortBy, currentPage, itemsPerPage]);

  // Initial data fetch
  useEffect(() => {
    if (shopId) {
      fetchStockEntries();
    }
  }, [shopId, fetchStockEntries]);

  // Debounced search effect
  useEffect(() => {
    if (!shopId) return;

    const timerId = setTimeout(() => {
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timerId);
  }, [searchTerm, shopId]);

  // Effect for other filters (with debounce)
  useEffect(() => {
    if (!shopId) return;
    
    const timerId = setTimeout(() => {
      fetchStockEntries();
    }, 300);

    return () => clearTimeout(timerId);
  }, [dateFrom, dateTo, itemFilter, stockTypeFilter, sortBy, currentPage, itemsPerPage]);

  // Effect for when search triggers page reset
  useEffect(() => {
    if (currentPage === 1 && shopId) {
      const timerId = setTimeout(() => {
        fetchStockEntries();
      }, 300);

      return () => clearTimeout(timerId);
    }
  }, [currentPage, shopId, fetchStockEntries]);

  // Manual refresh function
  const handleRefresh = () => {
    fetchStockEntries();
  };

  const applyFilters = () => {
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setItemFilter("");
    setStockTypeFilter("");
    setSortBy("newest");
    setCurrentPage(1);
  };

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  // Handle Enter key in search - immediate search
  const handleSearchSubmit = () => {
    setCurrentPage(1);
  };

  if (!shopId) {
    return (
      <div>
        <div className="text-center py-8">
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Shop Selected</h2>
          <p className="text-gray-500 mb-4">Please select a shop to view stock.</p>
        </div>
      </div>
    );
  }
 
  if (loading && stockEntries.length === 0) {
    return (
      <div>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading stock entries...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Stock Management</h1>
        </div>
        <BackButton forceFallback={true} fallbackUrl="/inventory" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-800 text-sm">
            <strong>Error:</strong> {error}
          </p>
          <button 
            onClick={handleRefresh}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <StockFilter
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        itemFilter={itemFilter}
        setItemFilter={setItemFilter}
        stockTypeFilter={stockTypeFilter}
        setStockTypeFilter={setStockTypeFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        applyFilters={handleSearchSubmit}
        resetFilters={resetFilters}
        shopId={shopId}
        filtersData={filtersData}
        loading={loading}
      />

      {/* Info and Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex w-full sm:w-auto">
          <Link href="/inventory/stock/add" className="w-full sm:w-auto">
            <button className="w-full px-3 sm:px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100 flex items-center justify-center gap-2 font-bold text-[11px] sm:text-sm">
              <FiPlus className="shrink-0" />
              <span className="whitespace-nowrap">Add Entry</span>
            </button>
          </Link>
        </div>

        <div className="text-[11px] sm:text-sm text-gray-400 font-bold uppercase tracking-widest w-full text-center sm:text-right sm:w-auto mt-2 sm:mt-0">
          Showing {stockEntries.length} of {totalCount} records
          {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
        </div>
      </div>

      {/* Stock Table */}
      {stockEntries.length > 0 ? (
        <StockTable stockEntries={stockEntries} loading={loading} />
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Stock Entries Found</h3>
          <p className="text-gray-500 mb-4">
            {totalCount === 0 
              ? "No stock entries have been created yet." 
              : "No entries match your current filters."}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/inventory/stock/add">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Add Your First Stock Entry
              </button>
            </Link>
            {totalCount > 0 && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= totalPages || loading}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}