"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaShoppingCart, FaPlus, FaMinus, FaTrash, FaCheck, FaTimes, FaSearch, FaTable, FaUsers, FaMobileAlt, FaArrowRight, FaUtensils } from "react-icons/fa";
import { getApiBase } from "@/utils/apiBase";
import PrevNextPager from "@/components/ui/PrevNextPager";

export default function TakeOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTable = searchParams.get("table") || "";
  const editToken = searchParams.get("editToken") || "";
  const API_BASE = getApiBase();

  const [tableNumber, setTableNumber] = useState(selectedTable);
  const [selectedTableData, setSelectedTableData] = useState(null);
  const [availableTables, setAvailableTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [menuPage, setMenuPage] = useState(1);
  const menuPageSize = 10;
  const [isEditMode, setIsEditMode] = useState(false);
  const [editOrderId, setEditOrderId] = useState(null);
  const [editOrderStatus, setEditOrderStatus] = useState("pending");
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [taxRate, setTaxRate] = useState(18);
  const isSubmitting = useRef(false);

  // NOTE: We still recognize legacy "Zomato"/"Swiggy" values for existing orders,
  // but we no longer show them as selectable options in the UI.
  const TAKE_AWAY = "Take away";
  const PLATFORM_VALUES = ["Zomato", "Swiggy", TAKE_AWAY, "Take Away"];
  const rawPlatform = PLATFORM_VALUES.includes(tableNumber) ? tableNumber : "";
  const platform = rawPlatform === "Take Away" ? TAKE_AWAY : rawPlatform;
  const isPlatformOrder = Boolean(platform);
  const isOnlinePlatform = platform === "Zomato" || platform === "Swiggy";

  const resolveImageUrl = (src) => {
    if (!src) return "";
    const s = String(src).trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;
    if (s.startsWith("/")) return `${API_BASE}${s}`;
    return `${API_BASE}/${s}`;
  };

  const loadExistingOrder = async (token) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();

      const response = await fetch(`${API_BASE}/api/restaurant/orders/token/${token}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(err.error || "Order not found");
        return;
      }

      const data = await response.json();
      const order = data.order;
      if (!order) return;

      if (String(order.status || "").toLowerCase() === "cancelled") {
        alert("Cancelled orders cannot be edited.");
        router.push("/restaurant/orders");
        return;
      }

      setIsEditMode(true);
      setEditOrderId(order.id);
      setEditOrderStatus(order.status || "pending");
      setCustomerName(order.customer_name || "");
      setCustomerPhone(order.customer_phone || "");
      setCustomerNotes(order.customer_notes || "");
      setTableNumber(order.table_number || order.platform || "");

      const loadedCart = (order.items || []).map((it, idx) => ({
        id: it.menu_item_id ?? idx + 1,
        menu_item_id: it.menu_item_id ?? null,
        name: it.name,
        price: Number(it.price || 0),
        quantity: Number(it.quantity || 1),
        notes: it.notes || "",
      }));
      setCart(loadedCart);
    } catch (e) {
      console.error("Error loading existing order:", e);
      alert("Failed to load order for edit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
    loadMenuItems();
    loadInvoiceSettings();
  }, []);

  useEffect(() => {
    if (editToken) {
      loadExistingOrder(editToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editToken]);

  useEffect(() => {
    if (tableNumber && availableTables.length > 0) {
      const table = availableTables.find((t) => t.table_number === tableNumber);
      setSelectedTableData(table || null);

      // Auto-fill customer details if table is occupied
      if (table && table.currentCustomer && !isEditMode) {
        setCustomerName(table.currentCustomer.name || "");
        setCustomerPhone(table.currentCustomer.phone || "");
      }
    } else {
      setSelectedTableData(null);
    }
  }, [tableNumber, availableTables, isEditMode]);


  const loadTables = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();

      // Fetch all tables so `?table=T-01` (reserved/occupied) can still be selected for "Add Order".
      const response = await fetch(`${API_BASE}/api/restaurant/tables`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableTables(data.tables || []);
      } else {
        setAvailableTables([]);
      }
    } catch (error) {
      console.error("Error loading tables:", error);
      setAvailableTables([]);
    }
  };


  const loadMenuItems = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();

      const response = await fetch(`${API_BASE}/api/restaurant/menu`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.items || []);
        if (data.items && data.items.length > 0) {
          setActiveCategory("");
        }
      } else {
        setMenuItems([]);
        setActiveCategory("");
      }
    } catch (error) {
      console.error("Error loading menu:", error);
      setMenuItems([]);
      setActiveCategory("");
    }
  };

  const loadInvoiceSettings = async () => {
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();
      const response = await fetch(`${API_BASE}/api/settings/invoice`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.default_tax !== undefined) {
          setTaxRate(Number(data.data.default_tax));
        }
      }
    } catch (error) {
      console.error("Error loading invoice settings:", error);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find((c) => c.id === item.id);
    if (existingItem) {
      setCart(cart.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(cart.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getSubtotal = () => {
    return getTotal();
  };

  const getTax = () => {
    return getSubtotal() * (taxRate / 100);
  };

  const getGrandTotal = () => {
    return getSubtotal() + getTax();
  };

  const handlePlaceOrder = async () => {
    // Prevent double-submission
    if (isSubmitting.current) return;

    if (!tableNumber) {
      alert("Please select a table or Take away");
      return;
    }
    if (cart.length === 0) {
      alert("Please add items to the order");
      return;
    }
    const tableStatus = String(selectedTableData?.status || '').toLowerCase();
    // Allow taking additional orders on a table that is already occupied (common dine-in flow).
    if (!isPlatformOrder && !isEditMode && selectedTableData && !['available', 'reserved', 'occupied'].includes(tableStatus)) {
      alert(`Table ${tableNumber} is ${selectedTableData.status}. Orders can only be created for Available, Reserved, or Occupied tables.`);
      return;
    }

    if (customerName.trim()) {
      const nameLen = customerName.trim().length;
      if (nameLen < 3 || nameLen > 50) {
        alert("Customer name must be between 3 and 50 characters.");
        return;
      }
    }

    const phoneDigits = String(customerPhone || "").replace(/\D/g, "");
    if (customerPhone) {
      if (phoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(phoneDigits) || /^(.)\1{9}$/.test(phoneDigits)) {
        alert("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210, should not be all repeating digits)");
        return;
      }
    }

    if (customerNotes.trim()) {
      const notesLen = customerNotes.trim().length;
      if (notesLen < 3 || notesLen > 200) {
        alert("Notes must be between 3 and 200 characters.");
        return;
      }
    }

    isSubmitting.current = true;
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken") || localStorage.getItem("token");
      const API_BASE = getApiBase();

      const orderData = {
        ...(isPlatformOrder ? { platform } : { table_number: tableNumber }),
        ...(isEditMode ? { order_token: editToken } : {}),
        customer_name: customerName,
        customer_phone: phoneDigits || null,
        items: cart.map((item) => ({
          menu_item_id: item.menu_item_id ?? item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || "",
        })),
        customer_notes: customerNotes,
        status: isEditMode ? editOrderStatus : "pending",
        total_amount: getGrandTotal(),
      };

      const response = await fetch(isEditMode ? `${API_BASE}/api/restaurant/orders/${editOrderId}` : `${API_BASE}/api/restaurant/orders`, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const data = await response.json();

        const customerParam = customerName ? `&customer=${encodeURIComponent(customerName)}` : "";
        const phoneParam = phoneDigits ? `&phone=${encodeURIComponent(phoneDigits)}` : "";
        router.push(
          `/restaurant/orders/receipt?token=${data.order.order_token}&table=${encodeURIComponent(
            tableNumber
          )}&total=${getGrandTotal()}${customerParam}${phoneParam}`
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || (isEditMode ? "Failed to update order" : "Failed to place order"));
      }
    } catch (error) {
      console.error("Error placing order:", error);
      alert(isEditMode ? "Failed to update order" : "Failed to place order");
    } finally {
      isSubmitting.current = false;
      setLoading(false);
    }

  };

  const categories = [
    ...new Set(
      menuItems.map((item) => item.category || item.category_name || "Uncategorized")
    )
  ];

  const filteredMenuItems = menuItems.filter((item) => {
    const trimmedQuery = searchQuery.trim();
    const matchesSearch = !trimmedQuery ? true : item.name.toLowerCase().includes(trimmedQuery.toLowerCase());
    const itemCategory = item.category || item.category_name || "Uncategorized";
    const matchesCategory = !activeCategory || itemCategory === activeCategory;

    // Filter by service type if "Take away" is selected
    const isTakeAwaySelected = tableNumber === TAKE_AWAY || tableNumber === "Take Away";
    const matchesServiceType = !isTakeAwaySelected || (item.service_types && item.service_types.includes("take_away"));

    return matchesSearch && matchesCategory && item.is_available !== false && matchesServiceType;
  });

  const menuPages = Math.max(1, Math.ceil(filteredMenuItems.length / menuPageSize));
  const pagedMenuItems = filteredMenuItems.slice(
    (menuPage - 1) * menuPageSize,
    menuPage * menuPageSize
  );

  useEffect(() => {
    setMenuPage(1);
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    setMenuPage((p) => Math.min(Math.max(1, p), menuPages));
  }, [menuPages]);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      <div className="max-w-7xl mx-auto px-3 lg:px-5 py-3 lg:py-5">
        {/* Header - Table Selection */}
        <div className="mb-4 lg:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Take Order</h1>
                {/* Mobile Selected Summary Badge */}
                <div className="sm:hidden">
                  {isPlatformOrder ? (
                    <div className={`${isOnlinePlatform ? "bg-orange-50 border-orange-200" : "bg-emerald-50 border-emerald-200"} border px-2 py-1 rounded-lg flex items-center gap-1.5`}>
                      {isOnlinePlatform ? (
                        <FaMobileAlt className="text-orange-600" size={10} />
                      ) : (
                        <FaShoppingCart className="text-emerald-600" size={10} />
                      )}
                      <span className={`text-[11px] font-bold ${isOnlinePlatform ? "text-orange-700" : "text-emerald-700"}`}>{platform}</span>
                    </div>
                  ) : tableNumber ? (
                    <div className="bg-green-50 border border-green-200 px-2 py-1 rounded-lg flex items-center gap-1.5">
                      <FaTable className="text-green-600" size={10} />
                      <span className="text-[11px] font-bold text-green-700">{tableNumber}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-medium text-gray-400">No Table Selected</span>
                  )}
                </div>
              </div>
              <p className="text-gray-500 text-xs lg:text-sm mt-0.5 hidden sm:block">Select table or take away and add items</p>
            </div>

            {/* Table Selector - High Visibility */}
            <div className="w-full sm:w-auto min-w-0 sm:max-w-[45%] md:max-w-[55%] lg:max-w-[60%] xl:max-w-[65%]">
              <div className="flex items-center gap-2 min-w-0 w-full">
                <span className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-tight whitespace-nowrap bg-gray-100 px-2 py-1 rounded-md">Order:</span>
                <div className="flex-1 flex items-center gap-1.5 overflow-x-auto thin-scrollbar pb-2 pt-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setTableNumber(TAKE_AWAY)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${tableNumber === TAKE_AWAY
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                      : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                      }`}
                  >
                    Take away
                  </button>
                  {availableTables
                    .slice()
                    .sort((a, b) =>
                      String(a.table_number || "").localeCompare(String(b.table_number || ""), undefined, {
                        numeric: true,
                        sensitivity: "base",
                      })
                    )
                    .map((table) => (
                      <button
                        key={table.table_number}
                        type="button"
                        onClick={() => setTableNumber(table.table_number)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${table.table_number === tableNumber
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                          : (() => {
                            const status = String(table.status || "").toLowerCase();
                            if (status === "reserved") return "bg-orange-50 text-orange-700 border-orange-200";
                            if (status === "occupied") return "bg-red-50 text-red-700 border-red-200";
                            return "bg-white text-gray-600 border-gray-200";
                          })()
                          }`}
                      >
                        {table.table_number}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Desktop Only Detail Badges */}
            <div className="hidden sm:flex items-center gap-3">
              {isPlatformOrder && (
                <div className={`bg-white border rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm ${isOnlinePlatform ? "border-orange-300" : "border-emerald-300"}`}>
                  {isOnlinePlatform ? (
                    <FaMobileAlt className="text-orange-600" size={14} />
                  ) : (
                    <FaShoppingCart className="text-emerald-600" size={14} />
                  )}
                  <span className="text-sm font-bold text-gray-900">{platform}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${isOnlinePlatform ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700"}`}>
                    {isOnlinePlatform ? "Online" : "Take away"}
                  </span>
                </div>
              )}
              {!isPlatformOrder && tableNumber && (
                <div className="bg-white border border-green-300 rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm">
                  <FaTable className="text-green-600" size={14} />
                  <span className="text-sm font-bold text-gray-900">{tableNumber}</span>
                  {selectedTableData && (
                    <>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded text-[10px] font-bold text-gray-500">
                        <FaUsers size={10} /> {selectedTableData.capacity}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${String(selectedTableData.status).toLowerCase() === 'available'
                        ? 'bg-green-50 text-green-700'
                        : String(selectedTableData.status).toLowerCase() === 'reserved'
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-red-50 text-red-700'
                        }`}>
                        {selectedTableData.status}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - 3 Column Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-5">
          {/* Left Column - Categories (Desktop) */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-4">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Categories</h2>
              </div>
              <div className="p-3 space-y-1">
                <button
                  onClick={() => {
                    setActiveCategory("");
                    setSearchQuery("");
                  }}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left ${!activeCategory
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                >
                  All Items
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setActiveCategory(category);
                      setSearchQuery("");
                    }}
                    className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left ${activeCategory === category
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column - Menu Items */}
          <div className="lg:col-span-7">
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search menu items"
                  value={searchQuery}
                  onChange={(e) => {
                    const cleanedVal = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "").trimStart();
                    setSearchQuery(cleanedVal);
                    if (cleanedVal.trim()) {
                      setActiveCategory("");
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-[13px] bg-white shadow-sm transition-all"
                />
              </div>
              {searchQuery.length > 0 && !searchQuery.trim() && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  Search query cannot be empty or only spaces.
                </p>
              )}
            </div>

            {/* Category Tabs - Mobile Only */}
            {!searchQuery && (
              <div className="mb-3 lg:hidden">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  <button
                    onClick={() => setActiveCategory("")}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold text-[11px] transition-all ${!activeCategory
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                      : "bg-white text-gray-600 border border-gray-200"
                      }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full font-bold text-[11px] transition-all ${activeCategory === category
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                        : "bg-white text-gray-600 border border-gray-200"
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Items Grid */}
            {filteredMenuItems.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <FaShoppingCart className="text-gray-300 mx-auto mb-3" size={32} />
                <p className="text-gray-500 font-medium">No items found</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-3 px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 p-3 lg:p-4">
                    {pagedMenuItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-xl p-2.5 lg:p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                    >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center">
                          {(() => {
                            const imgSrc = resolveImageUrl(item.image || item.image_url || item.photo);
                            const placeholder = (
                              <div className="flex flex-col items-center justify-center text-gray-900">
                                <FaUtensils className="mb-0.5 w-3 h-3 lg:w-4 lg:h-4 opacity-40" />
                                <span className="text-[6px] lg:text-[7px] font-bold tracking-[0.1em] uppercase opacity-40 text-center px-1">G-Voice</span>
                              </div>
                            );

                            if (!imgSrc) return placeholder;

                            return (
                              <div className="w-full h-full relative">
                                <img
                                  src={imgSrc}
                                  alt={item.name || "Menu item"}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    if (e.currentTarget.nextSibling) {
                                      e.currentTarget.nextSibling.style.display = "flex";
                                    }
                                  }}
                                />
                                <div style={{ display: 'none' }} className="w-full h-full items-center justify-center">
                                  {placeholder}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {item.food_type && (
                              <div className={`w-3 h-3 border flex items-center justify-center flex-shrink-0 ${item.food_type === 'veg' ? 'border-green-600' :
                                item.food_type === 'non_veg' ? 'border-red-600' : 'border-blue-600'
                                }`}>
                                {item.food_type === 'veg' && <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>}
                                {item.food_type === 'non_veg' && <div className="w-0 h-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-red-600"></div>}
                                {item.food_type === 'beverage' && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                              </div>
                            )}
                            <h3 className="font-bold text-gray-900 text-[13px] lg:text-base truncate leading-tight">{item.name}</h3>
                          </div>
                          <p className="text-xs font-bold text-indigo-600">₹{item.price.toFixed(0)}</p>
                        </div>
                      </div>
                      {cart.find((c) => c.id === item.id) ? (
                        <div className="flex items-center gap-2 bg-indigo-50 rounded-lg border border-indigo-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, cart.find((c) => c.id === item.id).quantity - 1);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-l-lg transition-colors"
                          >
                            <FaMinus size={10} />
                          </button>
                          <span className="px-1.5 py-1 text-[13px] font-bold text-gray-900 min-w-[1.2rem] text-center">
                            {cart.find((c) => c.id === item.id).quantity}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(item.id, cart.find((c) => c.id === item.id).quantity + 1);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-r-lg transition-colors"
                          >
                            <FaPlus size={10} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item);
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold text-[12px] shadow-sm shadow-indigo-100"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                  </div>
                  {menuPages > 1 ? (
                    <PrevNextPager
                      page={menuPage}
                      pages={menuPages}
                      onPageChange={setMenuPage}
                      compact
                    />
                  ) : null}
              </div>
            )}
          </div>

          {/* Right Column - Order Cart (Desktop) */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-4 flex flex-col max-h-[calc(100vh-2rem)]">
              {/* Cart Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">Current Order</h2>
                  {cartItemCount > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                      {cartItemCount}
                    </span>
                  )}
                </div>
                {tableNumber && (
                  <p className="text-xs text-gray-500 mt-1">
                    {isPlatformOrder ? (isOnlinePlatform ? `Online - ${platform}` : platform) : `Table ${tableNumber}`}
                  </p>
                )}
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <FaShoppingCart className="text-gray-300 mx-auto mb-2" size={32} />
                    <p className="text-gray-500 font-medium text-sm">Cart is empty</p>
                    <p className="text-xs text-gray-400 mt-1">Add items to get started</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm mb-0.5">{item.name}</h3>
                          <p className="text-xs text-gray-600">₹{item.price.toFixed(2)} each</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-l-lg transition-colors"
                          >
                            <FaMinus size={10} />
                          </button>
                          <span className="px-2 py-1 text-sm font-bold text-gray-900 min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-r-lg transition-colors"
                          >
                            <FaPlus size={10} />
                          </button>
                        </div>
                        <p className="font-bold text-sm text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t border-gray-200 p-4 space-y-3 bg-white rounded-b-lg">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span className="font-medium">₹{getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>GST ({taxRate}%):</span>
                      <span className="font-medium">₹{getTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-indigo-600">₹{getGrandTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Customer Name (Optional)
                    </label>
                    <input
                      value={customerName}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
                        setCustomerName(cleaned);
                      }}
                      maxLength={50}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Mobile Number (India) (Optional)
                    </label>
                    <input
                      value={customerPhone}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "");
                        setCustomerPhone(cleaned);
                      }}
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                      placeholder="10-digit mobile number"
                    />
                    {customerPhone && String(customerPhone).replace(/\D/g, "").length !== 10 ? (
                      <p className="mt-1 text-[11px] text-red-600">
                        Enter a valid 10-digit number
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={customerNotes}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[.]/g, "");
                        setCustomerNotes(cleaned);
                      }}
                      maxLength={200}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs resize-none"
                      rows="2"
                      placeholder="Special instructions"
                    />
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading || !tableNumber || cart.length === 0}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold text-sm shadow-sm"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FaCheck size={16} />
                    )}
                    {loading
                      ? isEditMode
                        ? "Updating Order..."
                        : "Placing Order..."
                      : isEditMode
                        ? "Update Order"
                        : "Place Order"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Cart Button */}
      {cart.length > 0 && !showMobileCart && (
        <div className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%]">
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full flex items-center justify-between px-6 py-3.5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <FaShoppingCart size={18} />
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-indigo-600">
                  {cartItemCount}
                </span>
              </div>
              <span className="font-bold text-sm tracking-tight">{cartItemCount} Item{cartItemCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm">View Cart • ₹{cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(0)}</span>
              <FaArrowRight size={12} className="opacity-70" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Drawer Overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-all duration-300 ${showMobileCart ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={() => setShowMobileCart(false)}
      />

      {/* Mobile Cart Drawer Content */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 bg-white rounded-t-[2rem] z-[70] transition-transform duration-500 max-h-[92vh] flex flex-col shadow-2xl ${showMobileCart ? "translate-y-0" : "translate-y-full"
          }`}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto my-3 flex-shrink-0" onClick={() => setShowMobileCart(false)} />

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">Current Order</h2>
              {tableNumber && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isPlatformOrder ? (isOnlinePlatform ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100') : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                    {isPlatformOrder ? (isOnlinePlatform ? `Online - ${platform}` : platform) : `Table ${tableNumber}`}
                  </span>
                </div>
              )}
            </div>
            <button onClick={() => setShowMobileCart(false)} className="p-2 bg-gray-50 rounded-full text-gray-400">
              <FaTimes size={14} />
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="py-20 text-center">
              <FaShoppingCart className="text-gray-200 mx-auto mb-4" size={64} />
              <p className="text-gray-500 font-medium">Cart is currently empty</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="divide-y divide-gray-50 -mx-1">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-[13px] truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400 font-semibold">₹{item.price.toFixed(0)} each</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 p-0.5 rounded-lg border border-gray-100">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-indigo-600 shadow-sm"><FaMinus size={8} /></button>
                      <span className="font-bold text-xs min-w-[16px] text-center text-gray-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-indigo-600 shadow-sm"><FaPlus size={8} /></button>
                    </div>
                    <p className="font-bold text-gray-900 text-[13px] min-w-[50px] text-right tracking-tight">₹{(item.price * item.quantity).toFixed(0)}</p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Subtotal</span>
                  <span className="text-gray-600 font-black">₹{getSubtotal().toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>GST ({taxRate}%)</span>
                  <span className="text-gray-600 font-black">₹{getTax().toFixed(0)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-end">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Grand Total</span>
                  <span className="text-2xl font-black text-indigo-600 leading-none">₹{getGrandTotal().toFixed(0)}</span>
                </div>
              </div>

              {/* Customer Inputs */}
              <div className="space-y-3">
                <input
                  value={customerName}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
                    setCustomerName(cleaned);
                  }}
                  maxLength={50}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-[13px] outline-none shadow-sm placeholder:text-gray-300"
                  placeholder="Customer Name (Optional)"
                />
                <input
                  value={customerPhone}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    setCustomerPhone(cleaned);
                  }}
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-[13px] outline-none shadow-sm placeholder:text-gray-300"
                  placeholder="Mobile Number (Optional)"
                />
                <textarea
                  value={customerNotes}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/[.]/g, "");
                    setCustomerNotes(cleaned);
                  }}
                  maxLength={200}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-semibold text-[13px] outline-none resize-none shadow-sm placeholder:text-gray-300"
                  rows="2"
                  placeholder="Special instructions or notes"
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={loading || !tableNumber || cart.length === 0}
                className="w-full py-4.5 bg-indigo-600 text-white rounded-2xl font-black text-base shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-[0.97] transition-all disabled:bg-gray-200 disabled:shadow-none"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FaCheck size={14} />
                    <span>{isEditMode ? 'Update Order' : 'Place Order'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .thin-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .thin-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .thin-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
      `}</style>
    </div>
  );
}
