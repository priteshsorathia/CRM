"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiShoppingBag,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiShield,
  FiShieldOff,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export default function SellerManagementPage() {
  const router = useRouter();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'retailers', 'restaurants'
  const [filterBlocked, setFilterBlocked] = useState("all"); // 'all', 'blocked', 'active'
  const [editingShop, setEditingShop] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    address: "",
    phone: "",
    email: "",
    gstNumber: "",
    userType: "retailers",
    isBlocked: false,
  });
  const [createFormData, setCreateFormData] = useState({
    shop_name: "",
    owner_name: "",
    shop_address: "",
    phone: "",
    email: "",
    gst_number: "",
    userType: "retailers",
  });
  const [newCredentials, setNewCredentials] = useState(null);
  const [isCredentialsPopupOpen, setIsCredentialsPopupOpen] = useState(false);
  const [message, setMessage] = useState({ type: "", content: "" });

  // Fetch shops
  const fetchShops = async () => {
    try {
      setLoading(true);
      let url = `${API_BASE}/shops/filter?`;

      if (filterType !== "all") {
        url += `userType=${filterType}&`;
      }

      if (filterBlocked !== "all") {
        url += `isBlocked=${filterBlocked === "blocked"}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setShops(result.data || []);
      } else {
        setMessage({
          type: "error",
          content: result.error || "Failed to fetch shops",
        });
      }
    } catch (error) {
      console.error("Error fetching shops:", error);
      setMessage({ type: "error", content: "Failed to fetch shops" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [filterType, filterBlocked]);

  // Handle edit
  const handleEdit = (shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name || "",
      ownerName: shop.ownerName || "",
      address: shop.address || "",
      phone: shop.phone || "",
      email: shop.email || "",
      gstNumber: shop.gstNumber || "",
      userType: shop.userType || "retailers",
      isBlocked: shop.isBlocked || false,
    });
    setShowEditModal(true);
  };

  // Handle save
  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/shops/${editingShop.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", content: "Shop updated successfully" });
        setShowEditModal(false);
        setEditingShop(null);
        fetchShops();
      } else {
        setMessage({
          type: "error",
          content: result.error || "Failed to update shop",
        });
      }
    } catch (error) {
      console.error("Error updating shop:", error);
      setMessage({ type: "error", content: "Failed to update shop" });
    } finally {
      setLoading(false);
    }
  };

  // Handle create shop
  const handleCreateShop = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", content: "" });

    try {
      const requestData = {
        name: createFormData.shop_name,
        ownerName: createFormData.owner_name,
        address: createFormData.shop_address,
        phone: createFormData.phone,
        email: createFormData.email,
        gstNumber: createFormData.gst_number,
        userType: createFormData.userType,
        logo: "",
      };

      const response = await fetch(`${API_BASE}/shops/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || result.message || `HTTP ${response.status}`
        );
      }

      if (result.success) {
        setNewCredentials(result.data.credentials);
        setIsCredentialsPopupOpen(true);
        setMessage({
          type: "success",
          content:
            "Shop created successfully! Credentials sent to owner's email.",
        });

        // Reset form
        setCreateFormData({
          shop_name: "",
          owner_name: "",
          shop_address: "",
          phone: "",
          email: "",
          gst_number: "",
          userType: "retailers",
        });

        setShowCreateModal(false);
        fetchShops();
      }
    } catch (error) {
      console.error("Error creating shop:", error);
      setMessage({
        type: "error",
        content: `Creation failed: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle block/unblock
  const handleToggleBlock = async (shop) => {
    try {
      const newBlockedStatus = !shop.isBlocked;
      const response = await fetch(`${API_BASE}/shops/${shop.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isBlocked: newBlockedStatus }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({
          type: "success",
          content: `Shop ${newBlockedStatus ? "blocked" : "unblocked"
            } successfully`,
        });
        fetchShops();
      } else {
        setMessage({
          type: "error",
          content: result.error || "Failed to update shop",
        });
      }
    } catch (error) {
      console.error("Error updating shop:", error);
      setMessage({ type: "error", content: "Failed to update shop" });
    }
  };

  // Filter shops by search term
  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.phone?.includes(searchTerm);

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-['Poppins',_sans-serif]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Shop Management
              </h1>
              <p className="text-gray-600">Manage retailers and restaurants</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              <FiPlus className="w-5 h-5" />
              Create New Shop
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search shops, owners, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="retailers">Retailers</option>
                <option value="restaurants">Restaurants</option>
                <option value="services">Services</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterBlocked}
                onChange={(e) => setFilterBlocked(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.content && (
          <div
            className={`mb-6 p-4 rounded-xl ${message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
              }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <FiCheck className="w-5 h-5" />
              ) : (
                <FiAlertCircle className="w-5 h-5" />
              )}
              {message.content}
            </div>
          </div>
        )}

        {/* Shops List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading shops...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="p-12 text-center">
              <FiShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No shops found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Shop
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredShops.map((shop) => (
                    <tr
                      key={shop.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FiShoppingBag className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {shop.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {shop.gstNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FiUser className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900">
                            {shop.ownerName || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <FiMail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{shop.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <FiPhone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{shop.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${shop.userType === "restaurants"
                              ? "bg-orange-100 text-orange-700"
                              : shop.userType === "services"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                        >
                          {shop.userType === "restaurants"
                            ? "Restaurant"
                            : shop.userType === "services"
                              ? "Services"
                              : "Retailer"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${shop.isBlocked
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                            }`}
                        >
                          {shop.isBlocked ? (
                            <>
                              <FiShieldOff className="w-3 h-3" />
                              Blocked
                            </>
                          ) : (
                            <>
                              <FiShield className="w-3 h-3" />
                              Active
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(shop)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleBlock(shop)}
                            className={`p-2 rounded-lg transition-colors ${shop.isBlocked
                              ? "text-green-600 hover:bg-green-50"
                              : "text-red-600 hover:bg-red-50"
                              }`}
                            title={shop.isBlocked ? "Unblock" : "Block"}
                          >
                            {shop.isBlocked ? (
                              <FiShield className="w-4 h-4" />
                            ) : (
                              <FiShieldOff className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Edit Shop</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingShop(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) =>
                        setFormData({ ...formData, ownerName: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={formData.gstNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, gstNumber: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.userType}
                      onChange={(e) =>
                        setFormData({ ...formData, userType: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="retailers">Retailers</option>
                      <option value="restaurants">Restaurants</option>
                      <option value="services">Services</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isBlocked}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isBlocked: e.target.checked,
                          })
                        }
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Block this shop
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingShop(null);
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Shop Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Create New Shop
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateFormData({
                      shop_name: "",
                      owner_name: "",
                      shop_address: "",
                      phone: "",
                      email: "",
                      gst_number: "",
                      userType: "retailers",
                    });
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateShop} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shop Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createFormData.shop_name}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          shop_name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter shop name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={createFormData.owner_name}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          owner_name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Enter owner's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={createFormData.email}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="owner@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={createFormData.phone}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="+1 555-123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={createFormData.gst_number}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          gst_number: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="GSTIN123456789 (Optional)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      required
                      value={createFormData.userType}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          userType: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="retailers">Retailers</option>
                      <option value="restaurants">Restaurants</option>
                      <option value="services">Services</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      required
                      value={createFormData.shop_address}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          shop_address: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="123 Main St, City, State 12345"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateFormData({
                        shop_name: "",
                        owner_name: "",
                        shop_address: "",
                        phone: "",
                        email: "",
                        gst_number: "",
                        userType: "retailers",
                      });
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Create Shop"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Credentials Popup */}
        {isCredentialsPopupOpen && newCredentials && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-4xl mx-4 shadow-2xl border border-gray-100 relative font-['Poppins',_sans-serif]">
              <button
                onClick={() => {
                  setIsCredentialsPopupOpen(false);
                  setNewCredentials(null);
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-white rounded-full p-2 shadow-md"
              >
                <FiX className="w-6 h-6" />
              </button>

              <h2 className="text-3xl font-bold text-blue-700 mb-6">
                Credentials Generated!
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                Please provide these credentials to the new shop owner. They
                will need these to access their shop dashboard. They can use the{" "}
                <strong>Email</strong> or the <strong>Username</strong> to log
                in.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2">Shop ID</h3>
                  <p className="font-mono text-lg text-blue-700 break-all">
                    {newCredentials.shopId}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2">Username</h3>
                  <p className="font-mono text-lg text-blue-700 break-all">
                    {newCredentials.username}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2">Email</h3>
                  <p className="font-mono text-lg text-blue-700 break-all">
                    {newCredentials.email}
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-2">Password</h3>
                  <p className="font-mono text-lg text-blue-700 break-all">
                    {newCredentials.password}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6">
                <p className="text-yellow-800 text-sm">
                  <span className="font-semibold">Important:</span> These
                  credentials are automatically generated. Please ensure the
                  shop owner receives them securely and changes their password
                  upon first login.
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    // Copy credentials to clipboard
                    const credentialsText = `Shop ID: ${newCredentials.shopId}\nUsername: ${newCredentials.username}\nEmail: ${newCredentials.email}\nPassword: ${newCredentials.password}`;
                    navigator.clipboard.writeText(credentialsText);
                    setMessage({
                      type: "success",
                      content: "Credentials copied to clipboard!",
                    });
                  }}
                  className="px-8 py-3 bg-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-400 transition-colors"
                >
                  Copy Credentials
                </button>
                <button
                  onClick={() => {
                    setIsCredentialsPopupOpen(false);
                    setNewCredentials(null);
                  }}
                  className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
