'use client';

import { useState, useEffect, useRef } from 'react';
import { Combobox } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

// Backend API base URL
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

// Draft-specific item row – currently mirrors ItemRow behavior
export default function DraftItemRow({ id, itemData: initialItemData, onRemove, onUpdate, isOnlyRow = false }) {
  // Use a single state that represents the current item data
  const [itemData, setItemData] = useState({
    item_id: '',
    item_name: '',
    unit_id: '',
    unit_name: '',
    unit_symbol: '',
    quantity: '',
    price_per_unit: '',
    item_total: 0,
    base_price_per_unit: '',
    base_unit_symbol: ''
  });

  const [units, setUnits] = useState([]);
  const [query, setQuery] = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [placeholder, setPlaceholder] = useState('Qty');
  const [originalBasePrice, setOriginalBasePrice] = useState(0);
  const [originalBaseUnit, setOriginalBaseUnit] = useState('');
  const [conversionFactor, setConversionFactor] = useState(1);

  // Refs for tracking state
  const lastExternalDataRef = useRef();
  const quantityTimeoutRef = useRef(null);

  // Initialize with initialItemData (used for draft edit)
  useEffect(() => {
    if (initialItemData) {
      setItemData(initialItemData);
      lastExternalDataRef.current = initialItemData;

      if (initialItemData.unit_symbol) {
        setPlaceholder(initialItemData.unit_symbol);
      }

      const existingPrice =
        parseFloat(initialItemData.price_per_unit) ||
        parseFloat(initialItemData.base_price_per_unit) ||
        parseFloat(initialItemData.inventory_item?.selling_price) ||
        0;
      const existingUnitSymbol =
        initialItemData.base_unit_symbol ||
        initialItemData.unit_symbol ||
        initialItemData.unit?.symbol ||
        '';

      if (existingPrice) setOriginalBasePrice(existingPrice);
      if (existingUnitSymbol) setOriginalBaseUnit(existingUnitSymbol);
      setConversionFactor(1);

      if (initialItemData.unit && initialItemData.unit.unitCategoryId) {
        fetchAvailableUnits(initialItemData.unit.unitCategoryId, initialItemData.unit_id || initialItemData.unit.id);
      }
    }
  }, []);

  // Handle external updates (e.g. QuickCalculation or QuickAdd)
  useEffect(() => {
    if (!initialItemData) return;

    const lastData = lastExternalDataRef.current;
    const isNewItem = initialItemData.item_id !== lastData?.item_id || initialItemData.item_name !== lastData?.item_name;
    const isNewQuantity = initialItemData.quantity !== lastData?.quantity;

    if (isNewItem || isNewQuantity) {
      console.log('🔄 DraftItemRow: Syncing with external data', { id, isNewItem, isNewQuantity });

      const updatedData = {
        ...itemData,
        ...initialItemData,
      };
      setItemData(updatedData);

      if (isNewItem) {
        setQuery(initialItemData.item_name || '');

        const existingPrice = parseFloat(initialItemData.price_per_unit) || 0;
        const existingUnitSymbol = initialItemData.unit_symbol || '';

        setOriginalBasePrice(existingPrice);
        setOriginalBaseUnit(existingUnitSymbol);
        setPlaceholder(existingUnitSymbol || 'Qty');
        setConversionFactor(1);

        if (initialItemData.unit?.unitCategoryId) {
          fetchAvailableUnits(initialItemData.unit.unitCategoryId, initialItemData.unit_id || initialItemData.unit.id);
        } else if (initialItemData.item_id) {
          const inv = inventoryItems.find(i => i.id === initialItemData.item_id);
          if (inv?.unit?.unitCategoryId) {
            fetchAvailableUnits(inv.unit.unitCategoryId, inv.unit.id);
          }
        }
      }

      lastExternalDataRef.current = initialItemData;
    }
  }, [initialItemData, inventoryItems, id]);

  // Fetch inventory items from database
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          return;
        }

        setLoading(true);

        const response = await fetch(`${API_BASE}/api/inventory/items`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          setError(`Failed to load items: ${response.status}`);
          return;
        }

        const data = await response.json();

        if (data.success && data.items) {
          setInventoryItems(data.items);
        } else {
          setError('Invalid response format');
        }
      } catch (error) {
        console.error('❌ Error fetching inventory items:', error);
        setError('Network error loading items');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryItems();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (quantityTimeoutRef.current) {
        clearTimeout(quantityTimeoutRef.current);
      }
    };
  }, []);

  const filteredItems = query === ''
    ? [] // Hide all items by default when query is empty
    : inventoryItems
      .filter((item) => {
        const matchesName = item.item_name.toLowerCase().includes(query.toLowerCase());
        const hasStock = item.current_stock > 0;
        return matchesName && hasStock;
      });

  const handleItemSelect = (item) => {
    if (!item) return;

    const sellingPrice = parseFloat(item.selling_price) || 0;
    const defaultUnit = item.unit;

    setOriginalBasePrice(sellingPrice);
    setOriginalBaseUnit(defaultUnit?.symbol || '');
    setConversionFactor(1);

    const newData = {
      item_id: item.id,
      item_name: item.item_name,
      price_per_unit: sellingPrice.toString(),
      base_price_per_unit: sellingPrice.toString(),
      unit_id: defaultUnit?.id || '',
      unit_name: defaultUnit?.name || '',
      unit_symbol: defaultUnit?.symbol || '',
      base_unit_symbol: defaultUnit?.symbol || '',
      quantity: '',
      item_total: 0
    };

    setItemData(newData);
    lastExternalDataRef.current = newData;

    if (defaultUnit?.symbol) setPlaceholder(defaultUnit.symbol);
    else setPlaceholder('Qty');

    if (item.unit && item.unit.unitCategoryId) {
      fetchAvailableUnits(item.unit.unitCategoryId, defaultUnit?.id);
    } else {
      setUnits([]);
    }

    onUpdate(id, newData);
  };

  const fetchAvailableUnits = async (unitCategoryId, defaultUnitId) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/units/category/${unitCategoryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const availableUnits = data.units || [];
        setUnits(availableUnits);
      } else {
        console.error('Failed to fetch units');
        setUnits([]);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      setUnits([]);
    }
  };

  const handleUnitChange = (e) => {
    const selectedUnitId = parseInt(e.target.value);
    const selectedUnit = units.find((unit) => unit.id === selectedUnitId);

    if (!selectedUnit) {
      const clearedData = {
        ...itemData,
        unit_id: '',
        unit_name: '',
        unit_symbol: '',
        quantity: '',
        item_total: 0
      };
      setItemData(clearedData);
      setPlaceholder('Qty');
      setConversionFactor(1);
      onUpdate(id, clearedData);
      return;
    }

    setPlaceholder(selectedUnit.symbol);

    const baseUnitSymbol = originalBaseUnit;
    const newUnitSymbol = selectedUnit.symbol;

    let factor = 1;

    if (baseUnitSymbol === 'kg' && newUnitSymbol === 'g') factor = 1 / 1000;
    else if (baseUnitSymbol === 'g' && newUnitSymbol === 'kg') factor = 1000;
    else if (baseUnitSymbol === 'L' && newUnitSymbol === 'ml') factor = 1 / 1000;
    else if (baseUnitSymbol === 'ml' && newUnitSymbol === 'L') factor = 1000;
    else if (baseUnitSymbol === 'piece' && newUnitSymbol === 'dozen') factor = 12;
    else if (baseUnitSymbol === 'dozen' && newUnitSymbol === 'piece') factor = 1 / 12;

    setConversionFactor(factor);

    const newData = {
      ...itemData,
      unit_id: selectedUnit.id,
      unit_name: selectedUnit.name,
      unit_symbol: selectedUnit.symbol,
      price_per_unit: originalBasePrice.toString(),
      base_price_per_unit: originalBasePrice.toString(),
      base_unit_symbol: baseUnitSymbol,
      quantity: itemData.quantity
    };

    setItemData(newData);

    if (itemData.quantity && itemData.quantity !== '') {
      calculateTotal(newData, itemData.quantity, factor);
    } else {
      onUpdate(id, { ...newData, conversionFactor: factor });
    }
  };

  const handleQuantityChange = (e) => {
    let value = e.target.value;

    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      if (quantityTimeoutRef.current) {
        clearTimeout(quantityTimeoutRef.current);
      }

      if (value !== '' && value !== '.') {
        const numValue = parseFloat(value);
        const invItem = inventoryItems.find(i => i.id === itemData.item_id);
        if (invItem && invItem.current_stock != null) {
          const availableStock = parseFloat(invItem.current_stock) || 0;
          const quantityInBaseUnit = numValue * conversionFactor;
          if (quantityInBaseUnit > availableStock) {
            value = (availableStock / conversionFactor).toString();
            toast.error(`Only ${value} ${itemData.unit_symbol || 'units'} available in stock!`, {
              id: 'stock-limit-toast',
              duration: 3000
            });
          }
        }
      }

      const updatedData = {
        ...itemData,
        quantity: value
      };

      setItemData(updatedData);

      if (value === '' || value === '.') {
        const clearedData = {
          ...updatedData,
          item_total: 0
        };
        setItemData(clearedData);
        onUpdate(id, clearedData);
        return;
      }

      calculateTotal(updatedData, value, conversionFactor);
    }
  };

  const calculateTotal = (data, quantityValue, currentConversionFactor = conversionFactor) => {
    const quantity = parseFloat(quantityValue) || 0;
    const price = parseFloat(data.price_per_unit) || 0;
    const total = quantity * currentConversionFactor * price;

    const finalData = {
      ...data,
      item_total: total
    };

    setItemData(finalData);
    onUpdate(id, { ...finalData, conversionFactor: currentConversionFactor });
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;

    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const updatedData = {
        ...itemData,
        price_per_unit: value
      };

      setItemData(updatedData);

      if (itemData.quantity && value && value !== '.' && !value.endsWith('.')) {
        calculateTotal(updatedData, itemData.quantity, conversionFactor);
      } else {
        const clearedData = {
          ...updatedData,
          item_total: 0
        };
        setItemData(clearedData);
        onUpdate(id, clearedData);
      }
    }
  };

  const handleRemove = () => {
    if (quantityTimeoutRef.current) {
      clearTimeout(quantityTimeoutRef.current);
    }

    const clearedData = {
      item_id: '',
      item_name: '',
      unit_id: '',
      unit_name: '',
      unit_symbol: '',
      quantity: '',
      price_per_unit: '',
      item_total: 0,
      base_price_per_unit: '',
      base_unit_symbol: ''
    };

    setItemData(clearedData);
    setUnits([]);
    setQuery('');
    setPlaceholder('Qty');
    setOriginalBasePrice(0);
    setOriginalBaseUnit('');
    setConversionFactor(1);
    lastExternalDataRef.current = clearedData;

    onRemove(id);
  };

  return (
    <tr>
      <td className="px-2 py-3 whitespace-nowrap">
        <div className="space-y-2">
          <Combobox value={itemData} onChange={handleItemSelect}>
            <div className="relative">
              <Combobox.Input
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
                displayValue={(item) => item.item_name || ''}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search item"
              />
              <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                {loading && (
                  <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                    Loading items...
                  </div>
                )}
                {error && (
                  <div className="relative cursor-default select-none px-4 py-2 text-red-700">
                    Error: {error}
                  </div>
                )}
                {!loading && !error && filteredItems.length === 0 && query !== '' ? (
                  <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                    No available items found
                  </div>
                ) : null}
                {filteredItems.map((item) => (
                  <Combobox.Option
                    key={item.id}
                    value={item}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-4 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <div className="flex justify-between items-center">
                        <div>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {item.item_name}
                          </span>
                          {item.category && (
                            <span className="text-xs text-gray-500">{item.category}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-gray-900 font-medium">
                            ₹{item.selling_price}
                          </span>
                          <div className="text-xs text-gray-500">
                            {item.unit?.symbol || 'No unit'} • Stock: {item.current_stock}
                          </div>
                        </div>
                      </div>
                    )}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>
      </td>
      <td className="px-2 py-3 whitespace-nowrap">
        <div className="relative">
          <select
            value={itemData.unit_id || ''}
            onChange={handleUnitChange}
            className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer disabled:cursor-not-allowed"
            disabled={!itemData.item_id}
          >
            <option value="">Select Unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.symbol})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </td>
      <td className="px-2 py-3 whitespace-nowrap">
        <input
          type="text"
          name="quantity"
          value={itemData.quantity}
          onChange={handleQuantityChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </td>
      <td className="px-2 py-3 whitespace-nowrap">
        <div className="relative">
          <input
            type="text"
            name="price_per_unit"
            value={itemData.price_per_unit}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 cursor-not-allowed focus:outline-none pr-16"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500 text-sm">₹/{itemData.base_unit_symbol || 'unit'}</span>
          </div>
        </div>
      </td>
      <td className="px-2 py-3 whitespace-nowrap">
        <div className="text-right font-medium text-green-600">
          ₹{(parseFloat(itemData.item_total) || 0).toFixed(2)}
        </div>
      </td>
      <td className="px-2 py-3 whitespace-nowrap text-right">
        <button
          type="button"
          onClick={handleRemove}
          disabled={isOnlyRow}
          className={`px-3 py-1 rounded-md transition-colors ${
            isOnlyRow
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-red-100 text-red-800 hover:bg-red-200"
          }`}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}


