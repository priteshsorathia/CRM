'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { getApiBase } from '@/utils/apiBase';

const ShopContext = createContext();

export function ShopProvider({ children }) {
  const [currentShop, setCurrentShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Initial Load from LocalStorage (Instant display)
  useEffect(() => {
    const savedShop = localStorage.getItem('currentShop');
    if (savedShop) {
      try {
        const shopData = JSON.parse(savedShop);
        setCurrentShop(shopData);
      } catch (error) {
        console.error('Error parsing saved shop:', error);
      }
    }
    setLoading(false);
  }, []);

  // 2. ✅ AUTOMATIC REFRESH: Fetch fresh DB data on mount
  // This ensures the Logo appears even after logout/login
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
        refreshShop();
    }
  }, []);

  // Function to fetch latest data from API
  const refreshShop = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const API_BASE = getApiBase();
      if (!API_BASE) return;
      
      const response = await fetch(`${API_BASE}/api/settings/shop`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const freshShopData = result.data;
          
          // Update State
          setCurrentShop(freshShopData);
          
          // Update LocalStorage
          localStorage.setItem('currentShop', JSON.stringify(freshShopData));
          
          console.log('🔄 Shop Data Synced with DB:', freshShopData.name);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing shop context:', error);
    }
  };

  const setShop = (shop) => {
    setCurrentShop(shop);
    localStorage.setItem('currentShop', JSON.stringify(shop));
  };

  const clearShop = () => {
    setCurrentShop(null);
    localStorage.removeItem('currentShop');
  };

  return (
    <ShopContext.Provider value={{
      currentShop,
      setShop,
      clearShop,
      refreshShop, 
      loading
    }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
