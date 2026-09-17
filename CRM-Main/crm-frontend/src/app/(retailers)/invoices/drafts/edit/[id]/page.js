'use client';
import DraftInvoiceForm from "@/app/(retailers)/invoices/components/draftInvoiceForm";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

// Backend API base URL
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function EditDraftPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.id;
  
  const [shopDetails, setShopDetails] = useState(null);
  const [draftData, setDraftData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Function to get token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || localStorage.getItem('token');
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getToken();
        
        if (!token) {
          setError('No authentication token found. Please login again.');
          setLoading(false);
          return;
        }

        if (!draftId) {
          setError('Draft ID is missing.');
          setLoading(false);
          return;
        }

        // Fetch shop details
        const shopResponse = await fetch(`${API_BASE}/api/invoices/shop-details`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!shopResponse.ok) {
          if (shopResponse.status === 401) {
            setError('Authentication failed. Please login again.');
          } else {
            setError(`Server error: ${shopResponse.status}`);
          }
          return;
        }

        const shopData = await shopResponse.json();
        setShopDetails(shopData);

        // Fetch draft invoice by ID
        const draftResponse = await fetch(`${API_BASE}/api/draft-invoices/get-draft-by/${draftId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!draftResponse.ok) {
          if (draftResponse.status === 404) {
            setError('Draft invoice not found.');
          } else {
            setError('Failed to load draft invoice.');
          }
          return;
        }

        const draftResult = await draftResponse.json();
        
        if (draftResult.success && draftResult.data) {
          setDraftData(draftResult.data);
        } else {
          setError('Failed to load draft invoice data.');
        }

      } catch (error) {
        console.error('❌ Error fetching data:', error);
        setError('Failed to load data. Please check if backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [draftId, router]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading draft invoice...</div>
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
              onClick={() => router.push('/invoices/drafts')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Drafts
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!shopDetails || !draftData) {
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

  // Format draft data for DraftInvoiceForm (map backend draft_items to form items)
  const formattedItems = (draftData.draft_items || draftData.items || []).map((item, index) => {
    const qty = item.quantity ?? '';
    const price = item.price_per_unit ?? item.inventory_item?.selling_price ?? 0;
    const unitSymbol = item.unit_symbol || item.unit?.symbol || '';

    return {
      id: index + 1,
      // core ids & names
      item_id: item.item_id || '',
      item_name: item.item_name || '',
      // unit info
      unit_id: item.unit_id || item.unit?.id || '',
      unit_name: item.unit_name || item.unit?.name || '',
      unit_symbol: unitSymbol,
      unit: item.unit || null,
      // quantities
      quantity: qty.toString(),
      quantity_kg: item.quantity_kg || qty.toString(),
      quantity_g: item.quantity_g || (qty ? (parseFloat(qty) * 1000).toString() : ''),
      // pricing
      price_per_unit: price.toString(),
      base_price_per_unit: price.toString(),
      base_unit_symbol: unitSymbol,
      item_total: item.item_total ?? (parseFloat(qty || 0) * parseFloat(price || 0))
    };
  });

  const formattedDraftData = {
    id: draftData.id,
    invoice_number: draftData.invoice_number || `DRAFT-${draftData.id}`,
    customer_name: draftData.customer_name || '',
    customer_phone: draftData.customer_phone || '',
    customer_address: draftData.customer_address || '',
    customer_gst: draftData.customer_gst || '',
    invoice_date: draftData.invoice_date || new Date().toISOString().split("T")[0],
    tax: draftData.tax || 0,
    tax_percentage: draftData.tax || 0,
    discount: draftData.discount || 0,
    discount_type: draftData.discount_type || 'percentage',
    discount_amount: draftData.discount_amount || 0,
    making_charges: draftData.making_charges || 0,
    payment_method: draftData.payment_method || 'Cash',
    payment_status: draftData.payment_status || 'Paid',
    interest_rate: draftData.interest_percentage || 0,
    interest_percentage: draftData.interest_percentage || 0,
    interest_amount: draftData.interest_amount || 0,
    emi_months: draftData.emi_months || 0,
    amount_paid: draftData.amount_paid || 0,
    exchange: draftData.exchange || false,
    buyback: draftData.buyback || false,
    subtotal: draftData.subtotal || 0,
    tax_amount: draftData.tax_amount || 0,
    total: draftData.total || 0,
    items: formattedItems.length > 0 ? formattedItems : [{ 
      id: 1, 
      item_id: '', 
      item_name: '', 
      unit_id: '', 
      unit_name: '', 
      unit_symbol: '', 
      quantity: '', 
      quantity_kg: '', 
      quantity_g: '', 
      price_per_unit: '', 
      item_total: 0 
    }],
    notes: draftData.notes || ''
  };

  return (
    <div className="p-4 sm:p-6">
      <DraftInvoiceForm 
        shopDetails={shopDetails}
        shopSettings={shopSettings}
        invoiceNumber={formattedDraftData.invoice_number}
        invoiceData={formattedDraftData}
        draftId={draftId}
      />
    </div>
  );
}

