'use client';

import { useEffect, useState } from "react";
import { useShop } from "@/context/ShopContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

import { isSvgFile } from "@/utils/fileValidation";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken") || localStorage.getItem("token");
};

export default function ComboProductPage() {
  const { currentShop, loading: shopLoading } = useShop();
  const router = useRouter();

  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    price: "",
  });

  const [formErrors, setFormErrors] = useState({});

  const [comboItems, setComboItems] = useState([
    { inventoryItemId: "", quantity: 1 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);

  const shopId = currentShop?.id;

  // Fetch inventory items to select from
  useEffect(() => {
    const fetchItems = async () => {
      if (!shopId) {
        setLoadingItems(false);
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setError("Authentication required. Please log in again.");
        setLoadingItems(false);
        return;
      }

      try {
        setLoadingItems(true);
        setError("");

        const res = await fetch(
          `${API_BASE}/api/inventory/${shopId}?page=1&limit=500`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch inventory items: ${res.status}`);
        }

        const data = await res.json();
        const items = data.data || data.items || [];
        setInventoryItems(items);
      } catch (err) {
        console.error("Error fetching inventory items:", err);
        setError(err.message || "Failed to load inventory items");
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [shopId]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleComboItemChange = (index, field, value) => {
    setComboItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
            ...item,
            [field]:
              field === "quantity" ? (value === "" ? "" : Number(value)) : value,
          }
          : item
      )
    );
  };

  const addComboRow = () => {
    setComboItems((prev) => [...prev, { inventoryItemId: "", quantity: 1 }]);
  };

  const removeComboRow = (index) => {
    setComboItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isSvgFile(file)) {
        e.target.value = "";
        setImageFile(null);
        return;
      }
      setImageFile(file);
    } else {
      setImageFile(null);
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = "Combo Name is required";
    if (!formData.code?.trim()) errors.code = "Combo Code is required";
    if (!formData.price) errors.price = "Combo Price is required";
    else if (Number(formData.price) < 0) errors.price = "Price cannot be negative";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      toast.error("No authentication token found. Please login again.");
      return;
    }

    const validItems = comboItems.filter(
      (ci) => ci.inventoryItemId && Number(ci.quantity) > 0
    );

    if (validItems.length === 0) {
      toast.error("Please add at least one inventory item with quantity.");
      return;
    }

    // Build FormData so we can send image + JSON together
    // (Mirror backend curl format as closely as possible)
    const comboFormData = new FormData();
    comboFormData.append("name", formData.name); // -F "name=Wedding Combo"
    comboFormData.append("code", formData.code); // -F "code=COMBO-001"
    comboFormData.append("description", formData.description || ""); // -F "description=..."
    comboFormData.append(
      "price",
      String(formData.price !== "" ? formData.price : 0)
    ); // -F "price=25000"

    // Send items as JSON string so backend can parse
    // -F "items=[{\"inventoryItemId\":1,\"quantity\":1}, ...]"
    comboFormData.append(
      "items",
      JSON.stringify(
        validItems.map((ci) => ({
          inventoryItemId: Number(ci.inventoryItemId),
          quantity: Number(ci.quantity),
        }))
      )
    );

    // Attach image file if selected  -F "image=@/path/to/file.png"
    if (imageFile) {
      comboFormData.append("image", imageFile);
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/inventory/combo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        // Let browser set proper multipart boundary
        body: comboFormData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        console.error("Combo creation failed:", data);
        toast.error(
          data.error ||
          data.message ||
          `Failed to create combo product (status ${res.status})`
        );
        return;
      }

      toast.success(data.message || "Combo product created successfully");
      router.push("/inventory");
    } catch (err) {
      console.error("Error creating combo product:", err);
      toast.error("Error creating combo product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading shop
  if (shopLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading shop information...</span>
        </div>
      </div>
    );
  }

  if (!currentShop) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center py-8">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Shop Not Selected
          </h2>
          <p className="text-gray-500 mb-4">
            Please select a shop to create combo products.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
            Add Combo Product
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Create a combo product by grouping multiple inventory items with a
            single selling price.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4 mb-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4 sm:space-y-5"
          noValidate
        >
          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Combo Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g. Gold + Silver Combo"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Combo Code<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                placeholder="e.g. COMBO-001"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              {formErrors.code && (
                <p className="text-red-500 text-xs mt-1">{formErrors.code}</p>
              )}
            </div>
          </div>

          {/* Description & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Short description about this combo"
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>

              {/* Combo Image Upload */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Combo Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-xs sm:text-sm"
                />
                <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
                  Optional. Upload an image to represent this combo product.
                </p>
                {imageFile && (
                  <div className="mt-2">
                    <p className="text-[11px] sm:text-xs text-gray-600 mb-1">
                      Preview:
                    </p>
                    <img
                      src={URL.createObjectURL(imageFile)}
                      alt="Combo preview"
                      className="h-20 w-20 rounded object-cover border"
                      onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                    />
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Combo Price (₹)<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full border rounded-lg px-3 py-2 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              {formErrors.price && (
                <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>
              )}
            </div>
          </div>

          {/* Items section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                Combo Items
              </h2>
              <button
                type="button"
                onClick={addComboRow}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                disabled={loadingItems}
              >
                + Add Item
              </button>
            </div>

            {loadingItems ? (
              <div className="text-xs sm:text-sm text-gray-500">
                Loading inventory items...
              </div>
            ) : inventoryItems.length === 0 ? (
              <div className="text-xs sm:text-sm text-gray-500">
                No inventory items found. Please add items first.
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                {comboItems.map((ci, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 sm:gap-3 items-center"
                  >
                    <div className="col-span-7 sm:col-span-8">
                      <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                        Item
                      </label>
                      <div className="relative">
                        <select
                          value={ci.inventoryItemId}
                          onChange={(e) => {
                            handleComboItemChange(
                              index,
                              "inventoryItemId",
                              e.target.value
                            );
                            setOpenDropdownIndex(null);
                          }}
                          onClick={() => setOpenDropdownIndex(prev => prev === index ? null : index)}
                          onBlur={() => setOpenDropdownIndex(null)}
                          className="w-full bg-none appearance-none border rounded-lg px-2 sm:px-3 py-1 sm:py-2 pr-8 text-xs sm:text-sm"
                        >
                          <option value="">Select item</option>
                          {inventoryItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.item_name || item.name || `Item #${item.id}`}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${openDropdownIndex === index ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={ci.quantity}
                        onChange={(e) =>
                          handleComboItemChange(
                            index,
                            "quantity",
                            e.target.value
                          )
                        }
                        className="w-full border rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="col-span-2 flex items-end">
                      {comboItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeComboRow(index)}
                          className="w-full px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm border rounded-lg text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/inventory")}
              className="px-3 sm:px-4 py-2 border rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm text-white bg-primary-600 hover:bg-primary-700 transition ${submitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
              {submitting ? "Saving..." : "Save Combo Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


