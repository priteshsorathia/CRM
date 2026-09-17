"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  X,
  CheckCircle,
  Package,
  Hash,
  Tag,
  Scale,
  Banknote,
  ChevronDown
} from "lucide-react";
import Loader from "@/components/Loader";
import { useShop } from "@/context/ShopContext";

export default function QuickItemModal({ isOpen, onClose, onItemAdded }) {
  const { currentShop } = useShop();
  const shopId = currentShop?.id;
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    item_name: "",
    item_code: "",
    category: "",
    default_unit_id: "",
    selling_price: "",
    original_price: "0",
    default_quantity: "0",
  });

  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, mounted, onClose]);

  useEffect(() => {
    if (isOpen && mounted) {
      fetchData();
      // Reset errors
      setErrors({});
      // Clear form except default quantities
      setFormData(prev => ({
        ...prev,
        item_name: "",
        item_code: "",
        category: "",
        default_unit_id: "",
        selling_price: "",
      }));
    }
  }, [isOpen, mounted]);

  const getAuthToken = () => {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("token")
    );
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      // Parallel fetch for speed
      const [unitRes, catRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/units`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/get-categories`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const [unitData, catData] = await Promise.all([
        unitRes.json(),
        catRes.json()
      ]);

      if (unitData.success) setUnits(unitData.data);
      if (catData.success) {
        setCategories(catData.data);
        console.log("📂 Categories loaded in modal:", catData.data.length);
      }
    } catch (e) {
      console.error("Failed to fetch modal data", e);
      toast.error("Failed to load units or categories");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const [unitSelectOpen, setUnitSelectOpen] = useState(false);
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    // item_name
    if (!formData.item_name.trim()) {
      newErrors.item_name = "Item name is required";
    } else if (formData.item_name.length > 100) {
      newErrors.item_name = "Item name cannot exceed 100 characters";
    } else if (/[<>]/.test(formData.item_name)) {
      newErrors.item_name = "Special characters < and > are not allowed";
    }

    // item_code
    if (formData.item_code.trim()) {
      if (formData.item_code.length > 50) {
        newErrors.item_code = "Item code cannot exceed 50 characters";
      } else if (!/^[A-Za-z0-9\-]+$/.test(formData.item_code.trim())) {
        newErrors.item_code = "Only alphanumeric characters and dashes allowed";
      }
    }

    // default_unit_id
    if (!formData.default_unit_id) {
      newErrors.default_unit_id = "Default unit is required";
    }

    // selling_price
    const sellPrice = parseFloat(formData.selling_price);
    if (!formData.selling_price || isNaN(sellPrice) || sellPrice < 0) {
      newErrors.selling_price = "Selling price must be a valid positive number";
    } else if (sellPrice > 9999999) {
      newErrors.selling_price = "Price cannot exceed 9,999,999";
    }

    // original_price
    if (formData.original_price) {
      const origPrice = parseFloat(formData.original_price);
      if (isNaN(origPrice) || origPrice < 0) {
        newErrors.original_price = "Original price must be a valid positive number";
      } else if (origPrice > 9999999) {
        newErrors.original_price = "Price cannot exceed 9,999,999";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // 👈 VERY IMPORTANT: Prevent bubbling to parent InvoiceForm
    }
    
    if (!shopId) {
      toast.error("No shop selected. Please check your shop profile.");
      return;
    }

    if (!validate()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("Session expired. Please login again.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Auto-generate item code if empty
      const finalItemCode = formData.item_code.trim() || 
        `ITM-${Date.now().toString().slice(-6)}`;

      const submitData = {
        ...formData,
        item_code: finalItemCode,
        original_price: parseFloat(formData.original_price) || 0,
        selling_price: parseFloat(formData.selling_price) || 0,
        default_quantity: parseFloat(formData.default_quantity) || 0,
        default_unit_id: parseInt(formData.default_unit_id),
        shopId: parseInt(shopId),
        category: formData.category || null,
      };

      console.log("🚀 Submitting new item:", submitData);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/inventory`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submitData),
        }
      );

      const result = await response.json();
      if (result.success) {
        onItemAdded(result.data);
        onClose();
      } else {
        console.error("Submission failed:", result);
        toast.error(result.error || "Failed to add item");
      }
    } catch (error) {
      console.error("Error submitting item:", error);
      toast.error("An error occurred while adding the item");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
      <div 
        className="my-auto bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                Quick Add Item
              </h2>
              <p className="text-xs text-gray-400 font-medium">Add to inventory & current invoice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-gray-400 group"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="text-sm font-medium text-gray-500">Loading resources...</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                {/* Item Name */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-blue-500" /> Item Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleChange}
                    placeholder="e.g. Basmati Rice"
                    className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.item_name ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium`}
                    autoFocus
                  />
                  {errors.item_name && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.item_name}</p>}
                </div>

                {/* Item Code */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-500" /> Code
                  </label>
                  <input
                    name="item_code"
                    value={formData.item_code}
                    onChange={handleChange}
                    placeholder="Auto-generated"
                    className={`w-full px-4 py-2.5 bg-gray-50 border ${errors.item_code ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium`}
                  />
                  {errors.item_code && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.item_code}</p>}
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-500" /> Category
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      onFocus={() => setCategorySelectOpen(true)}
                      onBlur={() => setCategorySelectOpen(false)}
                      className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium appearance-none cursor-pointer"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${categorySelectOpen ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </div>

                {/* Default Unit */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-500" /> Unit <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="default_unit_id"
                      value={formData.default_unit_id}
                      onChange={handleChange}
                      onFocus={() => setUnitSelectOpen(true)}
                      onBlur={() => setUnitSelectOpen(false)}
                      className={`w-full pl-4 pr-10 py-2.5 bg-gray-50 border ${errors.default_unit_id ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-medium appearance-none cursor-pointer`}
                    >
                      <option value="">Select Unit</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.symbol})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${unitSelectOpen ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                  {errors.default_unit_id && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.default_unit_id}</p>}
                </div>

                {/* Selling Price */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-blue-500" /> Selling Price <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      name="selling_price"
                      value={formData.selling_price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={`w-full pl-8 pr-4 py-2.5 bg-gray-50 border ${errors.selling_price ? 'border-red-300 bg-red-50' : 'border-gray-200'} rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-sm font-bold text-blue-600`}
                    />
                  </div>
                  {errors.selling_price && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.selling_price}</p>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 group"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       <span>Adding...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Add Item to Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
}
