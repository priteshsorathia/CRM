'use client';
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import { CheckCircle, X, Trash2, Plus, Tag } from "lucide-react";
import Loader from "@/components/Loader";
import { useShop } from "@/context/ShopContext";
import Link from "next/link";
import { getApiBase } from "@/utils/apiBase";

import { isSvgFile } from "@/utils/fileValidation";

export default function ItemForm({ isEdit, initialData, onItemAdded }) {
  const router = useRouter();
  const { currentShop, loading: shopLoading } = useShop();

  // Dynamic shopId from ShopContext
  const shopId = currentShop?.id;

  const [formData, setFormData] = useState({
    item_name: initialData?.item_name || "",
    item_code: initialData?.item_code || "",
    barcode: initialData?.barcode || "",
    category: initialData?.category || "",
    brand: initialData?.brand || "",
    original_price: initialData?.original_price || "",
    selling_price: initialData?.selling_price || "",
    default_quantity: initialData?.default_quantity || "1",
    item_image: initialData?.item_image || "",
    default_unit_id: initialData?.default_unit_id || "",
  });
  const [previewImage, setPreviewImage] = useState(
    initialData?.item_image || null
  );
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]); // ✅ Added Categories State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [catSelectOpen, setCatSelectOpen] = useState(false);
  const [unitSelectOpen, setUnitSelectOpen] = useState(false);

  const API_BASE = getApiBase();

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("data:")) return imagePath;
    if (imagePath.startsWith("/")) return `${API_BASE}${imagePath}`;
    return `${API_BASE}/api/uploads/${imagePath}`;
  };

  // Get authentication token
  const getAuthToken = () => {
    if (typeof window === 'undefined') return null;

    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('authToken') ||
      sessionStorage.getItem('token');

    console.log('🔑 Token retrieved:', token ? 'Yes' : 'No');
    return token;
  };

  // Fetch units AND Categories from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const token = getAuthToken();

        // 1. Fetch Units
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/units`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          setUnits(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch units');
        }

        // 2. ✅ Fetch Categories
        const catResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/get-categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const catResult = await catResponse.json();

        if (catResult.success) {
          setCategories(catResult.data);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        // Set default units if API fails (for development)
        setUnits([
          { id: 1, name: 'Kilogram', symbol: 'kg' },
          { id: 2, name: 'Gram', symbol: 'g' },
          { id: 3, name: 'Liter', symbol: 'L' },
          { id: 4, name: 'Milliliter', symbol: 'ml' },
          { id: 5, name: 'Piece', symbol: 'pc' },
          { id: 6, name: 'Quantity', symbol: 'qty' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const generateBarcode = () => {
    // Generate a 12-digit random number
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  };

  const handleGenerateBarcode = () => {
    const newBarcode = generateBarcode();
    setFormData((prev) => ({ ...prev, barcode: newBarcode }));
    toast.success("New barcode generated");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image file size must be less than 10MB");
        e.target.value = "";
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PNG, JPG, and GIF files are allowed");
        e.target.value = "";
        return;
      }

      if (isSvgFile(file)) {
        e.target.value = "";
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to create initial stock entry
  const createInitialStockEntry = async (itemId, quantity, unitId, originalPrice) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token required');
      }

      const stockData = {
        itemId: parseInt(itemId),
        quantity: parseFloat(quantity),
        unitId: parseInt(unitId),
        stockType: 'in',
        pricePerUnit: originalPrice ? parseFloat(originalPrice) : null,
        totalValue: originalPrice ? parseFloat(originalPrice) * parseFloat(quantity) : null,
        notes: 'Initial stock from item creation',
        shopId: parseInt(shopId)
      };

      console.log('📦 Creating initial stock entry:', stockData);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockData),
      });

      const result = await response.json();
      console.log('📦 Stock creation response:', result);

      if (!response.ok) {
        console.error('Stock entry creation failed:', result.error);
        throw new Error(result.error || 'Failed to create stock entry');
      } else {
        console.log('✅ Stock entry created successfully');
        return true;
      }
    } catch (error) {
      console.error('Error creating stock entry:', error);
      throw error;
    }
  };

  // Function to upload image separately
  const uploadImage = async (itemId) => {
    if (!imageFile) return null;

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token required');
      }

      const imageFormData = new FormData();
      imageFormData.append('image', imageFile);
      imageFormData.append('itemId', itemId);
      imageFormData.append('shopId', shopId);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: imageFormData,
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Image uploaded successfully:', result.data);
        return result.data?.imageUrl;
      } else {
        console.error('Image upload failed:', result.error);
        return null;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // --- CATEGORY MANAGEMENT ---
  const fetchCategories = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/get-categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setIsManagingCategories(true);
      const token = getAuthToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Category added');
        setNewCategoryName("");
        fetchCategories();
      } else {
        toast.error(result.error || 'Failed to add category');
      }
    } catch (err) {
      toast.error('Error adding category');
    } finally {
      setIsManagingCategories(false);
    }
  };

  const handleDeleteCategory = async (id, isExplicit) => {
    if (!isExplicit) {
      toast.error("This category is automatically detected from items and cannot be deleted here.");
      return;
    }

    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      setIsManagingCategories(true);
      const token = getAuthToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Category deleted');
        fetchCategories();
      } else {
        toast.error(result.error || 'Failed to delete category');
      }
    } catch (err) {
      toast.error('Error deleting category');
    } finally {
      setIsManagingCategories(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if shopId is available
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

    // Validation logic
    let errors = {};

    // Validate required fields
    if (!formData.item_name?.trim()) errors.item_name = "Item name is required";
    
    if (!formData.item_code) {
      errors.item_code = "Item code is required";
    } else if (!/^[A-Za-z0-9\-]+$/.test(formData.item_code)) {
      errors.item_code = "Only alphanumeric characters and dashes allowed";
    }

    if (!formData.default_unit_id) errors.default_unit_id = "Default unit is required";

    // Validate prices are numbers and not empty
    if (!formData.original_price || formData.original_price < 0) {
      errors.original_price = "Please enter a valid original price";
    }

    if (!formData.selling_price || formData.selling_price < 0) {
      errors.selling_price = "Please enter a valid selling price";
    }

    if (formData.default_quantity <= 0) {
      errors.default_quantity = "Stock quantity must be greater than 0";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Clear previous errors if successful
    setFormErrors({});

    setIsSubmitting(true);
    setDebugInfo("🔄 Submitting form...");

    try {
      // Use barcode as provided (optional)
      let finalBarcode = formData.barcode.trim();

      // Prepare data for JSON submission - MATCHING YOUR PRISMA SCHEMA EXACTLY
      const submitData = {
        item_name: formData.item_name,
        item_code: formData.item_code,
        barcode: finalBarcode,
        category: formData.category || null,
        brand: formData.brand || null,
        original_price: parseFloat(formData.original_price),
        selling_price: parseFloat(formData.selling_price),
        default_quantity: parseFloat(formData.default_quantity),
        default_unit_id: parseInt(formData.default_unit_id),
        shopId: parseInt(shopId),
        item_image: isEdit ? formData.item_image : null
      };

      console.log('📤 Submitting data:', submitData);
      setDebugInfo(`📤 Submitting to shop: ${shopId}`);

      // Decide URL and method based on create vs update
      const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/inventory`;
      const url = isEdit && initialData?.id
        ? `${baseUrl}/${initialData.id}`
        : baseUrl;
      const method = isEdit ? 'PUT' : 'POST';

      console.log('📡 Making API call to:', method, url);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();
      console.log('📥 Response:', result);

      if (!response.ok) {
        // Check if it's a Prisma schema error
        if (result.error && result.error.includes('price_per_unit')) {
          throw new Error('Backend schema mismatch: price_per_unit field does not exist. Please update backend controller.');
        }
        throw new Error(result.error || `Server returned ${response.status}: ${response.statusText}`);
      }

      if (result.success) {
        setDebugInfo("✅ Item saved successfully");

        let itemId = result.data.id;

        // Upload image if a new one was selected
        if (imageFile) {
          setDebugInfo("🖼️ Uploading image...");
          const imageUrl = await uploadImage(itemId);
          if (imageUrl) {
            setDebugInfo("✅ Image uploaded successfully");
          } else {
            setDebugInfo("⚠️ Item saved but image upload failed");
          }
        }

        // Create initial stock entry for NEW items
        // if (!isEdit && result.data && result.data.id) {
        //   setDebugInfo("📦 Creating stock entry...");
        //   try {
        //     const stockCreated = await createInitialStockEntry(
        //       result.data.id, 
        //       formData.default_quantity, 
        //       formData.default_unit_id, 
        //       formData.original_price
        //     );

        //     if (stockCreated) {
        //       setDebugInfo("✅ Item and stock entry created successfully");
        //     } else {
        //       setDebugInfo("⚠️ Item created but stock entry failed");
        //     }
        //   } catch (stockError) {
        //     console.error('Stock creation error:', stockError);
        //     setDebugInfo(`⚠️ Item created but stock entry failed: ${stockError.message}`);
        //   }
        // }

        // Show success message and redirect to inventory
        const successMessage = result.message || 'Item added successfully';
        toast.success(successMessage);

        // Call the callback if provided
        if (onItemAdded) {
          onItemAdded();
        }

        // Redirect to inventory page
        router.push("/inventory");
        router.refresh();
      } else {
        throw new Error(result.error || 'Failed to save item');
      }

    } catch (error) {
      console.error("❌ Error submitting form:", error);
      setDebugInfo(`❌ Error: ${error.message}`);
      toast.error(`Failed to save item: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading if shop is still loading
  if (shopLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <Loader variant="container" message="Loading shop information..." className="py-8" />
      </div>
    );
  }

  // Show error if no shop is selected
  if (!shopId) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <h2 className="text-lg font-medium text-gray-900 mb-2">No Shop Selected</h2>
          <p className="text-gray-500 mb-4">Please select a shop to add items.</p>
          <button
            onClick={() => router.push('/inventory')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <Loader variant="container" message="Loading data..." className="py-8" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">
          {isEdit ? "Edit Item" : "Add New Item"}
        </h1>
        <BackButton />
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> Using default units. {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {isEdit && (
          <input type="hidden" name="item_id" value={initialData?.id} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="item_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="item_name"
                name="item_name"
                value={formData.item_name}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${formErrors.item_name ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formErrors.item_name && <p className="text-red-500 text-xs mt-1">{formErrors.item_name}</p>}
            </div>

            <div>
              <label
                htmlFor="item_code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Item Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="item_code"
                name="item_code"
                value={formData.item_code}
                onChange={handleChange}
                required
                pattern="[A-Za-z0-9\-]+"
                title="Only alphanumeric characters and dashes allowed"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${formErrors.item_code ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formErrors.item_code && <p className="text-red-500 text-xs mt-1">{formErrors.item_code}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="barcode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Barcode (Optional)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Generate
                </button>
              </div>
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="Enter or generate barcode"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-[10px] text-gray-400 mt-1">If left empty, a barcode will be generated automatically.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              {/* ✅ UPDATED: Category Dropdown with Link */}
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <button 
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  + New
                </button>
              </div>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  onFocus={() => setCatSelectOpen(true)}
                  onBlur={() => setCatSelectOpen(false)}
                  className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 appearance-none bg-transparent bg-none relative z-10 cursor-pointer"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-0">
                  <svg
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${catSelectOpen ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="brand"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Brand
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Image and Stock Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label
              htmlFor="item_image"
              className="block text-sm font-medium text-gray-700"
            >
              Item Image
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
              {previewImage ? (
                <div className="flex flex-col items-center">
                  <img
                    src={getImageUrl(previewImage)}
                    alt="Item preview"
                    className="w-32 h-32 object-contain"
                  />
                  <p className="text-sm text-gray-500 mb-3 mt-2">
                    {isEdit
                      ? "Current image - Upload new to replace"
                      : "Image preview"}
                  </p>
                  <label
                    htmlFor="item_image"
                    className="cursor-pointer bg-primary-50 text-primary-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-100 transition-colors"
                  >
                    Change Image
                  </label>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-3"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <label
                    htmlFor="item_image"
                    className="cursor-pointer bg-primary-50 text-primary-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-100 transition-colors"
                  >
                    Choose Image
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
              <input
                type="file"
                id="item_image"
                name="item_image"
                onChange={handleImageChange}
                accept=".png,.jpg,.jpeg,.gif"
                className="hidden"
              />
            </div>
          </div>

          {/* Stock Field */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="default_quantity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {isEdit ? "Update Stock Quantity" : "Initial Stock Quantity"} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="default_quantity"
                name="default_quantity"
                value={formData.default_quantity}
                onChange={(e) => {
                  // Strip decimals — only whole numbers allowed
                  const val = e.target.value;
                  const intVal = val === '' ? '' : Math.floor(Number(val));
                  handleChange({ target: { name: 'default_quantity', value: intVal } });
                }}
                step="1"
                min="1"
                required
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${formErrors.default_quantity ? 'border-red-500' : 'border-gray-300'}`}
              />
              {formErrors.default_quantity && <p className="text-red-500 text-xs mt-1">{formErrors.default_quantity}</p>}
              <p className="text-xs text-gray-500 mt-1">
                {isEdit
                  ? "Updating this will create a stock adjustment entry"
                  : "Initial stock quantity for this item"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Unit and Price Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="default_unit_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Default Unit <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="default_unit_id"
                name="default_unit_id"
                value={formData.default_unit_id}
                onChange={handleChange}
                onFocus={() => setUnitSelectOpen(true)}
                onBlur={() => setUnitSelectOpen(false)}
                required
                className={`w-full pl-3 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 appearance-none bg-transparent bg-none relative z-10 cursor-pointer ${formErrors.default_unit_id ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol}) {unit.unitCategory ? `- ${unit.unitCategory.name}` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-0">
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${unitSelectOpen ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            {formErrors.default_unit_id && <p className="text-red-500 text-xs mt-1">{formErrors.default_unit_id}</p>}
          </div>
        </div>

        {/* Price Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="original_price"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Original Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="original_price"
              name="original_price"
              value={formData.original_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${formErrors.original_price ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Cost price"
            />
            {formErrors.original_price && <p className="text-red-500 text-xs mt-1">{formErrors.original_price}</p>}
            <p className="text-xs text-gray-500 mt-1">Purchase cost of the item</p>
          </div>

          <div>
            <label
              htmlFor="selling_price"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Selling Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="selling_price"
              name="selling_price"
              value={formData.selling_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${formErrors.selling_price ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Selling price"
            />
            {formErrors.selling_price && <p className="text-red-500 text-xs mt-1">{formErrors.selling_price}</p>}
            <p className="text-xs text-gray-500 mt-1">Price at which you sell to customers</p>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-start">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 sm:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95 ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">
                {isSubmitting ? (
                    isEdit ? "Updating..." : "Adding..."
                ) : isEdit ? (
                    "Update Item"
                ) : (
                    "Add Item"
                )}
              </span>
            </button>
            <div className="flex-1 sm:flex-none">
                <BackButton className="w-full h-full py-3 px-6 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all border-none flex items-center justify-center shadow-sm active:scale-95" />
            </div>
          </div>
        </div>
      </form>

      {/* --- CATEGORY MANAGEMENT MODAL --- */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mt-10 mb-10 overflow-hidden animate-in slide-in-from-top-8 duration-300 border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Tag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Manage Categories</h3>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Add or delete item groups</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-all active:scale-90"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Add Category Form */}
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                   <input
                    type="text"
                    placeholder="New category name..."
                    className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm font-medium"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    disabled={isManagingCategories}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={isManagingCategories || !newCategoryName.trim()}
                  className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 active:scale-95"
                >
                  <Plus className="h-5 w-5" strokeWidth={3} />
                </button>
              </div>

              {/* Category List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Existing Categories</h4>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold">{categories.length}</span>
                </div>
                
                <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar space-y-1.5">
                  {categories.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <Tag className="h-8 w-8 mx-auto text-gray-300 mb-2 opacity-50" />
                      <p className="text-xs font-medium text-gray-400">No categories created yet</p>
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <div 
                        key={cat.id} 
                        className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl group transition-all hover:shadow-md hover:border-blue-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${cat.isExplicit ? 'bg-blue-400' : 'bg-gray-300'}`} />
                          <span className="text-sm font-bold text-gray-700">{cat.name}</span>
                        </div>
                        {cat.isExplicit && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, true)}
                            disabled={isManagingCategories}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                            title="Delete Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t bg-gray-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-gray-100 transition-all shadow-sm active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}