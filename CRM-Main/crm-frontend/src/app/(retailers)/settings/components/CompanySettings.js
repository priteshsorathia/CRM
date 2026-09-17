"use client";

import { CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useShop } from '@/context/ShopContext';
import { toast } from 'sonner';
import { getApiBase } from '@/utils/apiBase';

import { isSvgFile } from "@/utils/fileValidation";

export default function CompanySettings() {
  const { currentShop, refreshShop } = useShop(); 

  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopEmail, setShopEmail] = useState("");
  const [shopGst, setShopGst] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [isLogoRemoved, setIsLogoRemoved] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field Errors state
  const [fieldErrors, setFieldErrors] = useState({
    shopName: "",
    shopGst: "",
    shopAddress: ""
  });

  // Load shop details
  useEffect(() => {
    if (currentShop) {
        // Map database fields to state (Handle both 'name' and 'shop_name' for compatibility)
        setShopName(currentShop.name || currentShop.shop_name || "");
        setShopPhone(currentShop.phone || currentShop.shop_phone || "");
        setShopEmail(currentShop.email || currentShop.shop_email || "");
        setShopGst(currentShop.gstNumber || currentShop.shop_gst || "");
        setShopAddress(currentShop.address || currentShop.shop_address || "");
        
        // Handle existing logo preview
        const existingLogo = currentShop.logo || currentShop.logo_path;
        if (existingLogo) {
            // Append backend URL if it's a relative path
            const API_BASE = getApiBase();
            const fullLogoUrl = existingLogo.startsWith('http') 
                ? existingLogo 
                : `${API_BASE}${existingLogo}`;
            setLogoPreview(fullLogoUrl);
        }
    }
  }, [currentShop]);

  // Preview newly selected file
  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  // Validation function
  const validateField = (name, value) => {
    let error = "";
    const val = String(value || "");

    switch (name) {
      case "shopName": {
        const trimmed = val.trim();
        if (!trimmed) {
          error = "Shop Name is required";
        } else if (trimmed.length < 2) {
          error = "Shop Name must be at least 2 characters long";
        } else if (trimmed.length > 100) {
          error = "Shop Name must be under 100 characters";
        }
        break;
      }
      case "shopGst": {
        const trimmed = val.trim();
        if (trimmed) {
          // GST format: 15 alphanumeric characters
          const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
          if (trimmed.length !== 15) {
            error = "GST Number must be exactly 15 characters";
          } else if (!gstRegex.test(trimmed)) {
            error = "Invalid GST Number format (e.g. 22AAAAA1111A1Z1)";
          }
        }
        break;
      }
      case "shopAddress": {
        const trimmed = val.trim();
        if (!trimmed) {
          error = "Address is required";
        } else if (trimmed.length < 5) {
          error = "Address must be at least 5 characters long";
        }
        break;
      }
      default:
        break;
    }

    setFieldErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (isSvgFile(file)) {
        e.target.value = "";
        return;
      }
      if (!file.type.startsWith('image/')) {
        e.target.value = "";
        toast.error("Only PNG, JPG, or GIF image files are allowed!");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        e.target.value = "";
        toast.error("Image size exceeds the 10MB limit!");
        return;
      }
      setLogoFile(file);
      setIsLogoRemoved(false);
    }
  }

  function handleRemoveLogo() {
    setLogoFile(null);
    setLogoPreview("");
    setIsLogoRemoved(true);
    // Reset the file input if needed
    const fileInput = document.getElementById('shop_logo');
    if (fileInput) fileInput.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate all fields
    const nameErr = validateField("shopName", shopName);
    const gstErr = validateField("shopGst", shopGst);
    const addressErr = validateField("shopAddress", shopAddress);

    if (nameErr || gstErr || addressErr) {
      toast.error("Please resolve all validation errors before saving.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const trimmedName = shopName.trim();
    const trimmedGst = shopGst.trim().toUpperCase();
    const trimmedAddress = shopAddress.trim();

    try {
        const token = localStorage.getItem('authToken');
        const API_BASE = getApiBase();

        const formData = new FormData();
        formData.append('name', trimmedName);
        formData.append('address', trimmedAddress);
        formData.append('gstNumber', trimmedGst);
        
        if (logoFile) {
            formData.append('logo', logoFile);
        } else if (isLogoRemoved) {
            formData.append('removeLogo', 'true');
        }

        const response = await fetch(`${API_BASE}/api/settings/shop`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            setMessage({
                type: "success",
                text: "Company information saved successfully.",
            });
            
            toast.success('Company settings updated!');

            // Sync with trimmed values
            setShopName(trimmedName);
            setShopGst(trimmedGst);
            setShopAddress(trimmedAddress);
            setLogoFile(null);
            setIsLogoRemoved(false);

            // Reset file input element
            const fileInput = document.getElementById('shop_logo');
            if (fileInput) fileInput.value = '';
            
            // ✅ CRITICAL: Update the global context so Sidebar refreshes
            if (refreshShop) {
                console.log("Refreshing shop context...");
                await refreshShop(); 
            }
        } else {
            throw new Error(result.error || "Failed to update settings");
        }

    } catch (error) {
        console.error("Error updating company settings:", error);
        setMessage({
            type: "error",
            text: error.message || "An unexpected error occurred.",
        });
        toast.error(error.message || "Failed to update settings");
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <section className="p-4">
      <h2 className="text-xl font-semibold mb-4">Company Information</h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Shop Name <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              name="shopName"
              value={shopName}
              onChange={(e) => {
                setShopName(e.target.value);
                if (fieldErrors.shopName) {
                  setFieldErrors(prev => ({ ...prev, shopName: "" }));
                }
              }}
              onBlur={handleBlur}
              required
              className={`w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                fieldErrors.shopName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {fieldErrors.shopName && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {fieldErrors.shopName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              value={shopPhone}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-50 text-gray-500 cursor-not-allowed outline-none select-none"
              title="Contact admin to change phone number"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              value={shopEmail}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-50 text-gray-500 cursor-not-allowed outline-none select-none"
              title="Contact admin to change email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">GST Number</label>
            <input
              name="shopGst"
              value={shopGst}
              onChange={(e) => {
                setShopGst(e.target.value);
                if (fieldErrors.shopGst) {
                  setFieldErrors(prev => ({ ...prev, shopGst: "" }));
                }
              }}
              onBlur={handleBlur}
              className={`w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                fieldErrors.shopGst ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {fieldErrors.shopGst && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {fieldErrors.shopGst}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Shop Logo
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
              {logoPreview ? (
                <div className="flex flex-col items-center">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-auto max-h-40 object-contain"
                  />
                  <p className="text-sm text-gray-500 mb-3 mt-2">
                    New logo preview — upload to replace current
                  </p>
                  <div className="flex gap-2 mt-2">
                    <label
                      htmlFor="shop_logo"
                      className="cursor-pointer bg-blue-50 text-blue-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
                    >
                      Change Image
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                      Remove Image
                    </button>
                  </div>
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
                    htmlFor="shop_logo"
                    className="cursor-pointer bg-blue-50 text-blue-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors"
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
                id="shop_logo"
                name="shop_logo"
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Address <span className="text-red-500 font-bold">*</span>
            </label>
            <textarea
              name="shopAddress"
              value={shopAddress}
              onChange={(e) => {
                setShopAddress(e.target.value);
                if (fieldErrors.shopAddress) {
                  setFieldErrors(prev => ({ ...prev, shopAddress: "" }));
                }
              }}
              onBlur={handleBlur}
              rows={6}
              required
              className={`w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                fieldErrors.shopAddress ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {fieldErrors.shopAddress && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {fieldErrors.shopAddress}
              </p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Update Company Information
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
