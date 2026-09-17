'use client';

import { CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Loader from "@/components/Loader";
import { toast } from 'sonner';
import { getApiBase } from '@/utils/apiBase';

const API_URL = `${getApiBase()}/api/settings`;

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    upiId: ''
  });

  const [fieldErrors, setFieldErrors] = useState({
    fullName: '',
    email: '',
    username: '',
    upiId: ''
  });

  // Fetch data on mount
  useEffect(() => {
    // Detect user role from local storage
    if (typeof window !== "undefined") {
      const userDataStr = localStorage.getItem("userData");
      const userStr = localStorage.getItem("user");
      let user = {};
      try {
        if (userDataStr) user = { ...user, ...JSON.parse(userDataStr) };
        if (userStr) user = { ...user, ...JSON.parse(userStr) };
        setUserRole(user.role || user.user_role || null);
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(API_URL, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        if (data.success && data.data) {
          const settings = data.data;
          setFormData(prev => ({
            ...prev,
            fullName: settings.name,
            email: settings.email,
            username: settings.username,
            upiId: settings.upiId || ''
          }));
        }
      } catch (error) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const validateField = (name, value) => {
    let error = '';
    const val = String(value || '');

    switch (name) {
      case 'fullName': {
        const trimmed = val.trim();
        if (!trimmed) {
          error = 'Full Name is required';
        } else if (trimmed.length < 2) {
          error = 'Full Name must be at least 2 characters long';
        } else if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
          error = 'Full Name can only contain letters, spaces, periods, hyphens, and apostrophes';
        }
        break;
      }
      case 'email': {
        const trimmed = val.trim();
        if (!trimmed) {
          error = 'Email Address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          error = 'Please enter a valid email address';
        }
        break;
      }
      case 'username': {
        const trimmed = val.trim();
        if (!trimmed) {
          error = 'Username is required';
        } else if (trimmed.length < 3) {
          error = 'Username must be at least 3 characters long';
        } else if (/\s/.test(trimmed)) {
          error = 'Username cannot contain spaces';
        } else if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
          error = 'Username can only contain letters, numbers, underscores, hyphens, and periods';
        }
        break;
      }
      case 'upiId': {
        const trimmed = val.trim();
        if (trimmed) {
          if (!/^[\w.-]+@[\w.-]+$/.test(trimmed)) {
            error = 'Please enter a valid UPI ID (e.g. username@bank)';
          }
        }
        break;
      }
      default:
        break;
    }

    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));

    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  async function handleSubmit(e) {
    e.preventDefault();

    const isOwner = userRole && ["shop_owner", "owner"].includes(userRole);

    // Validate all fields
    const fullNameError = validateField('fullName', formData.fullName);
    const emailError = validateField('email', formData.email);
    const usernameError = validateField('username', formData.username);
    const upiIdError = isOwner ? validateField('upiId', formData.upiId) : '';

    if (fullNameError || emailError || usernameError || upiIdError) {
      toast.error("Please resolve all validation errors before saving.");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('authToken');
      const trimmedName = formData.fullName.trim();
      const trimmedUsername = formData.username.trim();
      const trimmedEmail = formData.email.trim();
      const trimmedUpiId = isOwner ? formData.upiId.trim() : '';

      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          username: trimmedUsername,
          upiId: trimmedUpiId
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Profile information updated successfully");

        // Sync local form state with trimmed values
        setFormData(prev => ({
          ...prev,
          fullName: trimmedName,
          username: trimmedUsername,
          upiId: trimmedUpiId
        }));

        // ✅ 1. UPDATE LOCAL STORAGE (both `user` and `userData`)
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');

          const updatedUser = {
            ...storedUser,
            name: trimmedName,
            email: trimmedEmail,
            username: trimmedUsername,
            upiId: trimmedUpiId
          };

          const updatedUserData = {
            ...storedUserData,
            ...updatedUser
          };

          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('userData', JSON.stringify(updatedUserData));

          // ✅ 2. DISPATCH EVENT FOR SIDEBAR TO LISTEN
          window.dispatchEvent(new Event("userUpdated"));
        } catch (err) {
          console.error("Error updating local storage", err);
        }

      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader variant="container" message="Loading settings..." className="h-64" />;

  const isOwner = userRole && ["shop_owner", "owner"].includes(userRole);

  return (
    <section className="p-4">
      <h2 className="text-xl font-semibold mb-4">
        {isOwner ? 'Admin Information' : 'Profile Information'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              name="fullName"
              value={formData.fullName}
              onChange={e => {
                setFormData({ ...formData, fullName: e.target.value });
                if (fieldErrors.fullName) {
                  setFieldErrors(prev => ({ ...prev, fullName: '' }));
                }
              }}
              onBlur={handleBlur}
              required
              className={`w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                fieldErrors.fullName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {fieldErrors.fullName && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {fieldErrors.fullName}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Email Address <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              name="email"
              value={formData.email}
              readOnly
              className="w-full border border-gray-300 rounded p-2 bg-gray-50 text-gray-500 cursor-not-allowed outline-none select-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Username <span className="text-red-500 font-bold">*</span>
            </label>
            <input
              name="username"
              value={formData.username}
              onChange={e => {
                setFormData({ ...formData, username: e.target.value });
                if (fieldErrors.username) {
                  setFieldErrors(prev => ({ ...prev, username: '' }));
                }
              }}
              onBlur={handleBlur}
              required
              className={`w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                fieldErrors.username ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {fieldErrors.username && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                {fieldErrors.username}
              </p>
            )}
          </div>
          {isOwner && (
            <div>
              <label className="block text-sm font-medium mb-1">UPI ID (for QR Code)</label>
              <input
                name="upiId"
                value={formData.upiId}
                onChange={e => {
                  setFormData({ ...formData, upiId: e.target.value });
                  if (fieldErrors.upiId) {
                    setFieldErrors(prev => ({ ...prev, upiId: '' }));
                  }
                }}
                onBlur={handleBlur}
                placeholder="e.g. username@okhdfcbank"
                className={`w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                  fieldErrors.upiId ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.upiId ? (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {fieldErrors.upiId}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">This ID will be used to generate payment QR codes on invoices.</p>
              )}
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 disabled:bg-blue-400"
          >
            {saving ? <Loader variant="inline-compact" /> : <CheckCircle className='h-4 w-4' />}
            {saving ? 'Updating...' : `Update ${isOwner ? 'Admin' : 'Profile'} Information`}
          </button>
        </div>
      </form>
    </section>
  );
}
