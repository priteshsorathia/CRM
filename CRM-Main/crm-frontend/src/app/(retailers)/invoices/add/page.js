'use client';
import InvoiceForm from "@/app/(retailers)/invoices/components/InvoiceForm";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader";

// Backend API base URL
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function AddInvoicePage() {
  const [shopDetails, setShopDetails] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  // Function to get token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || localStorage.getItem('token');
    }
    return null;
  };

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const token = getToken();

        if (!token) {
          setError('No authentication token found. Please login again.');
          setLoading(false);
          return;
        }

        console.log('🔐 Token found, fetching REAL shop details from backend...');

        // Fetch REAL shop details from backend
        const shopResponse = await fetch(`${API_BASE}/api/invoices/shop-details`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('🏪 Shop details response status:', shopResponse.status);

        if (!shopResponse.ok) {
          const errorText = await shopResponse.text();
          console.log('❌ Shop details error:', errorText);

          if (shopResponse.status === 401) {
            setError('Authentication failed. Please login again.');
          } else {
            setError(`Server error: ${shopResponse.status}`);
          }
          return;
        }

        const shopData = await shopResponse.json();
        console.log('🏪 REAL Shop data received:', shopData);
        setShopDetails(shopData);

        // Generate invoice number from backend
        const invoiceResponse = await fetch(`${API_BASE}/api/invoices/generate-number`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📄 Invoice number response status:', invoiceResponse.status);

        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json();
          setInvoiceNumber(invoiceData.invoice_number);
          console.log('📄 Invoice number:', invoiceData.invoice_number);
        } else {
          console.warn('Failed to generate invoice number, using default');
          setInvoiceNumber(`INV-${new Date().getFullYear()}-0001`);
        }

      } catch (error) {
        console.error('❌ Error fetching shop data:', error);
        setError('Failed to load shop data. Please check if backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [router]);

  if (loading) {
    return (
      <div>
        <div className="bg-white rounded-lg shadow p-6">
          <Loader variant="container" message="Loading Invoice information..." className="py-8" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-lg text-red-500 text-center">
            {error}
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!shopDetails) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Error loading shop details</div>
        </div>
      </div>
    );
  }

  const shopSettings = {
    tax: shopDetails.settings?.default_tax || 5.00
  };

  return (
    <div>
      <InvoiceForm
        shopDetails={shopDetails}
        shopSettings={shopSettings}
        invoiceNumber={invoiceNumber}
      />
    </div>
  );
}