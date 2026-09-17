"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Password for accessing seller dashboard
// You can move this to an environment variable: process.env.NEXT_PUBLIC_SELLER_DASHBOARD_PASSWORD
const SELLER_DASHBOARD_PASSWORD = process.env.NEXT_PUBLIC_SELLER_DASHBOARD_PASSWORD;

// Component for the credentials popup/modal - NOW FULL WIDTH
const CredentialsPopup = ({ credentials, onClose }) => {
  if (!credentials) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      {/* Full width container */}
      {/* Changed font to Poppins (assuming a global Poppins class or Tailwind config) */}
      <div className="bg-white rounded-2xl p-8 w-full max-w-4xl mx-4 shadow-2xl border border-gray-100 relative font-['Poppins',_sans-serif]"> 
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10 bg-white rounded-full p-2 shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <h2 className="text-3xl font-bold text-blue-700 mb-6">Credentials Generated!</h2>
        <p className="text-gray-600 mb-6 text-lg">
          Please provide these credentials to the new shop owner. They will need these to access their shop dashboard. They can use the **Email** or the **Username** to log in.
        </p>
        
        {/* Credentials displayed in a grid for better full-width layout (4 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-2">Shop ID</h3>
            <p className="font-mono text-lg text-blue-700 break-all">{credentials.shopId}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-2">Username</h3>
            <p className="font-mono text-lg text-blue-700 break-all">{credentials.username}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-2">Email</h3>
            <p className="font-mono text-lg text-blue-700 break-all">{credentials.email}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-2">Password</h3>
            <p className="font-mono text-lg text-blue-700 break-all">{credentials.password}</p>
          </div>
          
        </div>
        
        {/* Important note section */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6">
          <p className="text-yellow-800 text-sm">
            <span className="font-semibold">Important:</span> These credentials are automatically generated. 
            Please ensure the shop owner receives them securely and changes their password upon first login.
          </p>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-400 transition-colors"
          >
            Copy Credentials
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// Main component representing the seller dashboard page
const SellerDashboardPage = () => {
  const params = useParams();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  const [formData, setFormData] = useState({
    shop_name: "",
    owner_name: "",
    shop_address: "",
    phone: "",
    email: "",
    gst_number: "",
    userType: "retailers",
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [newCredentials, setNewCredentials] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Check password on mount
  useEffect(() => {
    const password = params?.password;
    if (password === SELLER_DASHBOARD_PASSWORD) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
    setChecking(false);
  }, [params]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });
    setNewCredentials(null);

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}`;

    try {
      console.log("🔄 Sending shop creation request...");
      
      const requestData = {
        name: formData.shop_name,
        ownerName: formData.owner_name,
        address: formData.shop_address,
        phone: formData.phone,
        email: formData.email,
        gstNumber: formData.gst_number,
        userType: formData.userType,
        logo: ""
      };
      
      console.log("📦 Request data:", requestData);
      
      const response = await fetch(`${backendUrl}/shops/create`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestData),
      });

      console.log("📡 Response status:", response.status);
      
      // Get the raw response first
      const responseText = await response.text();
      console.log("📨 Raw response text:", responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ JSON Parse Error:", parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log("✅ Parsed response:", result);

      if (!response.ok) {
        // Show the exact error from backend
        const errorMessage = result.error || result.message || `HTTP ${response.status}`;
        console.error("❌ Backend error:", errorMessage);
        throw new Error(errorMessage);
      }

      if (result.success) {
        console.log("🎉 Shop created successfully!");
        setNewCredentials(result.data.credentials);
        setIsPopupOpen(true);
        setMessage({
          type: "success",
          content: "Shop created successfully! Credentials sent to owner's email."
        });
        
        // Reset form
        setFormData({
          shop_name: "",
          owner_name: "",
          shop_address: "",
          phone: "",
          email: "",
          gst_number: "",
          userType: "retailers",
        });
      }

    } catch (error) {
      console.error("❌ Frontend Error:", error);
      setMessage({
        type: "error",
        content: `Creation failed: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Close popup when clicking outside or pressing Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isPopupOpen) {
        setIsPopupOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isPopupOpen]);

  // Show loading state while checking password
  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-['Poppins',_sans-serif]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if password is incorrect
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-['Poppins',_sans-serif]">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Invalid password. This page requires a valid password in the URL.
          </p>
          <p className="text-sm text-gray-500">
            The URL should be: <code className="bg-gray-100 px-2 py-1 rounded">/auth/seller-dashboard/[password]</code>
          </p>
        </div>
      </div>
    );
  }

  // Show the form if authorized
  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10 font-['Poppins',_sans-serif]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          🏬 Create New Shop
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white w-full p-8 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shop Name */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Shop Name
              </label>
              <input
                type="text"
                name="shop_name"
                value={formData.shop_name}
                onChange={handleChange}
                required
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="Enter shop name"
              />
            </div>

            {/* Shop Owner Name */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Shop Owner Name
              </label>
              <input
                type="text"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                required
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="Enter shop owner's full name"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="+1 555-123-4567"
              />
            </div>

            {/* Email (This will be the login username) */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Email (Shop Owner's Login)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="owner@example.com"
              />
            </div>

            {/* GST Number */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                GST Number
              </label>
              <input
                type="text"
                name="gst_number"
                value={formData.gst_number}
                onChange={handleChange}
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="GSTIN123456789 (Optional)"
              />
            </div>

            {/* User Type */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Shop Type
              </label>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                required
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              >
                <option value="retailers">Retailers</option>
                <option value="restaurants">Restaurants</option>
                <option value="restaurants">Services</option>
              </select>
            </div>

            {/* Shop Address - full width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Shop Address
              </label>
              <textarea
                name="shop_address"
                value={formData.shop_address}
                onChange={handleChange}
                required
                rows={3}
                className="w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="123 Main St, City, State 12345"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-2xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white inline mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "🚀 Create Shop"
              )}
            </button>
          </div>
        </form>

        {/* Message Display Section */}
        {message.content && (
          <div className={`mt-6 p-4 rounded-xl shadow-md font-medium border ${message.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
            {message.content}
          </div>
        )}

        {/* Credentials Popup - Conditionally rendered */}
        {isPopupOpen && (
          <CredentialsPopup
            credentials={newCredentials}
            onClose={() => setIsPopupOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

// Main App component to render the dashboard page
export default function App() {
  return <SellerDashboardPage />;
}

