"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FaReceipt, FaTimes, FaTable, FaSearch, FaCheckCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { getApiBase } from "@/utils/apiBase";

export default function QuickInvoiceGenerator() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [orderToken, setOrderToken] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [tables, setTables] = useState([]);
  const [searchTable, setSearchTable] = useState("");
  const [canUseQuickBill, setCanUseQuickBill] = useState(false);

  const API_BASE = getApiBase();
  const isRestaurantRoute = pathname?.includes('/restaurant');

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
      const u = rawUser ? JSON.parse(rawUser) : null;
      const role = String(u?.role || u?.user_role || u?.user?.role || "").trim().toLowerCase();

      const isAdmin =
        role === "admin" ||
        role === "administrator" ||
        role === "owner" ||
        role === "shop_owner" ||
        role === "restaurant_owner" ||
        role.endsWith("_owner");

      const isManager =
        role === "manager" ||
        role === "restaurant_manager" ||
        role === "floor_manager" ||
        role === "supervisor";

      setCanUseQuickBill(isAdmin || isManager);
    } catch {
      setCanUseQuickBill(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchTable("");
      setOrderToken("");
      setTableNumber("");
      if (isRestaurantRoute) {
        fetchTables();
      }
    }
  }, [isOpen, isRestaurantRoute]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        setTables([]);
        return;
      }
      if (!API_BASE) {
        setTables([]);
        return;
      }

      const response = await fetch(`${API_BASE}/api/restaurant/tables`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTables(Array.isArray(data.tables) ? data.tables : []);
      } else {
        setTables([]);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
      setTables([]);
    }
  };

  const handleGenerateBill = () => {
    if (orderToken) {
      router.push(`/restaurant/billing/add?token=${encodeURIComponent(orderToken)}`);
      setIsOpen(false);
      setOrderToken("");
    } else if (tableNumber) {
      router.push(`/restaurant/billing/add?table=${encodeURIComponent(tableNumber)}`);
      setIsOpen(false);
      setTableNumber("");
    }
  };

  const filteredTables = tables.filter(table =>
    table.table_number?.toLowerCase().includes(searchTable.toLowerCase()) ||
    table.name?.toLowerCase().includes(searchTable.toLowerCase())
  );

  // Don't show on bill/invoice generation pages (to avoid confusion) or non-restaurant routes
  if (
    pathname?.includes('/invoices/add') ||
    pathname?.includes('/billing/add') ||
    !isRestaurantRoute ||
    !canUseQuickBill
  ) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] w-16 h-16 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white rounded-full shadow-2xl hover:shadow-[#5655eb]/50 transition-all duration-300 flex items-center justify-center group"
        aria-label="Quick Generate Bill"
        style={{ position: 'fixed' }}
      >
        <FaReceipt className="text-xl group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            />

            {/* Modal Content (Centered) */}
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="pointer-events-auto w-full max-w-md bg-white rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#5655eb] to-[#4338ca] flex items-center justify-center">
                    <FaReceipt className="text-white text-lg" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Quick Bill Generator</h3>
                    <p className="text-xs text-gray-500">Generate bill for any table</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <FaTimes className="text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Order Token Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Token
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ORD-T-03-MKAR4140-8JT9"
                      value={orderToken}
                      onChange={(e) => {
                        setOrderToken(e.target.value);
                        setTableNumber(""); // Clear table if token entered
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                    />
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">OR</span>
                  </div>
                </div>

                {/* Table Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Table
                  </label>
                  
                  {/* Search */}
                  <div className="relative mb-3">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tables"
                      value={searchTable}
                      onChange={(e) => setSearchTable(e.target.value.replace(/\./g, ''))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                    />
                  </div>

                  {/* Tables Grid */}
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                    {filteredTables.map((table) => (
                      <button
                        key={table.id || table.table_number}
                        onClick={() => {
                          setTableNumber(table.table_number);
                          setOrderToken(""); // Clear token if table selected
                        }}
                        className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center overflow-hidden w-full ${
                          tableNumber === table.table_number
                            ? 'border-[#5655eb] bg-[#5655eb]/10'
                            : 'border-gray-200 hover:border-[#5655eb]/50'
                        }`}
                      >
                        <FaTable className={`mx-auto mb-1 ${
                          tableNumber === table.table_number ? 'text-[#5655eb]' : 'text-gray-400'
                        }`} />
                        <div className="text-xs font-medium text-gray-900 truncate w-full" title={table.table_number || table.name}>
                          {table.table_number || table.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Info */}
                {(orderToken || tableNumber) && (
                  <div className="p-3 bg-gradient-to-r from-[#5655eb]/10 to-[#4338ca]/10 rounded-lg border border-[#5655eb]/20">
                    <div className="flex items-center gap-2 text-sm">
                      <FaCheckCircle className="text-green-500" />
                      <span className="text-gray-700">
                        {orderToken ? `Order: ${orderToken}` : `Table: ${tableNumber}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={handleGenerateBill}
                  disabled={!orderToken && !tableNumber}
                  className="w-full px-4 py-2 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generate Bill
                </button>
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
