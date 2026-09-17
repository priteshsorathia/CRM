'use client';
import { toast } from "sonner";
import { useParams, useRouter } from 'next/navigation';
import StockForm from "../../components/StockForm";
import { useState, useEffect } from "react";
import { useShop } from "@/context/ShopContext";

export default function EditStockPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentShop } = useShop();
  const [stockEntry, setStockEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  const shopId = currentShop?.id;

  // Fetch stock entry data - FROM CURRENT SHOP ONLY
  useEffect(() => {
    const fetchStockEntry = async () => {
      if (!shopId || !id) return;

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock/${shopId}/${id}`);
        const result = await response.json();

        if (result.success) {
          console.log('📥 Stock entry data:', result.data);
          // Set quantity to empty string while keeping all other data
          const modifiedStockEntry = {
            ...result.data,
            quantity: "" // Make only quantity field blank
          };
          setStockEntry(modifiedStockEntry);
        } else {
          throw new Error('Stock entry not found in this shop');
        }
      } catch (error) {
        console.error('Error fetching stock entry:', error);
        toast.error('Stock entry not found in this shop');
        router.push('/inventory/stock');
      } finally {
        setLoading(false);
      }
    };

    fetchStockEntry();
  }, [id, shopId, router]);

  const handleCancel = () => {
    router.push('/inventory/stock');
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading stock entry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Edit Stock Entry</h1>

      {stockEntry && (
        <StockForm
          initialData={stockEntry}
          isEdit={true}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}