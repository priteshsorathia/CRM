'use client';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  FaArrowLeft,
  FaImage,
  FaUtensils,
  FaShoppingBag,
  FaMotorcycle,
  FaSpinner,
  FaSave,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes
} from "react-icons/fa";
import { toast } from "sonner";
import RestaurantLoader from "@/components/RestaurantLoader";
import { getApiBase } from "@/utils/apiBase";
import Image from "next/image";
import AccessDenied from "@/components/AccessDenied";
import { isSvgFile } from "@/utils/fileValidation";

const API_BASE = getApiBase();

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
      const u = rawUser ? JSON.parse(rawUser) : null;
      const role = String(u?.role || u?.user_role || u?.user?.role || "").trim().toLowerCase();

      const isAllowed =
        role === "admin" ||
        role === "administrator" ||
        role === "owner" ||
        role === "shop_owner" ||
        role === "restaurant_owner" ||
        role.endsWith("_owner") ||
        role === "manager" ||
        role === "restaurant_manager";

      setHasAccess(isAllowed);
      setAccessChecked(true);
    } catch {
      setHasAccess(false);
      setAccessChecked(true);
    }
  }, []);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageTab, setManageTab] = useState('category');
  const [categoryError, setCategoryError] = useState("");
  const [subCategoryError, setSubCategoryError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, type: '', id: null, name: '' });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (deleteConfirm.show) {
          setDeleteConfirm({ show: false, type: '', id: null, name: '' });
        } else if (showManageModal) {
          setShowManageModal(false);
        }
      }
    };
    if (showManageModal || deleteConfirm.show) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showManageModal, deleteConfirm.show]);

  const validateCategoryName = (name) => {
    if (name === undefined || name === null || String(name).trim() === "") {
      return "Name is required and cannot be empty spaces";
    }
    if (hasHtmlOrScript(name)) {
      return "HTML tags or scripts are not allowed";
    }
    if (String(name).trim().length < 3) {
      return "Name must be at least 3 characters";
    }
    if (String(name).length > 30) {
      return "Name cannot exceed 30 characters";
    }
    return "";
  };
  const [categoryForm, setCategoryForm] = useState({ name: '', food_type: 'veg' });
  const [subCategoryForm, setSubCategoryForm] = useState({ name: '', category_id: '' });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingSubCategoryId, setEditingSubCategoryId] = useState(null);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const hasHtmlOrScript = (str) => {
    const htmlRegex = /<[^>]*>/g;
    const scriptRegex = /javascript:/gi;
    return htmlRegex.test(str) || scriptRegex.test(str);
  };

  const validateField = (name, value, currentFormData = formData) => {
    let error = "";
    if (name === "name") {
      if (value === undefined || value === null || String(value).trim() === "") {
        error = "Item name is required and cannot be empty spaces";
      } else if (hasHtmlOrScript(value)) {
        error = "HTML tags or script values are not allowed";
      } else if (String(value).trim().length < 3) {
        error = "Item name must be at least 3 characters";
      } else if (String(value).length > 50) {
        error = "Item name cannot exceed 50 characters";
      }
    } else if (name === "price") {
      if (value === undefined || value === null || value === "" || String(value).trim() === "") {
        error = "Price is required";
      } else {
        const valNum = parseFloat(value);
        if (isNaN(valNum) || valNum <= 0) {
          error = "Price must be greater than 0";
        } else if (currentFormData.original_price !== undefined && currentFormData.original_price !== null && currentFormData.original_price !== "") {
          const origNum = parseFloat(currentFormData.original_price);
          if (!isNaN(origNum) && valNum > origNum) {
            error = "Sale Price should not be greater than Original Price";
          }
        }
      }
    } else if (name === "original_price") {
      if (value !== undefined && value !== null && value !== "" && String(value).trim() !== "") {
        const valNum = parseFloat(value);
        if (isNaN(valNum) || valNum <= 0) {
          error = "Original price must be greater than 0";
        } else if (currentFormData.price !== undefined && currentFormData.price !== null && currentFormData.price !== "") {
          const priceNum = parseFloat(currentFormData.price);
          if (!isNaN(priceNum) && priceNum > valNum) {
            error = "Original Price must be greater than or equal to Sale Price";
          }
        }
      }
    } else if (name === "description") {
      if (value !== undefined && value !== null && value !== "") {
        if (hasHtmlOrScript(value)) {
          error = "HTML tags or script values are not allowed";
        } else if (String(value).length > 200) {
          error = "Description cannot exceed 200 characters";
        }
      }
    }
    setErrors(prev => {
      const next = { ...prev, [name]: error };
      if (name === "original_price" && !error) {
        const valNum = parseFloat(value);
        const priceNum = parseFloat(currentFormData.price);
        if (!isNaN(valNum) && !isNaN(priceNum) && priceNum > valNum) {
          next.price = "Sale Price should not be greater than Original Price";
        } else if (next.price === "Sale Price should not be greater than Original Price" || next.price === "Original Price must be greater than or equal to Sale Price") {
          next.price = "";
        }
      }
      if (name === "price" && !error) {
        if (next.original_price === "Original Price must be greater than or equal to Sale Price" || next.original_price === "Sale Price should not be greater than Original Price") {
          const valNum = parseFloat(value);
          const origNum = parseFloat(currentFormData.original_price);
          if (!isNaN(valNum) && !isNaN(origNum) && origNum >= valNum) {
            next.original_price = "";
          }
        }
      }
      return next;
    });
    return error;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    food_type: 'veg',
    category_id: '',
    sub_category_id: '',
    service_types: [],
    add_ons: [],
    is_available: true,
    image: null
  });

  useEffect(() => {
    if (id && accessChecked && hasAccess) {
      loadData();
    }
  }, [id, accessChecked, hasAccess]);

  const loadData = async () => {
    if (!accessChecked || !hasAccess) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      // Load menu item and related data
      const [itemRes, categoriesRes, subCategoriesRes, addOnsRes] = await Promise.all([
        fetch(`${API_BASE}/api/restaurant/menu/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE}/api/restaurant/menu/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE}/api/restaurant/menu/sub-categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE}/api/restaurant/menu/add-ons`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null)
      ]);

      if (itemRes?.ok) {
        const itemData = await itemRes.json();
        const item = itemData.item || itemData;
        setFormData({
          name: item.name || '',
          description: item.description || '',
          price: item.price || '',
          original_price: item.original_price || '',
          food_type: item.food_type || 'veg',
          category_id: item.category_id || '',
          sub_category_id: item.sub_category_id || '',
          service_types: item.service_types || [],
          add_ons: item.add_ons || [],
          is_available: item.is_available !== false,
          image: item.image || null
        });
        setImagePreview(item.image);
      } else {
        toast.error('Failed to load menu item');
        router.push('/restaurant/menu');
      }

      if (categoriesRes?.ok) {
        const catData = await categoriesRes.json();
        setCategories(catData.categories || []);
      } else {
        setCategories([]);
      }

      if (subCategoriesRes?.ok) {
        const subCatData = await subCategoriesRes.json();
        setSubCategories(subCatData.subCategories || []);
      } else {
        setSubCategories([]);
      }

      if (addOnsRes?.ok) {
        const addOnsData = await addOnsRes.json();
        setAddOns(addOnsData.addOns || []);
      } else {
        setAddOns([]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (isSvgFile(file)) {
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    setUploading(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE}/api/restaurant/menu/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, image: data.imageUrl }));
        setImagePreview(data.imageUrl);
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleCategorySelect = (value) => {
    setFormData(prev => ({ ...prev, category_id: value, sub_category_id: '' }));
  };

  const handleSubCategorySelect = (value) => {
    setFormData(prev => ({ ...prev, sub_category_id: value }));
  };

  const handleAddCategory = async () => {
    const err = validateCategoryName(categoryForm.name);
    if (err) {
      setCategoryError(err);
      return;
    }
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/restaurant/menu/categories`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryForm.name.trim(), food_type: categoryForm.food_type })
      });
      if (response.ok) {
        setCategoryForm({ name: '', food_type: 'veg' });
        setCategoryError("");
        loadData();
        toast.success('Category added successfully');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to add category');
      }
    } catch {
      toast.error('Failed to add category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategoryId) return;
    const err = validateCategoryName(categoryForm.name);
    if (err) {
      setCategoryError(err);
      return;
    }
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/restaurant/menu/categories/${editingCategoryId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryForm.name.trim(), food_type: categoryForm.food_type })
      });
      if (response.ok) {
        setEditingCategoryId(null);
        setCategoryForm({ name: '', food_type: 'veg' });
        setCategoryError("");
        loadData();
        toast.success('Category updated successfully');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to update category');
      }
    } catch {
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/restaurant/menu/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        loadData();
        toast.error('Category deleted successfully');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to delete category');
      }
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const handleAddSubCategory = async () => {
    const err = validateCategoryName(subCategoryForm.name);
    if (err) {
      setSubCategoryError(err);
      return;
    }
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/restaurant/menu/sub-categories`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: subCategoryForm.name.trim(), category_id: subCategoryForm.category_id || null })
      });
      if (response.ok) {
        setSubCategoryForm({ name: '', category_id: '' });
        setSubCategoryError("");
        loadData();
        toast.success('Sub-category added successfully');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to add sub-category');
      }
    } catch {
      toast.error('Failed to add sub-category');
    }
  };

  const handleUpdateSubCategory = async () => {
    if (!editingSubCategoryId) return;
    const err = validateCategoryName(subCategoryForm.name);
    if (err) {
      setSubCategoryError(err);
      return;
    }
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/restaurant/menu/sub-categories/${editingSubCategoryId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: subCategoryForm.name.trim(), category_id: subCategoryForm.category_id || null })
      });
      if (response.ok) {
        setEditingSubCategoryId(null);
        setSubCategoryForm({ name: '', category_id: '' });
        setSubCategoryError("");
        loadData();
        toast.success('Sub-category updated successfully');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to update sub-category');
      }
    } catch {
      toast.error('Failed to update sub-category');
    }
  };

  const handleDeleteSubCategory = async (id) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/restaurant/menu/sub-categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        loadData();
        toast.error('Sub-category deleted successfully');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to delete sub-category');
      }
    } catch {
      toast.error('Failed to delete sub-category');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameErr = validateField("name", formData.name);
    const priceErr = validateField("price", formData.price);
    const origErr = validateField("original_price", formData.original_price);
    const descErr = validateField("description", formData.description);
    
    setTouched({ name: true, price: true, original_price: true, description: true });
    
    if (nameErr || priceErr || origErr || descErr) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/restaurant/menu/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          original_price: formData.original_price ? parseFloat(formData.original_price) : null,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          sub_category_id: formData.sub_category_id ? parseInt(formData.sub_category_id) : null
        })
      });

      if (response.ok) {
        toast.success('Menu item updated successfully');
        router.push('/restaurant/menu');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update menu item');
      }
    } catch (err) {
      console.error('Error updating menu item:', err);
      toast.error('Failed to update menu item');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleServiceType = (type) => {
    setFormData(prev => ({
      ...prev,
      service_types: prev.service_types.includes(type)
        ? prev.service_types.filter(t => t !== type)
        : [...prev.service_types, type]
    }));
  };

  const toggleAddOn = (addOnId) => {
    setFormData(prev => ({
      ...prev,
      add_ons: prev.add_ons.includes(addOnId)
        ? prev.add_ons.filter(id => id !== addOnId)
        : [...prev.add_ons, addOnId]
    }));
  };

  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RestaurantLoader variant="container" message="Verifying access..." />
      </div>
    );
  }

  if (!hasAccess) {
    return <AccessDenied homeHref="/restaurant/tables" homeLabel="Go to Tables" message="Editing menu items is restricted to Owners and Managers only." />;
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <RestaurantLoader variant="container" message="Loading menu item..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/restaurant/menu"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FaArrowLeft />
            Back
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
            Edit Menu Item
          </h1>
          <p className="text-gray-600 text-sm">
            Update menu item details
          </p>
        </div>

        {/* Form - Same as Add Page */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Image</label>
            <div className="flex items-center gap-4">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
                {imagePreview ? (
                  <img
                    src={imagePreview.startsWith('http') || imagePreview.startsWith('blob:') ? imagePreview : `${API_BASE}${imagePreview}`}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <FaImage className="text-gray-900 text-2xl" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <span className="px-4 py-2 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white rounded-lg hover:shadow-lg transition-all font-medium inline-flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base">
                    {uploading ? <FaSpinner className="animate-spin text-base shrink-0" /> : <FaImage className="text-base shrink-0" />}
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={formData.name}
                onBlur={() => handleBlur("name")}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, name: val }));
                  if (touched.name) validateField("name", val);
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb] ${
                  touched.name && errors.name ? 'border-rose-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Margherita Pizza"
              />
              {touched.name && errors.name && (
                <p className="text-rose-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Food Type <span className="text-rose-500">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    value: 'veg',
                    label: 'Veg',
                    icon: (
                      <div className="w-8 h-8 border-2 border-green-600 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-green-600"></div>
                      </div>
                    )
                  },
                  {
                    value: 'non_veg',
                    label: 'Non-Veg',
                    icon: (
                      <div className="w-8 h-8 border-2 border-red-600 flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-red-600"></div>
                      </div>
                    )
                  },
                  {
                    value: 'beverage',
                    label: 'Beverage',
                    icon: (
                      <div className="w-8 h-8 border-2 border-blue-600 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-blue-600"></div>
                      </div>
                    )
                  }
                ].map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, food_type: type.value }))}
                    className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${formData.food_type === type.value
                      ? 'border-[#5655eb] bg-[#5655eb]/10'
                      : 'border-gray-200 hover:border-[#5655eb]/50'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="scale-75 sm:scale-100">
                        {type.icon}
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onBlur={() => handleBlur("description")}
              onChange={(e) => {
                const val = e.target.value;
                setFormData(prev => ({ ...prev, description: val }));
                if (touched.description) validateField("description", val);
              }}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb] ${
                touched.description && errors.description ? 'border-rose-500' : 'border-gray-300'
              }`}
              placeholder="Item description"
            />
            {touched.description && errors.description && (
              <p className="text-rose-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.price}
                onBlur={() => handleBlur("price")}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => {
                    const next = { ...prev, price: val };
                    validateField("price", val, next);
                    if (touched.original_price) validateField("original_price", prev.original_price, next);
                    return next;
                  });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb] ${
                  touched.price && errors.price ? 'border-rose-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {touched.price && errors.price && (
                <p className="text-rose-500 text-xs mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Original Price (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.original_price}
                onBlur={() => handleBlur("original_price")}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => {
                    const next = { ...prev, original_price: val };
                    validateField("original_price", val, next);
                    if (touched.price) validateField("price", prev.price, next);
                    return next;
                  });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb] ${
                  touched.original_price && errors.original_price ? 'border-rose-500' : 'border-gray-300'
                }`}
                placeholder="Optional (for discounts)"
              />
              {touched.original_price && errors.original_price && (
                <p className="text-rose-500 text-xs mt-1">{errors.original_price}</p>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <button
                  type="button"
                  onClick={() => { setManageTab('category'); setShowManageModal(true); }}
                  className="text-xs font-bold text-[#5655eb] hover:underline"
                >
                  Manage Categories
                </button>
              </div>
              <select
                value={formData.category_id}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Sub-Category</label>
                <button
                  type="button"
                  onClick={() => { setManageTab('subCategory'); setShowManageModal(true); }}
                  className="text-xs font-bold text-[#5655eb] hover:underline"
                >
                  Manage Sub Categories
                </button>
              </div>
              <select
                value={formData.sub_category_id}
                onChange={(e) => handleSubCategorySelect(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                disabled={!formData.category_id}
              >
                <option value="">Select Sub-Category</option>
                {subCategories
                  .filter(sub => sub.category_id === parseInt(formData.category_id))
                  .map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Service Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available For</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {[
                { value: 'dine_in', label: 'Dine In', icon: <FaUtensils className="text-base shrink-0" /> },
                { value: 'take_away', label: 'Take Away', icon: <FaShoppingBag className="text-base shrink-0" /> },
                { value: 'delivery', label: 'Delivery', icon: <FaMotorcycle className="text-base shrink-0" /> }
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleServiceType(type.value)}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${formData.service_types.includes(type.value)
                    ? 'border-[#5655eb] bg-[#5655eb]/10 text-[#5655eb]'
                    : 'border-gray-200 hover:border-[#5655eb]/50 text-gray-700'
                    }`}
                >
                  {type.icon}
                  <span className="text-xs sm:text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>


          {/* Availability */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_available"
              checked={formData.is_available}
              onChange={(e) => setFormData(prev => ({ ...prev, is_available: e.target.checked }))}
              className="rounded border-gray-300 text-[#5655eb] focus:ring-[#5655eb]"
            />
            <label htmlFor="is_available" className="text-sm font-medium text-gray-700">
              Item is available
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Link
              href="/restaurant/menu"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <FaSave />
                  Update Item
                </>
              )}
            </button>
          </div>
        </form>

        {showManageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {manageTab === 'category' ? 'Manage Categories' : 'Manage Sub Categories'}
                </h2>
                <button
                  onClick={() => {
                    setShowManageModal(false);
                    setCategoryError("");
                    setSubCategoryError("");
                  }}
                  className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setManageTab('category')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${manageTab === 'category' ? 'bg-[#5655eb] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Categories
                </button>
                <button
                  type="button"
                  onClick={() => setManageTab('subCategory')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${manageTab === 'subCategory' ? 'bg-[#5655eb] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Sub-Categories
                </button>
              </div>

              {manageTab === 'category' && (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 items-start">
                    <div>
                      <input
                        type="text"
                        value={categoryForm.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCategoryForm({ ...categoryForm, name: val });
                          setCategoryError(validateCategoryName(val));
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb] ${
                          categoryError ? 'border-rose-500' : 'border-gray-300'
                        }`}
                        placeholder="Category name"
                      />
                      {categoryError && (
                        <p className="text-rose-500 text-xs mt-1">{categoryError}</p>
                      )}
                    </div>
                    <div>
                      <select
                        value={categoryForm.food_type}
                        onChange={(e) => setCategoryForm({ ...categoryForm, food_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                      >
                        <option value="veg">Veg</option>
                        <option value="non_veg">Non-Veg</option>
                        <option value="beverage">Beverage</option>
                      </select>
                    </div>
                    <div className="flex gap-2 w-full">
                      {editingCategoryId ? (
                        <>
                          <button type="button" onClick={handleUpdateCategory} title="Update Category" className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center w-full"><FaCheck className="text-base" /></button>
                          <button type="button" onClick={() => { setEditingCategoryId(null); setCategoryForm({ name: '', food_type: 'veg' }); setCategoryError(""); }} title="Cancel Edit" className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors flex items-center justify-center w-full"><FaTimes className="text-base" /></button>
                        </>
                      ) : (
                        <button type="button" onClick={handleAddCategory} title="Add Category" className="p-2 bg-[#5655eb] hover:bg-[#4338ca] text-white rounded-lg transition-colors flex items-center justify-center w-full"><FaPlus className="text-base" /></button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                        <div className="text-sm text-gray-800 font-medium">{cat.name}</div>
                        <div className="flex gap-1.5">
                          <button type="button" onClick={() => { setEditingCategoryId(cat.id); setCategoryForm({ name: cat.name, food_type: cat.food_type || 'veg' }); setCategoryError(""); }} title="Edit Category" className="p-1.5 text-slate-500 hover:text-[#5655eb] hover:bg-[#5655eb]/10 rounded-lg transition-all"><FaEdit className="text-base" /></button>
                          <button type="button" onClick={() => setDeleteConfirm({ show: true, type: 'category', id: cat.id, name: cat.name })} title="Delete Category" className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><FaTrash className="text-base" /></button>
                        </div>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-4">No categories yet.</div>
                    )}
                  </div>
                </div>
              )}

              {manageTab === 'subCategory' && (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 items-start">
                    <div>
                      <input
                        type="text"
                        value={subCategoryForm.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubCategoryForm({ ...subCategoryForm, name: val });
                          setSubCategoryError(validateCategoryName(val));
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb] ${
                          subCategoryError ? 'border-rose-500' : 'border-gray-300'
                        }`}
                        placeholder="Sub-category name"
                      />
                      {subCategoryError && (
                        <p className="text-rose-500 text-xs mt-1">{subCategoryError}</p>
                      )}
                    </div>
                    <div>
                      <select
                        value={subCategoryForm.category_id}
                        onChange={(e) => setSubCategoryForm({ ...subCategoryForm, category_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                      >
                        <option value="">No Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2 w-full">
                      {editingSubCategoryId ? (
                        <>
                          <button type="button" onClick={handleUpdateSubCategory} title="Update Sub-category" className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center w-full"><FaCheck className="text-base" /></button>
                          <button type="button" onClick={() => { setEditingSubCategoryId(null); setSubCategoryForm({ name: '', category_id: '' }); setSubCategoryError(""); }} title="Cancel Edit" className="p-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors flex items-center justify-center w-full"><FaTimes className="text-base" /></button>
                        </>
                      ) : (
                        <button type="button" onClick={handleAddSubCategory} title="Add Sub-category" className="p-2 bg-[#5655eb] hover:bg-[#4338ca] text-white rounded-lg transition-colors flex items-center justify-center w-full"><FaPlus className="text-base" /></button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {subCategories.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                        <div className="text-sm text-gray-800 font-medium">{sub.name}</div>
                        <div className="flex gap-1.5">
                          <button type="button" onClick={() => { setEditingSubCategoryId(sub.id); setSubCategoryForm({ name: sub.name, category_id: sub.categoryId || sub.category_id || '' }); setSubCategoryError(""); }} title="Edit Sub-category" className="p-1.5 text-slate-500 hover:text-[#5655eb] hover:bg-[#5655eb]/10 rounded-lg transition-all"><FaEdit className="text-base" /></button>
                          <button type="button" onClick={() => setDeleteConfirm({ show: true, type: 'subCategory', id: sub.id, name: sub.name })} title="Delete Sub-category" className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><FaTrash className="text-base" /></button>
                        </div>
                      </div>
                    ))}
                    {subCategories.length === 0 && (
                      <div className="text-sm text-gray-500 text-center py-4">No sub-categories yet.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-65 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-lg font-bold text-gray-950 mb-2">Confirm Delete</h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to permanently delete the {deleteConfirm.type === 'category' ? 'category' : 'sub-category'}{' '}
                <strong className="text-rose-600">"{deleteConfirm.name}"</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm({ show: false, type: '', id: null, name: '' })}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const { type, id } = deleteConfirm;
                    setDeleteConfirm({ show: false, type: '', id: null, name: '' });
                    if (type === 'category') {
                      await handleDeleteCategory(id);
                    } else {
                      await handleDeleteSubCategory(id);
                    }
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
