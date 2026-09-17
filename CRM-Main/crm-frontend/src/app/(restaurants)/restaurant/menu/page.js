'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaUtensils,
  FaShoppingBag,
  FaMotorcycle,
  FaHistory,
  FaChevronDown,
  FaTimesCircle,
} from "react-icons/fa";
import { toast } from "sonner";
import RestaurantLoader from "@/components/RestaurantLoader";
import { getApiBase } from "@/utils/apiBase";
import PrevNextPager from "@/components/ui/PrevNextPager";
import AccessDenied from "@/components/AccessDenied";

const API_BASE = getApiBase();

export default function MenuManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const [selectedServiceType, setSelectedServiceType] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [showTrash, setShowTrash] = useState(false);
  const [trashItems, setTrashItems] = useState([]);
  const [loadingTrash, setLoadingTrash] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'normal', 'permanent'

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

  const serviceTypes = [
    { value: "dine_in", label: "Dine In", icon: <FaUtensils className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" /> },
    { value: "take_away", label: "Take Away", icon: <FaShoppingBag className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" /> },
    { value: "delivery", label: "Delivery", icon: <FaMotorcycle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" /> }
  ];

  const foodTypes = [
    {
      value: "veg",
      label: "Veg",
      icon: (
        <div className="w-6 h-6 border-2 border-green-600 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-green-600"></div>
        </div>
      )
    },
    {
      value: "non_veg",
      label: "Non-Veg",
      icon: (
        <div className="w-6 h-6 border-2 border-red-600 flex items-center justify-center">
          <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-600"></div>
        </div>
      )
    },
    {
      value: "beverage",
      label: "Beverage",
      icon: (
        <div className="w-6 h-6 border-2 border-blue-600 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-blue-600"></div>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (accessChecked && hasAccess) {
      loadMenuData();
      loadTrashItems();
    }
  }, [accessChecked, hasAccess]);

  useEffect(() => {
    if (showTrash) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showTrash]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowTrash(false);
        setDeleteConfirmOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const loadTrashItems = async () => {
    try {
      setLoadingTrash(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/restaurant/menu/trash`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTrashItems(data.items || []);
      }
    } catch (err) {
      console.error('Error loading trash:', err);
      toast.error('Failed to load trash');
    } finally {
      setLoadingTrash(false);
    }
  };

  useEffect(() => {
    if (showTrash) {
      loadTrashItems();
    }
  }, [showTrash]);

  const handleRestore = async (itemId) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/restaurant/menu/${itemId}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Item restored successfully');
        loadTrashItems();
        loadMenuData();
      } else {
        toast.error('Failed to restore item');
      }
    } catch (err) {
      console.error('Error restoring item:', err);
      toast.error('Failed to restore item');
    }
  };

  const handlePermanentDelete = (itemId) => {
    setDeleteTargetId(itemId);
    setDeleteType("permanent");
    setDeleteConfirmOpen(true);
  };

  const loadMenuData = async () => {
    if (!accessChecked || !hasAccess) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');

      // Load menu items, categories, sub-categories
      const [itemsRes, categoriesRes, subCategoriesRes] = await Promise.all([
        fetch(`${API_BASE}/api/restaurant/menu`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE}/api/restaurant/menu/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null),
        fetch(`${API_BASE}/api/restaurant/menu/sub-categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => null)
      ]);

      if (itemsRes?.ok) {
        const itemsData = await itemsRes.json();
        setMenuItems(itemsData.items || []);
      } else {
        setMenuItems([]);
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
    } catch (err) {
      console.error('Error loading menu data:', err);
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (val) => {
    const cleaned = val.replace(/\./g, '');
    const trimmedStart = cleaned.trimStart();
    if (cleaned.length > 0 && cleaned.trim() === "") {
      toast.warning("Search query cannot be empty spaces");
      return;
    }
    setSearchTerm(trimmedStart);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.trim().toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category_id === parseInt(selectedCategory);
    const matchesSubCategory = selectedSubCategory === "all" || item.sub_category_id === parseInt(selectedSubCategory);
    const matchesServiceType = selectedServiceType === "all" ||
      (item.service_types && item.service_types.includes(selectedServiceType));
    return matchesSearch && matchesCategory && matchesSubCategory && matchesServiceType;
  });

  const pages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory, selectedSubCategory, selectedServiceType]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), pages));
  }, [pages]);

  const handleDelete = (itemId) => {
    setDeleteTargetId(itemId);
    setDeleteType("normal");
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (deleteType === "permanent") {
        const response = await fetch(`${API_BASE}/api/restaurant/menu/${deleteTargetId}/permanent`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          toast.error('Item permanently deleted');
          loadTrashItems();
        } else {
          toast.error('Failed to delete item');
        }
      } else {
        const response = await fetch(`${API_BASE}/api/restaurant/menu/${deleteTargetId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          toast.error('Menu item deleted successfully');
          loadMenuData();
          loadTrashItems();
        } else {
          toast.error('Failed to delete menu item');
        }
      }
    } catch (err) {
      console.error('Error during deletion:', err);
      toast.error('Deletion failed');
    } finally {
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      setDeleteType(null);
    }
  };


  if (!accessChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RestaurantLoader variant="container" message="Verifying access..." />
      </div>
    );
  }

  if (!hasAccess) {
    return <AccessDenied homeHref="/restaurant/tables" homeLabel="Go to Tables" message="Menu Management is restricted to Owners and Managers only." />;
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <RestaurantLoader variant="container" message="Loading menu..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                Menu Management
              </h1>
              <p className="text-gray-500 text-[10px] sm:text-sm hidden sm:block">
                Organize and manage your restaurant's food items
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTrash(true)}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-semibold text-xs sm:text-sm shadow-sm"
              >
                <FaTrash className="text-rose-500 w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>Trash</span>
                {trashItems.length > 0 && <span className="bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{trashItems.length}</span>}
              </button>
              <Link
                href="/restaurant/menu/add"
                className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all font-semibold text-xs sm:text-sm shadow-md shadow-indigo-200"
              >
                <FaPlus className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="hidden sm:inline">Add Menu Item</span>
                <span className="sm:hidden">Add New</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {/* Search - full width on mobile */}
            <div className="col-span-2">
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name, category"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#5655eb] focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="col-span-1 relative">
              <button
                type="button"
                onClick={() => {
                  setCategoryDropdownOpen(!categoryDropdownOpen);
                  setServiceDropdownOpen(false);
                }}
                className="w-full px-3 py-2 sm:py-2.5 text-[11px] sm:text-sm bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#5655eb] focus:border-transparent transition-all outline-none flex items-center justify-between text-gray-700 cursor-pointer"
              >
                <span className="truncate">
                  {selectedCategory === "all" 
                    ? "Categories" 
                    : (categories.find(c => String(c.id) === String(selectedCategory))?.name || "Categories")}
                </span>
                <FaChevronDown 
                  className={`text-gray-400 transition-transform duration-300 shrink-0 ${categoryDropdownOpen ? "rotate-180" : ""} w-3 h-3 sm:w-3.5 sm:h-3.5`}
                />
              </button>

              {categoryDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCategoryDropdownOpen(false)}></div>
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("all");
                        setCategoryDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs sm:text-sm hover:bg-indigo-50 transition-colors ${selectedCategory === "all" ? "text-[#5655eb] font-semibold bg-indigo-50/30" : "text-gray-700"}`}
                    >
                      Categories
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(String(cat.id));
                          setCategoryDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-xs sm:text-sm hover:bg-indigo-50 transition-colors ${String(selectedCategory) === String(cat.id) ? "text-[#5655eb] font-semibold bg-indigo-50/30" : "text-gray-700"}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Service Type Filter */}
            <div className="col-span-1 relative">
              <button
                type="button"
                onClick={() => {
                  setServiceDropdownOpen(!serviceDropdownOpen);
                  setCategoryDropdownOpen(false);
                }}
                className="w-full px-3 py-2 sm:py-2.5 text-[11px] sm:text-sm bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#5655eb] focus:border-transparent transition-all outline-none flex items-center justify-between text-gray-700 cursor-pointer"
              >
                <span className="truncate">
                  {selectedServiceType === "all" 
                    ? "Services" 
                    : (serviceTypes.find(s => s.value === selectedServiceType)?.label || "Services")}
                </span>
                <FaChevronDown 
                  className={`text-gray-400 transition-transform duration-300 shrink-0 ${serviceDropdownOpen ? "rotate-180" : ""} w-3 h-3 sm:w-3.5 sm:h-3.5`}
                />
              </button>

              {serviceDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setServiceDropdownOpen(false)}></div>
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedServiceType("all");
                        setServiceDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-xs sm:text-sm hover:bg-indigo-50 transition-colors ${selectedServiceType === "all" ? "text-[#5655eb] font-semibold bg-indigo-50/30" : "text-gray-700"}`}
                    >
                      Services
                    </button>
                    {serviceTypes.map(st => (
                      <button
                        key={st.value}
                        type="button"
                        onClick={() => {
                          setSelectedServiceType(st.value);
                          setServiceDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-xs sm:text-sm hover:bg-indigo-50 transition-colors ${selectedServiceType === st.value ? "text-[#5655eb] font-semibold bg-indigo-50/30" : "text-gray-700"}`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FaUtensils className="text-gray-300 text-5xl mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Menu Items Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== "all" ? 'Try adjusting your filters' : 'Get started by adding your first menu item'}
            </p>
            {!searchTerm && selectedCategory === "all" && (
              <Link
                href="/restaurant/menu/add"
                className="px-6 py-3 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2 mx-auto w-fit"
              >
                <FaPlus className="w-3.5 h-3.5 shrink-0" />
                Add Menu Item
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 p-3 sm:p-4">
              {pagedItems.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl sm:hover:-translate-y-1 transition-all duration-300 flex flex-row sm:flex-col h-auto sm:h-full"
                >
                  {/* Image Section */}
                  <div className="relative w-[150px] h-[150px] sm:w-full sm:aspect-square bg-white sm:bg-gray-50 overflow-hidden shrink-0 border-r sm:border-r-0 sm:border-b border-gray-100/50">
                    {item.image ? (
                      <img
                        src={item.image.startsWith('http') ? item.image : `${API_BASE}${item.image}`}
                        alt={item.name}
                        className="w-full h-full object-cover md:object-fill group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/80 text-gray-900 group-hover:bg-gray-100 transition-colors">
                        <FaUtensils className="mb-1.5 size-4 sm:size-6" />
                        <span className="text-[8px] sm:text-[10px] font-bold tracking-[0.2em] uppercase">G-Voice Menu</span>
                      </div>
                    )}

                    {/* Floating Badges - Optimized for Mobile */}
                    <div className="absolute inset-x-0 top-0 p-1.5 sm:p-3 flex justify-between pointer-events-none">
                      <div className="flex flex-col gap-1">
                        {item.is_available ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-[8px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white animate-pulse"></span>
                            Available
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/90 backdrop-blur-sm text-white text-[8px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            <FaTimesCircle size={10} className="shrink-0" />
                            Unavailable
                          </span>
                        )}
                      </div>

                      <div className="p-1 sm:p-1.5 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100 h-fit">
                        <div className={`w-3 h-3 sm:w-5 sm:h-5 border flex items-center justify-center ${item.food_type === 'veg' ? 'border-green-600' :
                          item.food_type === 'non_veg' ? 'border-red-600' : 'border-blue-600'
                          }`}>
                          {item.food_type === 'veg' && <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-green-600"></div>}
                          {item.food_type === 'non_veg' && <div className="w-0 h-0 border-l-[3px] sm:border-l-[4px] border-r-[3px] sm:border-r-[4px] border-b-[5px] sm:border-b-[6px] border-l-transparent border-r-transparent border-b-red-600"></div>}
                          {item.food_type === 'beverage' && <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-600"></div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5 sm:mb-1 gap-2">
                      <h3 className="text-sm sm:text-lg font-bold text-gray-900 group-hover:text-[#5655eb] transition-colors leading-tight min-w-0 truncate">
                        {item.name}
                      </h3>
                      {/* Service Types Icons */}
                      {item.service_types && item.service_types.length > 0 && (
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pt-0.5 sm:pt-1">
                          {item.service_types.map(st => {
                            const type = serviceTypes.find(t => t.value === st);
                            return type ? (
                              <div key={st} className="text-gray-400 flex items-center justify-center" title={type.label}>
                                {type.icon}
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>

                    {/* Category Pills */}
                    <div className="flex flex-wrap gap-1 mb-1 sm:mb-2.5">
                      {item.category_name && (
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[8px] sm:text-[9px] font-bold uppercase tracking-wide">
                          {item.category_name}
                        </span>
                      )}
                      {item.sub_category_name && (
                        <span className="hidden sm:inline-block px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded-md text-[9px] font-bold uppercase tracking-wide">
                          {item.sub_category_name}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-lg sm:text-2xl font-black text-gray-900 leading-none">
                          <span className="text-xs sm:text-lg font-medium mr-0.5 text-[#5655eb]">₹</span>
                          {item.price?.toFixed(0)}
                        </span>
                        {item.original_price && item.original_price > item.price && (
                          <span className="text-[9px] sm:text-xs text-rose-500 line-through font-medium mt-0.5">
                            ₹{item.original_price.toFixed(0)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2">
                        <Link
                          href={`/restaurant/menu/edit/${item.id}`}
                          className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 hover:text-[#5655eb] hover:bg-indigo-50 rounded-lg sm:rounded-xl transition-all border border-transparent hover:border-indigo-100"
                        >
                          <FaEdit className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="w-7 h-7 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg sm:rounded-xl transition-all border border-transparent hover:border-rose-100"
                        >
                          <FaTrash className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredItems.length > 0 ? (
              <PrevNextPager page={page} pages={pages} onPageChange={setPage} loading={loading} />
            ) : null}
          </div>
        )}
      </div>
      {/* Trash Modal */}
      {showTrash && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                  <FaTrash size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Trash Management</h2>
                  <p className="text-[11px] sm:text-sm text-gray-500">Restore or permanently remove items</p>
                </div>
              </div>
              <button
                onClick={() => setShowTrash(false)}
                className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
              >
                <FaPlus className="rotate-45" size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loadingTrash ? (
                <div className="py-20 text-center">
                  <RestaurantLoader variant="container" message="Checking trash..." />
                </div>
              ) : trashItems.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <FaTrash className="text-gray-300" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Trash is currently empty</h3>
                  <p className="text-gray-500 max-w-xs mx-auto text-sm mt-1">Deleted items will appear here before they are permanently removed.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trashItems.map((item) => (
                    <div key={item.id} className="flex flex-row items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl hover:border-indigo-100 hover:shadow-md transition-all group">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-50">
                        {item.image ? (
                          <img
                            src={item.image.startsWith('http') ? item.image : `${API_BASE}${item.image}`}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-900">
                            <FaUtensils size={24} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate text-sm sm:text-base">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-indigo-600">₹{item.price}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">{item.category_name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <button
                          onClick={() => handleRestore(item.id)}
                          className="w-10 h-10 flex items-center justify-center text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                          title="Restore Item"
                        >
                          <FaHistory size={16} />
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(item.id)}
                          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100"
                          title="Delete Permanently"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
              <FaTrash size={28} />
            </div>
            <h3 className="text-xl font-bold text-rose-600 mb-2">Delete Menu Item?</h3>
            <p className={`text-sm mb-6 leading-relaxed ${deleteType === "permanent" ? "text-rose-600 font-semibold" : "text-gray-500"}`}>
              {deleteType === "permanent"
                ? "Are you sure? This item will be permanently removed from the database and cannot be recovered!"
                : "Are you sure you want to delete this menu item? It will be moved to the Trash."}
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteTargetId(null);
                  setDeleteType(null);
                }}
                className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold rounded-xl border border-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors text-sm shadow-md shadow-rose-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
