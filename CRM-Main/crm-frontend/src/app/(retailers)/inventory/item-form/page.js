'use client';
import { useShop } from "@/context/ShopContext";
import ItemForm from "@/app/(retailers)/inventory/item-form/components/ItemForm";

export default function ItemFormPage() {
  const { currentShop } = useShop();

  // Debug logging
  console.log('🔍 ItemFormPage - currentShop:', currentShop);
  console.log('🔍 ItemFormPage - shopId:', currentShop?.id);

  if (!currentShop) {
    console.log('❌ No currentShop found!');
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Shop Selected</h2>
          <p className="text-gray-500">Please select a shop to add items.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <ItemForm 
        isEdit={false}
        initialData={null}
        shopId={currentShop.id}
      />
    </div>
  );
}