'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FiPackage, FiDollarSign, FiBox, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { CheckCircle, ChevronDown } from 'lucide-react';
import BackButton from '@/components/BackButton';
import Loader from '@/components/Loader';
import { useShop } from '@/context/ShopContext';

export default function StockForm({
  initialData = null,
  isEdit = false,
  onCancel,
  customBackAction
}) {
  const router = useRouter();
  const { currentShop } = useShop();
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Determine if this is "add-with-item" mode (item pre-selected)
  const isAddWithItem = !isEdit && initialData?.itemId;

  const [formData, setFormData] = useState({
    itemId: initialData?.itemId || '',
    quantity: initialData?.quantity || '',
    unitId: initialData?.unitId || '',
    stockType: initialData?.stockType || 'in',
    pricePerUnit: initialData?.pricePerUnit || '',
    notes: initialData?.notes || ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [dropdownStates, setDropdownStates] = useState({
    itemId: false,
    unitId: false,
    stockType: false,
  });

  const handleDropdownClick = (name) => {
    setDropdownStates(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleDropdownBlur = (name) => {
    setDropdownStates(prev => ({ ...prev, [name]: false }));
  };

  const handleDropdownChange = (name) => {
    setDropdownStates(prev => ({ ...prev, [name]: false }));
  };

  // Fetch items and units
  useEffect(() => {
    const fetchData = async () => {
      if (!shopId) {
        console.log('❌ No shop ID available');
        setLoading(false);
        return;
      }

      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication required. Please log in again.');
        }

        setLoading(true);
        setError(null);

        console.log('🔄 Fetching data for shop:', shopId);
        console.log('📥 Initial data:', initialData);

        // FIXED: Use the correct API endpoint with shopId
        const [itemsResponse, unitsResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/${shopId}`, { // CHANGED THIS LINE
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

        console.log('📥 Items response status:', itemsResponse.status);
        console.log('📥 Units response status:', unitsResponse.status);

        if (!itemsResponse.ok) {
          if (itemsResponse.status === 401) {
            throw new Error('Authentication failed for items API. Please log in again.');
          }
          throw new Error(`Items API error: ${itemsResponse.status}`);
        }

        if (!unitsResponse.ok) {
          if (unitsResponse.status === 401) {
            throw new Error('Authentication failed for units API. Please log in again.');
          }
          throw new Error(`Units API error: ${unitsResponse.status}`);
        }

        const itemsResult = await itemsResponse.json();
        const unitsResult = await unitsResponse.json();

        console.log('📦 Items result:', itemsResult);
        console.log('📦 Units result:', unitsResult);

        // Handle items data safely
        if (itemsResult.success) {
          // Check if data exists and is an array
          const itemsData = itemsResult.data || itemsResult.items || [];
          if (!Array.isArray(itemsData)) {
            console.warn('⚠️ Items data is not an array:', itemsData);
            setItems([]);
          } else {
            // Filter items by current shop (already filtered by backend, but double-check)
            const shopItems = itemsData.filter(item => {
              // Safely check if item exists and has shopId
              return item && item.shopId === parseInt(shopId);
            });
            setItems(shopItems);
            console.log('✅ Items loaded for shop:', shopItems.length);
          }
        } else {
          throw new Error(itemsResult.error || 'Failed to fetch items');
        }

        // Handle units data safely
        if (unitsResult.success) {
          const unitsData = unitsResult.data || unitsResult.units || [];
          if (!Array.isArray(unitsData)) {
            console.warn('⚠️ Units data is not an array:', unitsData);
            setUnits([]);
          } else {
            setUnits(unitsData);
            console.log('✅ Units loaded:', unitsData.length);
          }
        } else {
          throw new Error(unitsResult.error || 'Failed to fetch units');
        }

        // Handle pre-filled data for "add-with-item" mode
        if (isAddWithItem && initialData?.itemId) {
          console.log('🎯 Setting pre-filled data for add-with-item mode');
          const itemsData = itemsResult.data || itemsResult.items || [];
          if (Array.isArray(itemsData)) {
            const selectedItem = itemsData.find(item => item && item.id === parseInt(initialData.itemId));
            if (selectedItem) {
              console.log('✅ Found selected item:', selectedItem);
              setFormData(prev => ({
                ...prev,
                itemId: initialData.itemId.toString(),
                unitId: initialData.unitId ? initialData.unitId.toString() : selectedItem.default_unit_id?.toString() || prev.unitId,
                pricePerUnit: initialData.pricePerUnit || selectedItem.original_price || prev.pricePerUnit
              }));
            } else {
              console.warn('⚠️ Selected item not found in items list');
            }
          }
        }

        // If editing, set the selected item's data
        if (isEdit && initialData) {
          const itemsData = itemsResult.data || itemsResult.items || [];
          if (Array.isArray(itemsData)) {
            const selectedItem = itemsData.find(item => item && item.id === initialData.itemId);
            if (selectedItem) {
              setFormData(prev => ({
                ...prev,
                unitId: selectedItem.default_unit_id?.toString() || prev.unitId,
                pricePerUnit: initialData.pricePerUnit || selectedItem.original_price || prev.pricePerUnit
              }));
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shopId, isEdit, initialData, isAddWithItem]);

  const handleBackClick = (e) => {
    e.preventDefault();
    if (customBackAction) {
      customBackAction();
    } else if (onCancel) {
      onCancel();
    } else {
      router.push('/inventory/stock');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'notes') {
      // Prevent multiple consecutive spaces and leading spaces
      processedValue = value.replace(/ +/g, ' ');
      if (processedValue.startsWith(' ')) {
        processedValue = processedValue.trimStart();
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'pricePerUnit' ? processedValue : processedValue
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleItemChange = (e) => {
    const itemId = e.target.value;
    const selectedItem = items.find(item => item && item.id === parseInt(itemId));

    setFormData(prev => ({
      ...prev,
      itemId: itemId,
      unitId: selectedItem?.default_unit_id?.toString() || prev.unitId,
      pricePerUnit: selectedItem?.original_price?.toString() || prev.pricePerUnit
    }));
    if (formErrors.itemId) {
      setFormErrors(prev => ({ ...prev, itemId: null }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.itemId) errors.itemId = "Please select an item in the list";
    if (!formData.quantity) errors.quantity = "Please enter a quantity";
    else if (parseFloat(formData.quantity) <= 0) errors.quantity = "Quantity must be greater than 0";
    if (!formData.unitId) errors.unitId = "Please select a unit";
    if (!formData.stockType) errors.stockType = "Please select a stock type";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!shopId) {
      toast.error("No shop selected. Please select a shop first.");
      return;
    }

    // Check if token exists
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication required. Please log in again.");
      return;
    }

    // Validate form
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        itemId: parseInt(formData.itemId),
        quantity: parseFloat(formData.quantity),
        unitId: parseInt(formData.unitId),
        stockType: formData.stockType,
        pricePerUnit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : null,
        notes: formData.notes ? formData.notes.trim() : null,
        shopId: parseInt(shopId) // Ensure this is integer
      };

      console.log('✅ Submitting stock data:', submitData);

      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/stock/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/stock`;

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(result.error || 'Failed to save stock entry');
      }

      if (result.success) {
        toast.success(result.message || (isEdit ? 'Stock entry updated successfully' : 'Stock entry added successfully'));

        // Redirect based on context
        if (isAddWithItem && customBackAction) {
          customBackAction();
        } else {
          router.push('/inventory/stock');
        }
      } else {
        throw new Error(result.error || 'Failed to save stock entry');
      }
    } catch (error) {
      console.error('Error saving stock:', error);
      toast.error(error.message || 'Failed to save stock entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <Loader variant="container" message="Loading form data..." className="py-8" />
      </div>
    );
  }

  const selectedItem = items.find(item => item && item.id === parseInt(formData.itemId));
  const selectedUnit = units.find(unit => unit && unit.id === parseInt(formData.unitId));
  const totalValue = formData.quantity && formData.pricePerUnit
    ? (parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit)).toFixed(2)
    : '0.00';

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <FiPackage className="text-blue-600" />
            {isEdit ? 'Edit Stock Entry' : 'Add New Stock Entry'}
            {isAddWithItem && selectedItem && (
              <span className="text-sm text-blue-600 ml-2">
                for: {selectedItem.item_name}
              </span>
            )}
          </h2>

        </div>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mx-6 mt-4">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="divide-y divide-gray-200" noValidate>
        {/* Item Information Section */}
        <div className="px-6 py-4">
          <h3 className="text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
            <FiBox className="text-blue-500" />
            Item Information
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {/* Item Selection */}
            <div>
              <label htmlFor="itemId" className="block text-sm font-medium text-gray-700 mb-1">
                Item <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="itemId"
                  id="itemId"
                  value={formData.itemId}
                  onChange={(e) => {
                    handleItemChange(e);
                    handleDropdownChange('itemId');
                  }}
                  onClick={() => handleDropdownClick('itemId')}
                  onBlur={() => handleDropdownBlur('itemId')}
                  required
                  disabled={isEdit || isAddWithItem}
                  className={`w-full px-3 py-2 bg-none border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10 ${(isEdit || isAddWithItem) ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                >
                  <option value="">Select Item</option>
                  {items.map((item) => (
                    item && (
                      <option key={item.id} value={item.id}>
                        {item.item_name} ({item.item_code})
                      </option>
                    )
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${dropdownStates.itemId ? 'rotate-180' : ''}`} />
                </div>
              </div>
              {formErrors.itemId && (
                <p className="text-red-500 text-xs mt-1">{formErrors.itemId}</p>
              )}
              {(isEdit || isAddWithItem) && (
                <p className="text-xs text-gray-500 mt-1">
                  {isEdit
                    ? 'Item cannot be changed when editing stock entry'
                    : 'Item is pre-selected from inventory'
                  }
                </p>
              )}
            </div>

            {/* Display item details when selected */}
            {selectedItem && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div>
                  <label className="block text-sm font-medium text-blue-700">Item Name</label>
                  <p className="text-sm text-blue-900 font-medium">{selectedItem.item_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700">Item Code</label>
                  <p className="text-sm text-blue-900">{selectedItem.item_code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700">Current Stock</label>
                  <p className="text-sm text-blue-900">
                    {selectedItem.current_stock !== undefined ? selectedItem.current_stock : selectedItem.default_quantity}
                    {selectedItem.unit?.symbol ? ` ${selectedItem.unit.symbol}` : ''}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700">Category</label>
                  <p className="text-sm text-blue-900">{selectedItem.category || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700">Brand</label>
                  <p className="text-sm text-blue-900">{selectedItem.brand || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700">Original Price</label>
                  <p className="text-sm text-blue-900">₹{selectedItem.original_price || '0.00'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-700">Selling Price</label>
                  <p className="text-sm text-blue-900">₹{selectedItem.selling_price || '0.00'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stock Details Section */}
        <div className="px-6 py-4">
          <h3 className="text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
            <FiTrendingUp className="text-blue-500" />
            Stock Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quantity */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="quantity"
                  id="quantity"
                  step="0.01"
                  min="0.01"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                  className="w-full pl-3 pr-16 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                {selectedUnit && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sm text-gray-500">
                    {selectedUnit.symbol}
                  </div>
                )}
              </div>
              {formErrors.quantity && (
                <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>
              )}
            </div>

            {/* Unit */}
            <div>
              <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 mb-1">
                Unit <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="unitId"
                  id="unitId"
                  value={formData.unitId}
                  onChange={(e) => {
                    handleChange(e);
                    handleDropdownChange('unitId');
                  }}
                  onClick={() => handleDropdownClick('unitId')}
                  onBlur={() => handleDropdownBlur('unitId')}
                  required
                  className="w-full px-3 py-2 bg-none border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none pr-10"
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    unit && (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.symbol})
                      </option>
                    )
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${dropdownStates.unitId ? 'rotate-180' : ''}`} />
                </div>
              </div>
              {formErrors.unitId && (
                <p className="text-red-500 text-xs mt-1">{formErrors.unitId}</p>
              )}
            </div>

            {/* Stock Type */}
            <div>
              <label htmlFor="stockType" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="stockType"
                  id="stockType"
                  value={formData.stockType}
                  onChange={(e) => {
                    handleChange(e);
                    handleDropdownChange('stockType');
                  }}
                  onClick={() => handleDropdownClick('stockType')}
                  onBlur={() => handleDropdownBlur('stockType')}
                  required
                  className="w-full pl-10 pr-10 py-2 bg-none border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none"
                >
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {formData.stockType === 'in' ? (
                    <FiTrendingUp className="text-green-500" />
                  ) : (
                    <FiTrendingDown className="text-red-500" />
                  )}
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${dropdownStates.stockType ? 'rotate-180' : ''}`} />
                </div>
              </div>
              {formErrors.stockType && (
                <p className="text-red-500 text-xs mt-1">{formErrors.stockType}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="px-6 py-4">
          <h3 className="text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
            <FiDollarSign className="text-blue-500" />
            Pricing Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price Per Unit */}
            <div>
              <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-1">
                Price Per Unit
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <input
                  type="number"
                  name="pricePerUnit"
                  id="pricePerUnit"
                  step="0.01"
                  min="0"
                  value={formData.pricePerUnit}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full pl-7 pr-24 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                {selectedUnit && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-sm text-gray-500">
                    per {selectedUnit.name}
                  </div>
                )}
              </div>
            </div>

            {/* Total Value (calculated field) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Value
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">₹</span>
                </div>
                <input
                  type="text"
                  readOnly
                  value={totalValue}
                  className="w-full pl-7 pr-12 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500">INR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="px-6 py-4">
          <h3 className="text-base font-medium text-gray-700 mb-3">Additional Notes</h3>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any notes about this stock entry"
            rows="3"
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex justify-between items-start mt-1">
            <div className="flex-1">
              {formErrors.notes && (
                <p className="text-red-500 text-xs">{formErrors.notes}</p>
              )}
            </div>
            <p className="text-xs text-gray-500 whitespace-nowrap ml-4">
              {formData.notes ? formData.notes.length : 0}/100
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? (
                <Loader variant="inline-compact" message="Processing..." />
              ) : isEdit ? (
                'Update Stock'
              ) : (
                'Add Stock'
              )}
            </button>
            <BackButton
              onClick={handleBackClick}
              className={`${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </form>
    </div>
  );
}