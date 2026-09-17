'use client';
import { useState, useEffect, useRef } from 'react';
import { Combobox } from '@headlessui/react';
import { Trash2, Package, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
// Backend API base URL
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function ItemRow({ id, itemData: initialItemData, onRemove, onUpdate, inventoryItems = [], loadingInventory = false, isMobile = false, isFirstRow = false, isOnlyRow = false }) {
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

  const searchInputRef = useRef(null);

  const [units, setUnits] = useState([]);
  const [query, setQuery] = useState('');

  const [placeholder, setPlaceholder] = useState('Qty');
  const [originalBasePrice, setOriginalBasePrice] = useState(0);
  const [originalBaseUnit, setOriginalBaseUnit] = useState('');
  const [conversionFactor, setConversionFactor] = useState(1);

  // Refs for tracking state
  const lastExternalDataRef = useRef();
  const quantityTimeoutRef = useRef(null);

  // Initialize with initialItemData (used for edit / draft edit)
  useEffect(() => {
    if (initialItemData) {
      setItemData(initialItemData);
      lastExternalDataRef.current = initialItemData;

      // Set placeholder from existing unit symbol
      if (initialItemData.unit_symbol) {
        setPlaceholder(initialItemData.unit_symbol);
      }

      // If draft/invoice provided unit & price, hydrate base pricing + units list
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

      if (existingPrice) {
        setOriginalBasePrice(existingPrice);
      }
      if (existingUnitSymbol) {
        setOriginalBaseUnit(existingUnitSymbol);
      }
      setConversionFactor(1);

      // Preload available units if we know the unit category
      if (initialItemData.unit && initialItemData.unit.unitCategoryId) {
        fetchAvailableUnits(initialItemData.unit.unitCategoryId, initialItemData.unit_id || initialItemData.unit.id);
      }
    }
  }, []);

  // Handle external updates (e.g. QuickCalculation or QuickAdd)
  useEffect(() => {
    if (!initialItemData) return;

    // Detect if this is a "meaningful" change by comparing IDs or Names
    // We check if the incoming data is actually different from what we last handled
    const lastData = lastExternalDataRef.current;
    const isNewItem = initialItemData.item_id !== lastData?.item_id || initialItemData.item_name !== lastData?.item_name;
    const isNewQuantity = initialItemData.quantity !== lastData?.quantity;

    if (isNewItem || isNewQuantity) {
      console.log('🔄 ItemRow: Syncing with external data', { id, isNewItem, isNewQuantity });

      // 1. Update the main item state
      const updatedData = {
        ...itemData,
        ...initialItemData,
      };
      setItemData(updatedData);

      // 2. React to a new item selection (e.g. from QuickAdd)
      if (isNewItem) {
        setQuery(initialItemData.item_name || '');

        const existingPrice = parseFloat(initialItemData.price_per_unit) || 0;
        const existingUnitSymbol = initialItemData.unit_symbol || '';

        setOriginalBasePrice(existingPrice);
        setOriginalBaseUnit(existingUnitSymbol);
        setPlaceholder(existingUnitSymbol || 'Qty');
        setConversionFactor(1);

        // Hydrate units list if category is known
        if (initialItemData.unit?.unitCategoryId) {
          fetchAvailableUnits(initialItemData.unit.unitCategoryId, initialItemData.unit_id || initialItemData.unit.id);
        } else if (initialItemData.item_id) {
          // Find in inventoryItems to get category
          const inv = inventoryItems.find(i => i.id === initialItemData.item_id);
          if (inv?.unit?.unitCategoryId) {
            fetchAvailableUnits(inv.unit.unitCategoryId, inv.unit.id);
          }
        }
      }

      lastExternalDataRef.current = initialItemData;
    }
  }, [initialItemData, inventoryItems, id]);



  // Auto-focus logic for the first row
  useEffect(() => {
    if (isFirstRow && searchInputRef.current) {
      // Small timeout to ensure the component is fully mounted and visible
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isFirstRow]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (quantityTimeoutRef.current) {
        clearTimeout(quantityTimeoutRef.current);
      }
    };
  }, []);

  // ✅ FRONTEND FILTER: Ensure items with <= 0 stock are hidden (Double safety)
  const filteredItems = (query === '' || itemData.item_id)
    ? [] // Hide all items by default when query is empty OR if item is already selected
    : inventoryItems.filter((item) => {
      const lowerQuery = query.toLowerCase();
      const matchesName = item.item_name?.toLowerCase().includes(lowerQuery);
      const matchesBarcode = item.barcode?.toLowerCase().includes(lowerQuery);
      const matchesCode = (item.item_code || item.code)?.toLowerCase().includes(lowerQuery);
      const hasStock = item.current_stock > 0;
      return (matchesName || matchesBarcode || matchesCode) && hasStock;
    });

  // Auto-select logic: If exact barcode match OR only one item remains in the filtered list
  useEffect(() => {
    if (!query || query.trim().length < 3 || initialItemData?.item_id) return;

    const trimmedQuery = query.trim();

    // 1. Check for exact barcode/code match first
    const exactMatch = inventoryItems.find(item => 
      (item.barcode === trimmedQuery || (item.item_code || item.code) === trimmedQuery) && 
      item.current_stock > 0
    );

    if (exactMatch) {
      handleItemSelect(exactMatch);
      setQuery(''); // Clear query to hide dropdown immediately
      toast.success(`Found item: ${exactMatch.item_name}`);
      return;
    }

    // 2. If only one item remains in the filtered list
    if (filteredItems.length === 1) {
      handleItemSelect(filteredItems[0]);
      setQuery(''); // Clear query to hide dropdown immediately
      toast.success(`Auto-selected: ${filteredItems[0].item_name}`);
    }
  }, [query, filteredItems, itemData.item_id, inventoryItems]);

  const handleItemSelect = (item) => {
    if (!item) return;

    console.log('✅ Item selected:', item);

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
      quantity: '1',
      item_total: sellingPrice,
    };

    setItemData(newData);
    lastExternalDataRef.current = newData;

    if (defaultUnit?.symbol) {
      setPlaceholder(defaultUnit.symbol);
    } else {
      setPlaceholder('Qty');
    }

    if (item.unit && item.unit.unitCategoryId) {
      fetchAvailableUnits(item.unit.unitCategoryId, defaultUnit?.id);
    } else {
      setUnits([]);
    }

    // IMMEDIATELY update parent with calculated total to ensure subtotal updates
    onUpdate(id, {
      ...newData,
      item_total: sellingPrice
    });

    // Notify parent to move focus to next row if applicable
    if (typeof onUpdate === 'function') {
      // Very small delay to allow parent state to process the selection
      setTimeout(() => {
        // Find all search inputs and filter only those that are visible in the current viewport
        const allInputs = Array.from(document.querySelectorAll('.item-search-input'))
          .filter(el => el.offsetParent !== null); // Standard way to check for visibility
          
        const currentId = `item-search-${id}`;
        const currentMobileId = `item-search-mobile-${id}`;
        const currentIndex = allInputs.findIndex(el => el.id === currentId || el.id === currentMobileId);
        
        if (currentIndex !== -1 && allInputs[currentIndex + 1]) {
          allInputs[currentIndex + 1].focus();
        } else if (currentIndex === -1 || currentIndex === allInputs.length - 1) {
          // If we're at the last row, wait for the new row to be added and focus it
          setTimeout(() => {
            const updatedInputs = Array.from(document.querySelectorAll('.item-search-input'))
              .filter(el => el.offsetParent !== null);
            if (updatedInputs.length > allInputs.length) {
              updatedInputs[updatedInputs.length - 1].focus();
            }
          }, 150);
        }
      }, 50);
    }
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
    const selectedUnit = units.find(unit => unit.id === selectedUnitId);

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
      // IMMEDIATELY update parent
      onUpdate(id, clearedData);
      return;
    }

    setPlaceholder(selectedUnit.symbol);

    const baseUnitSymbol = originalBaseUnit;
    const newUnitSymbol = selectedUnit.symbol;

    let factor = 1;

    if (baseUnitSymbol === 'kg' && newUnitSymbol === 'g') {
      factor = 1 / 1000;
    } else if (baseUnitSymbol === 'g' && newUnitSymbol === 'kg') {
      factor = 1000;
    } else if (baseUnitSymbol === 'L' && newUnitSymbol === 'ml') {
      factor = 1 / 1000;
    } else if (baseUnitSymbol === 'ml' && newUnitSymbol === 'L') {
      factor = 1000;
    } else if (baseUnitSymbol === 'piece' && newUnitSymbol === 'dozen') {
      factor = 12;
    } else if (baseUnitSymbol === 'dozen' && newUnitSymbol === 'piece') {
      factor = 1 / 12;
    } else {
      factor = 1;
    }

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
      // IMMEDIATELY update parent
      onUpdate(id, { ...newData, conversionFactor: factor });
    }
  };

  // Handle LOCAL quantity changes - FIXED: Update parent immediately
  const handleQuantityChange = (e) => {
    let value = e.target.value;

    // Allow empty string, numbers, and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      // Clear any existing timeout
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
            // Cap to max available
            value = (availableStock / conversionFactor).toString();
            toast.error(`Only ${value} ${itemData.unit_symbol || 'units'} available in stock!`, {
              id: 'stock-limit-toast', // Prevent duplicate toasts
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

      // If empty, update parent immediately with zero total
      if (value === '' || value === '.') {
        const clearedData = {
          ...updatedData,
          item_total: 0
        };
        setItemData(clearedData);
        // IMMEDIATELY update parent
        onUpdate(id, clearedData);
        return;
      }

      // For valid numbers, calculate immediately (no debouncing for better UX)
      calculateTotal(updatedData, value, conversionFactor);
    }
  };

  // Calculate total amount - FIXED: Always update parent
  const calculateTotal = (data, quantityValue, currentConversionFactor = conversionFactor) => {
    const quantity = parseFloat(quantityValue) || 0;
    const price = parseFloat(data.price_per_unit) || 0;
    const total = quantity * currentConversionFactor * price;

    const finalData = {
      ...data,
      item_total: total
    };

    console.log('🧮 ItemRow CALCULATION:', {
      quantity: quantityValue,
      price: price,
      conversionFactor: currentConversionFactor,
      total: total
    });

    // Update local state
    setItemData(finalData);

    // ALWAYS update parent - this is the key fix
    onUpdate(id, { ...finalData, conversionFactor: currentConversionFactor });
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;

    // Allow empty string, numbers, and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const updatedData = {
        ...itemData,
        price_per_unit: value
      };

      setItemData(updatedData);

      // Only calculate total if we have both quantity and valid price
      if (itemData.quantity && value && value !== '.' && !value.endsWith('.')) {
        calculateTotal(updatedData, itemData.quantity, conversionFactor);
      } else {
        // Update parent with current data but zero total
        const clearedData = {
          ...updatedData,
          item_total: 0
        };
        setItemData(clearedData);
        // IMMEDIATELY update parent
        onUpdate(id, clearedData);
      }
    }
  };

  // Allow editing the final item total directly. If quantity exists, derive a new price_per_unit.
  const handleItemTotalChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const numeric = value === '' ? 0 : parseFloat(value);
      const updatedData = {
        ...itemData,
        item_total: numeric
      };

      // If quantity exists, update price_per_unit = item_total / (quantity * conversionFactor)
      if (itemData.quantity && itemData.quantity !== '' && !isNaN(parseFloat(itemData.quantity)) && parseFloat(itemData.quantity) > 0) {
        const qty = parseFloat(itemData.quantity);
        const newPrice = numeric / (qty * conversionFactor) || 0;
        updatedData.price_per_unit = newPrice.toString();
        updatedData.base_price_per_unit = newPrice.toString();
      }

      setItemData(updatedData);
      // Immediately notify parent of change
      onUpdate(id, updatedData);
    }
  };

  const handleRemove = () => {
    console.log('Remove button clicked for item:', id);

    // Clear any pending timeouts
    if (quantityTimeoutRef.current) {
      clearTimeout(quantityTimeoutRef.current);
    }

    // Clear all data in this row
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

    // Call parent's remove function
    onRemove(id);
  };

  if (isMobile) {
    return (
      <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 mb-4 shadow-sm relative active:border-blue-200 transition-all">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 text-blue-600">
            <Package size={18} />
            <span className="font-bold text-sm">Item Details</span>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isOnlyRow}
            className={`p-2 rounded-full transition-colors ${
              isOnlyRow
                ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                : "bg-red-50 text-red-500 hover:bg-red-100"
            }`}
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {/* Item Name */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Select Product
            </label>
            <Combobox value={itemData} onChange={handleItemSelect}>
              <div className="relative">
                <Combobox.Input
                  id={`item-search-mobile-${id}`}
                  className="item-search-input w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8"
                  displayValue={(item) => item.item_name || ''}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                  data-lpignore="true"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  placeholder="Search name or barcode"
                />
                <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-xl ring-1 ring-black/5 focus:outline-none sm:text-sm">
                  {loadingInventory && <div className="px-4 py-2 text-xs text-gray-500">Loading...</div>}
                  {filteredItems.map((item) => (
                    <Combobox.Option
                      key={item.id}
                      value={item}
                      className={({ active }) =>
                        `relative cursor-default select-none py-3 pl-4 pr-4 border-b border-gray-50 last:border-0 ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`
                      }
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="block truncate font-bold text-sm">{item.item_name}</span>
                          <span className="text-[10px] text-gray-500">
                            {item.barcode && <span className="text-blue-600">[{item.barcode}] </span>}
                            {item.category || 'Product'} • Stock: {item.current_stock}
                          </span>
                        </div>
                        <span className="font-bold text-blue-600 text-sm">₹{item.selling_price}</span>
                      </div>
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </div>
            </Combobox>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Unit */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Unit
              </label>
              <div className="relative">
                <select
                  value={itemData.unit_id || ''}
                  onChange={handleUnitChange}
                  className="w-full pl-3 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 appearance-none cursor-pointer disabled:cursor-not-allowed"
                  disabled={!itemData.item_id}
                >
                  <option value="">Select</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.symbol}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Qty ({placeholder})
              </label>
              <input
                type="text"
                value={itemData.quantity}
                onChange={handleQuantityChange}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Price (₹)
              </label>
              <input
                type="text"
                value={itemData.price_per_unit}
                readOnly
                className="w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed focus:outline-none"
              />
            </div>

            {/* Total */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Total (₹)
              </label>
              <input
                type="text"
                value={itemData.item_total || 0}
                readOnly
                className="w-full px-3 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm font-bold text-blue-700 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <tr className="hover:bg-gray-50/80 transition-colors border-b border-gray-50 last:border-0">
      <td className="px-3 py-2">
        <div className="space-y-2">
          <Combobox value={itemData} onChange={handleItemSelect}>
            <div className="relative">
              <Combobox.Input
                id={`item-search-${id}`}
                ref={searchInputRef}
                className="item-search-input w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8 transition-all"
                displayValue={(item) => item.item_name || ''}
                onChange={(event) => setQuery(event.target.value)}
                autoComplete="off"
                data-lpignore="true"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                placeholder="Search name or barcode"
              />
              <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                {loadingInventory && (
                  <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                    Loading items...
                  </div>
                )}

                {!loadingInventory && filteredItems.length === 0 && query !== '' ? (
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
                          <div className="flex gap-2">
                            {item.barcode && <span className="text-[10px] text-blue-600 font-mono">[{item.barcode}]</span>}
                            {item.category && (
                              <span className="text-[10px] text-gray-500">{item.category}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-900 font-medium">
                            ₹{item.selling_price}
                          </span>
                          <div className="text-xs text-gray-500">
                            {/* ✅ VISUAL UPDATE: Show current stock in Dropdown */}
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

      <td className="px-3 py-2">
        <div className="relative">
          <select
            value={itemData.unit_id || ''}
            onChange={handleUnitChange}
            className="w-full pl-2 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer disabled:cursor-not-allowed"
            disabled={!itemData.item_id}
          >
            <option value="">Select Unit</option>
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.symbol})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </td>

      <td className="px-3 py-2">
        <input
          type="text"
          name="quantity"
          value={itemData.quantity}
          onChange={handleQuantityChange}
          placeholder={placeholder}
          className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </td>

      <td className="px-3 py-2">
        <div className="relative">
          <input
            type="text"
            name="price_per_unit"
            value={itemData.price_per_unit}
            readOnly
            className="w-full px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-right text-gray-500 cursor-not-allowed focus:outline-none pr-10"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <span className="text-gray-400 text-[10px] font-bold">₹</span>
          </div>
        </div>
      </td>

      <td className="px-3 py-2">
        <div className="text-right">
          <input
            type="text"
            name="item_total"
            value={itemData.item_total !== undefined && itemData.item_total !== null ? itemData.item_total : ''}
            readOnly
            className="w-full px-2 py-1.5 border-none text-center bg-transparent text-gray-900 font-bold text-sm focus:outline-none"
          />
        </div>
      </td>

      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={handleRemove}
          disabled={isOnlyRow}
          className={`p-2 rounded-lg transition-all active:scale-95 shadow-sm ${
            isOnlyRow
              ? "bg-gray-100 text-gray-300 cursor-not-allowed"
              : "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
          }`}
          title="Remove Item"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}