'use client';
import { useParams, useRouter } from 'next/navigation';
import StockForm from "../../components/StockForm";
import { useState, useEffect } from "react";
import { useShop } from "@/context/ShopContext";

export default function AddStockWithItemPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentShop } = useShop();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const shopId = currentShop?.id;

  // Get authentication token
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    
    const token = 
      localStorage.getItem('authToken') || 
      localStorage.getItem('token') ||
      sessionStorage.getItem('authToken') ||
      sessionStorage.getItem('token');
    
    return token;
  };

  // Fetch item data - USING THE CORRECT ENDPOINT
  useEffect(() => {
    const fetchItem = async () => {
      if (!shopId || !id) return;

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication required. Please log in again.');
        }

        console.log('🔄 Fetching item for stock addition - Item ID:', id, 'Shop ID:', shopId);
        
        // CORRECT ENDPOINT based on your inventoryRoutes.js
        const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/inventory/${id}/shop/${shopId}`;
        console.log('🔍 Using endpoint:', endpoint);
        
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          }
          if (response.status === 404) {
            throw new Error(`Item not found. Please check if item ID ${id} exists in shop ${shopId}`);
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📦 Item data for stock:', result);

        if (result.success) {
          setItem(result.data);
          console.log('✅ Item loaded successfully:', result.data);
        } else {
          throw new Error(result.error || 'Item not found in this shop');
        }
      } catch (error) {
        console.error('❌ Error fetching item:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, shopId]);

  const handleBack = () => {
    router.push('/inventory');
  };

  // Handle authentication error - redirect to login
  const handleLoginRedirect = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('token');
    }
    window.location.href = '/login';
  };

  // Retry function
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading item data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            {error.includes('Authentication') ? 'Authentication Required' : 'Error Loading Item'}
          </h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            {error.includes('Authentication') ? (
              <button 
                onClick={handleLoginRedirect}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Login
              </button>
            ) : (
              <>
                <button 
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry
                </button>
                <button 
                  onClick={handleBack}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Back to Inventory
                </button>
              </>
            )}
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-700">
              <strong>Debug Info:</strong> Current Shop ID: {shopId}, Item ID: {id}
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              <strong>API Endpoint:</strong> {`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/${id}/shop/${shopId}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <StockForm 
        isEdit={false}
        initialData={{
          itemId: item?.id,
          unitId: item?.default_unit_id,
          // Use selling_price instead of price_per_unit to match your schema
          pricePerUnit: item?.selling_price || item?.price_per_unit,
          itemName: item?.item_name,
          itemCode: item?.item_code
        }}
        customBackAction={handleBack}
      />
    </div>
  );
}