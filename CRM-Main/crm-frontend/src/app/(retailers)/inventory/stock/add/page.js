'use client';
import { useShop } from "@/context/ShopContext";
import StockForm from "@/app/(retailers)/inventory/stock/components/StockForm";
import { useState, useEffect } from "react";

export default function AddStockPage() {
  const { currentShop } = useShop();
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  const shopId = currentShop?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!shopId) {
        setLoading(false);
        return;
      }

      try {
        // Try multiple ways to get the token
        let token = null;
        
        // Check localStorage
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('accessToken');
        }
        
        // If still no token, check cookies
        if (!token) {
          const cookies = document.cookie.split(';');
          const tokenCookie = cookies.find(cookie => 
            cookie.trim().startsWith('token=') || 
            cookie.trim().startsWith('authToken=')
          );
          if (tokenCookie) {
            token = tokenCookie.split('=')[1];
          }
        }
        
        if (!token) {
          console.error('No authentication token found');
          setLoading(false);
          return;
        }

        const [itemsResponse, unitsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/${shopId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/units`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
        ]);

        if (itemsResponse.ok) {
          const itemsResult = await itemsResponse.json();
          if (itemsResult.success) {
            setItems(itemsResult.data || itemsResult.items || []);
          }
        } else {
          console.error('Failed to fetch items:', itemsResponse.status);
        }

        if (unitsResponse.ok) {
          const unitsResult = await unitsResponse.json();
          if (unitsResult.success) {
            setUnits(unitsResult.data || unitsResult.units || []);
          }
        } else {
          console.error('Failed to fetch units:', unitsResponse.status);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Add Stock</h1>
      {currentShop && (
        <p className="text-sm text-gray-600 mb-4">Shop: {currentShop.name}</p>
      )}
      <StockForm 
        isEdit={false}
        items={items}
        units={units}
        shopId={shopId}
      />
    </div>
  );
}