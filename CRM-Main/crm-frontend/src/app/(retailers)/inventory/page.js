'use client';
import { useShop } from "@/context/ShopContext";
import { toast } from "sonner";
import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import FilterBar from "@/app/(retailers)/inventory/components/InventoryFilter";
import InventoryTable from "@/app/(retailers)/inventory/components/InventoryTable";
import Pagination from "@/components/ui/Pagination";
import Link from "next/link";
import { FiPackage, FiPlus, FiRefreshCw, FiTag, FiFileText } from "react-icons/fi"; // Added FiTag and FiFileText

function InventoryContent() {
  const { currentShop, loading: shopLoading } = useShop();
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [stockFilter, setStockFilter] = useState(searchParams.get("stockStatus") || "");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "");
  const [brandFilter, setBrandFilter] = useState(searchParams.get("brand") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "name_asc");
  const [itemsPerPage, setItemsPerPage] = useState(Number(searchParams.get("limit")) || 10);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    brands: []
  });
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const shopId = currentShop?.id;

  // Get authentication token
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  };

  // Build query parameters for API call
  const buildQueryParams = () => {
    const params = new URLSearchParams();

    // Send all filter parameters to backend
    if (searchTerm) params.append('search', searchTerm);
    if (categoryFilter) params.append('category', categoryFilter);
    if (brandFilter) params.append('brand', brandFilter);
    if (stockFilter) params.append('stockStatus', stockFilter);
    if (sortBy) params.append('sortBy', sortBy);

    // Pagination
    params.append('page', currentPage.toString());
    params.append('limit', itemsPerPage.toString());

    return params.toString();
  };

  // Fetch inventory items from API
  const fetchInventoryItems = async () => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = buildQueryParams();

      // Correct endpoint - get items (and combos) for specific shop
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/inventory/${shopId}?${queryParams}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`Failed to fetch inventory: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const items = result.data || [];
        const combos = result.combos || [];

        // Normalize items (regular inventory items)
        const normalizedItems = items
          .filter(Boolean)
          .filter(item => item.shopId === parseInt(shopId)) // safety check
          .map(item => ({
            ...item,
            isCombo: false
          }));

        // Normalize combos so they can be shown in the same table
        const normalizedCombos = combos
          .filter(Boolean)
          .filter(combo => combo.shopId === parseInt(shopId))
          .map(combo => ({
            ...combo,
            isCombo: true,
            // Map to inventory-like fields for display
            item_name: combo.name,
            item_code: combo.code,
            category: combo.category || "Combo",
            brand: combo.brand || "Combo",
            selling_price: combo.price,
            original_price: combo.original_price ?? null,
            // Check multiple possible image field names from API response
            item_image: combo.item_image || combo.image || combo.combo_image || null
          }));

        const combined = [...normalizedItems, ...normalizedCombos];

        setInventoryItems(combined);
        setTotalCount(result.pagination?.total || combined.length);
        setTotalPages(result.pagination?.pages || 1);

        // Update filter options from response or extract from data
        if (result.filters) {
          setFilterOptions({
            categories: result.filters.categories || ["Combo", ...new Set(normalizedCombos.map(c => c.category).filter(Boolean))],
            brands: result.filters.brands || ["Combo", ...new Set(normalizedCombos.map(c => c.brand).filter(Boolean))]
          });
        } else {
          // Extract categories and brands from combined list
          const categories = [...new Set(combined.map(item => item.category).filter(Boolean))];
          const brands = [...new Set(combined.map(item => item.brand).filter(Boolean))];
          setFilterOptions({ categories, brands });
        }
      } else {
        throw new Error(result.error || 'Failed to fetch inventory items');
      }
    } catch (error) {
      setError(error.message);
      setInventoryItems([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const [deleteItemModal, setDeleteItemModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle item / combo deletion
  const handleDeleteItem = (item) => {
    setDeleteItemModal(item);
  };

  const confirmDelete = async () => {
    const item = deleteItemModal;
    if (!item) return;

    if (!shopId) {
      toast.error('No shop selected');
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication required. Please log in again.');
      return;
    }

    setIsDeleting(true);
    try {
      // Choose correct delete endpoint based on type
      // For combos: DELETE /api/inventory/combo/:id
      // For regular items: DELETE /api/inventory/:id/shop/:shopId
      const deleteEndpoint = item.isCombo
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/inventory/combo/${item.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/inventory/${item.id}/shop/${shopId}`;

      const response = await fetch(deleteEndpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Delete failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast.error(item.isCombo ? 'Combo product deleted successfully' : 'Item deleted successfully');
        handleRefresh();
      } else {
        throw new Error(result.error || result.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || `Failed to delete ${item.isCombo ? 'combo product' : 'item'}`);
    } finally {
      setIsDeleting(false);
      setDeleteItemModal(null);
    }
  };

  // Sync state to URL params whenever state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (stockFilter) params.set("stockStatus", stockFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (brandFilter) params.set("brand", brandFilter);
    if (sortBy && sortBy !== "name_asc") params.set("sortBy", sortBy);
    if (itemsPerPage !== 10) params.set("limit", itemsPerPage.toString());
    if (currentPage !== 1) params.set("page", currentPage.toString());

    const newQueryString = params.toString();
    const newUrl = newQueryString ? `${pathname}?${newQueryString}` : pathname;
    
    if (searchParams.toString() !== newQueryString) {
      router.replace(newUrl, { scroll: false });
    }
  }, [searchTerm, stockFilter, categoryFilter, brandFilter, sortBy, itemsPerPage, currentPage, pathname, router, searchParams]);

  // Initial fetch
  useEffect(() => {
    if (shopId) {
      fetchInventoryItems();
    } else {
      setLoading(false);
    }
  }, [shopId, refreshTrigger, currentPage, itemsPerPage]);

  // Auto-apply filters when they change
  useEffect(() => {
    if (shopId) {
      setCurrentPage(1);
      const timer = setTimeout(() => {
        fetchInventoryItems();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, stockFilter, categoryFilter, brandFilter, sortBy]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchInventoryItems();
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStockFilter("");
    setCategoryFilter("");
    setBrandFilter("");
    setSortBy("name_asc");
    setCurrentPage(1);
  };

  // Show loading if shop is still loading
  if (shopLoading) {
    return (
      <div>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading shop information...</span>
        </div>
      </div>
    );
  }

  // Show login prompt if no shop is set
  if (!currentShop) {
    return (
      <div>
        <div className="text-center py-8">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Shop Not Selected</h2>
          <p className="text-gray-500 mb-4">Please select a shop to view inventory.</p>
        </div>
      </div>
    );
  }

  return (
    <div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Current Inventory</h1>
        </div>
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
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        brandFilter={brandFilter}
        setBrandFilter={setBrandFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        applyFilters={applyFilters}
        resetFilters={resetFilters}
        shopId={shopId}
        filtersData={filterOptions}
      />

      {/* Info and Action Buttons */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="grid grid-cols-2 sm:flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
          <Link href="/inventory/item-form" className="w-full sm:w-auto">
            <button className="w-full px-3 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-blue-100">
              <FiPlus />
              <span>New Item</span>
            </button>
          </Link>
          <Link href="/inventory/category" className="w-full sm:w-auto">
            <button className="w-full px-3 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-indigo-100">
              <FiTag />
              <span>Categories</span>
            </button>
          </Link>
          <Link href="/inventory/stock" className="w-full sm:w-auto">
            <button className="w-full px-3 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-green-100">
              <FiPackage />
              <span>Stock mgmt</span>
            </button>
          </Link>
          <Link href="/inventory/combo" className="w-full sm:w-auto">
            <button className="w-full px-3 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2 text-xs font-bold shadow-lg shadow-purple-100">
              <FiPackage />
              <span>Add Combo</span>
            </button>
          </Link>
          <button 
             onClick={() => window.dispatchEvent(new Event("downloadAllMobileBarcodes"))}
             className="w-full sm:w-auto px-3 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition flex items-center justify-center gap-2 text-xs font-bold "
          >
            <FiFileText />
            <span>Download All Barcodes</span>
          </button>
        </div>

        <div className="text-xs sm:text-sm text-gray-600 text-right sm:text-left mt-2 sm:mt-0">
          {inventoryItems.length === 0 ? (
            <span>No items in inventory for {currentShop?.name}</span>
          ) : (
            <span>
              Showing {inventoryItems.length} of {totalCount} items
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
              {loading && <span className="ml-2">(updating...)</span>}
            </span>
          )}
        </div>
      </div>

      {/* Inventory Table */}
      {inventoryItems.length === 0 && !loading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-4">
            <FiPackage className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory Items</h3>
          <p className="text-gray-500 mb-4">
            Your shop <strong>{currentShop?.name}</strong> doesn't have any inventory items yet.
          </p>
          <Link href="/inventory/item-form">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Add Your First Item
            </button>
          </Link>
        </div>
      ) : (
        <InventoryTable
          items={inventoryItems}
          onDeleteClick={handleDeleteItem}
          loading={loading}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            disabled={loading}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete {deleteItemModal.isCombo ? 'Combo' : 'Item'}?</h3>
              <p className="text-center text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-700">"{deleteItemModal.item_name}"</span>? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteItemModal(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><span className="ml-2">Loading...</span></div>}>
      <InventoryContent />
    </Suspense>
  );
}