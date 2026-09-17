'use client';
import { useParams } from 'next/navigation';
import { useShop } from '@/context/ShopContext';
import { useState, useEffect } from "react";
import ItemForm from "@/app/(retailers)/inventory/item-form/components/ItemForm";
import { toast } from "sonner";

export default function EditItemPage() {
  const { id } = useParams();
  const { currentShop } = useShop();
  const [itemData, setItemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Fetch item data from API
  useEffect(() => {
    const fetchItemData = async () => {
      if (!currentShop || !id) return;

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication required. Please log in again.');
        }

        console.log('🔄 Fetching item data for:', id, 'shop:', currentShop.id);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/${id}/shop/${currentShop.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          } else if (response.status === 404) {
            throw new Error('Item not found in this shop.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('📦 Item data response:', result);

        if (result.success) {
          setItemData(result.data);
          console.log('✅ Item data loaded:', result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch item data');
        }
      } catch (error) {
        console.error('❌ Error fetching item data:', error);
        setError(error.message);
        toast.error(error.message || 'Failed to load item data');
      } finally {
        setLoading(false);
      }
    };

    fetchItemData();
  }, [id, currentShop]);

  if (!currentShop) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Shop Selected</h2>
          <p className="text-gray-500">Please select a shop to edit items.</p>
        </div>
      </div>
    );
  }

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

  if (error && !itemData) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Error Loading Item</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <ItemForm 
        isEdit={true}
        initialData={itemData}
        shopId={currentShop.id}
      />
    </div>
  );
}