'use client';
import InvoiceForm from "@/app/(retailers)/invoices/components/InvoiceForm";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Backend API base URL
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id;
  const [invoiceData, setInvoiceData] = useState(null);
  const [shopDetails, setShopDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Function to get token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || localStorage.getItem('token');
    }
    return null;
  };

  // Fetch shop details and invoice data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        
        if (!token) {
          setError('No authentication token found. Please login again.');
          setLoading(false);
          return;
        }

        console.log('🔐 Fetching data for invoice edit:', invoiceId);

        // Fetch shop details from backend
        const shopResponse = await fetch(`${API_BASE}/api/invoices/shop-details`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!shopResponse.ok) {
          throw new Error(`Failed to fetch shop details: ${shopResponse.status}`);
        }

        const shopData = await shopResponse.json();
        console.log('🏪 Shop data received:', shopData);
        setShopDetails(shopData);

        // Fetch invoice data from backend
        const invoiceResponse = await fetch(`${API_BASE}/api/invoices/${invoiceId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📄 Invoice data response status:', invoiceResponse.status);
        
        if (invoiceResponse.ok) {
          const invoiceDataFromApi = await invoiceResponse.json();
          console.log('📄 Invoice data received:', invoiceDataFromApi);
          
          // Transform the API response to match what InvoiceForm expects
          const transformedInvoiceData = {
            id: invoiceDataFromApi.id,
            invoice_number: invoiceDataFromApi.invoice_number,
            customer_name: invoiceDataFromApi.customer_name,
            customer_phone: invoiceDataFromApi.customer_phone || '',
            customer_address: invoiceDataFromApi.customer_address || '',
            customer_gst: invoiceDataFromApi.customer_gst || '',
            invoice_date: new Date(invoiceDataFromApi.invoice_date).toISOString().split('T')[0],
            tax: invoiceDataFromApi.tax_percentage || invoiceDataFromApi.tax || 0,
            tax_percentage: invoiceDataFromApi.tax_percentage || invoiceDataFromApi.tax || 0,
            discount: invoiceDataFromApi.discount || 0,
            discount_type: invoiceDataFromApi.discount_type || 'percentage',
            discount_amount: invoiceDataFromApi.discount_amount || 0,
            making_charges: invoiceDataFromApi.making_charges || 0,
            payment_method: invoiceDataFromApi.payment_method || 'Cash',
            payment_status: invoiceDataFromApi.payment_status || 'Paid',
            interest_percentage: invoiceDataFromApi.interest_percentage || 0,
            interest_amount: invoiceDataFromApi.interest_amount || 0,
            emi_months: invoiceDataFromApi.emi_months || 0,
            amount_paid: invoiceDataFromApi.amount_paid || 0,
            balance_due: invoiceDataFromApi.balance_due || 0,
            exchange: invoiceDataFromApi.exchange || false,
            buyback: invoiceDataFromApi.buyback || false,
            subtotal: invoiceDataFromApi.subtotal || 0,
            tax_amount: invoiceDataFromApi.tax_amount || 0,
            total: invoiceDataFromApi.total || 0,
            items: invoiceDataFromApi.invoice_items.map((item, index) => {
              const qty = item.quantity ?? '';
              return {
                id: index + 1,
                item_id: item.item_id || '',
                item_name: item.item_name || '',
                unit_id: item.unit_id || '',
                unit_name: item.unit_name || '',
                unit_symbol: item.unit_symbol || '',
                quantity: qty.toString(),
                quantity_kg: qty.toString(),
                quantity_g: qty ? (parseFloat(qty) * 1000).toString() : '',
                price_per_unit: (item.price_per_unit ?? 0).toString(),
                item_total: item.item_total ?? 0
              };
            })
          };
          
          setInvoiceData(transformedInvoiceData);
        } else {
          // If invoice not found, use mock data as fallback
          console.warn('Invoice not found, using mock data for demonstration');
          const mockInvoiceData = {
            id: invoiceId,
            invoice_number: `INV-${invoiceId}`,
            customer_name: "John Doe",
            customer_phone: "+1234567890",
            customer_address: "123 Customer St",
            customer_gst: "GSTIN987654321",
            invoice_date: new Date().toISOString().split('T')[0],
            tax: 5.00,
            discount: 10.00,
            payment_method: "Cash",
            subtotal: 200.00,
            tax_amount: 10.00,
            total: 190.00,
            items: [
              {
                id: 1,
                item_id: 1,
                item_name: "Milk",
                unit_id: 1,
                unit_name: "Liter",
                unit_symbol: "L",
                quantity: 2,
                price_per_unit: 50.00,
                item_total: 100.00
              },
              {
                id: 2,
                item_id: 2,
                item_name: "Rice",
                unit_id: 3,
                unit_name: "Kilogram", 
                unit_symbol: "kg",
                quantity: 2,
                price_per_unit: 50.00,
                item_total: 100.00
              }
            ]
          };
          setInvoiceData(mockInvoiceData);
        }

      } catch (error) {
        console.error("❌ Error fetching data:", error);
        setError(error.message || 'Failed to load data. Please check if backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [invoiceId]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading invoice data...</div>
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
            <button 
              onClick={() => router.push('/invoices')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Invoices
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!shopDetails || !invoiceData) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Error loading data</div>
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
        invoiceData={invoiceData}
        isEdit={true}
      />
    </div>
  );
}