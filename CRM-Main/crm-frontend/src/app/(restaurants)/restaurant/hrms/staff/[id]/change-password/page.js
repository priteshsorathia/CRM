'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import BackButton from '@/components/BackButton';
import { getApiBase } from '@/utils/apiBase';

const API_URL = `${getApiBase()}/api/hrms`;

export default function RestaurantChangePasswordPage() {
  const { id } = useParams(); // This is the emp_id
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState({
    newPassword: false,
    confirmPassword: false
  });
  const [passwordMatchError, setPasswordMatchError] = useState(false);
  const [errors, setErrors] = useState({});

  const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<[^>]*>/g, '').trim(); // Remove HTML tags and trim
  };

  const validatePassword = (pwd) => {
    if (!pwd) return "Password is required";
    if (pwd.length < 8) return "Password must be at least 8 characters long";
    if (pwd.length > 50) return "Password must be at most 50 characters long";
    if (!/[A-Z]/.test(pwd)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(pwd)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Password must contain at least one number";
    if (!/[^A-Za-z0-9]/.test(pwd)) return "Password must contain at least one special character";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Basic sanitization on input change
    const sanitizedVal = name === 'newPassword' || name === 'confirmPassword' ? value : sanitizeInput(value);
    
    setFormData(prev => ({ ...prev, [name]: sanitizedVal }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Live validation
    if (name === 'confirmPassword' || name === 'newPassword') {
      const otherValue = name === 'newPassword' ? formData.confirmPassword : formData.newPassword;
      if (otherValue) {
        const match = sanitizedVal === otherValue;
        setPasswordMatchError(!match);
      }
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear errors
    setErrors({});
    
    // Server-grade validation on client
    const pwdErr = validatePassword(formData.newPassword);
    if (pwdErr) {
      setErrors({ newPassword: pwdErr });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordMatchError(true);
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("authToken"); 
      if (!token) {
        toast.error("Please log in first");
        router.push('/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/staff/${id}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      
      toast.success('Password changed successfully');
      router.push(`/restaurant/hrms/staff`);
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 max-w-2xl mx-auto">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Change Password
            </h2>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">
              Employee ID: {id}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-6 space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight mb-1.5">
              Employee ID
            </label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm font-bold text-gray-500 cursor-not-allowed" 
              value={id} 
              readOnly 
            />
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="newPassword" className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight mb-1.5">
                New Password <span className="text-red-600 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword.newPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-sm font-medium transition-all outline-none pr-10 ${errors.newPassword ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                  onClick={() => togglePasswordVisibility('newPassword')}
                >
                  {showPassword.newPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight mb-1.5">
                Confirm Password <span className="text-red-600 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword.confirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-sm font-medium transition-all outline-none pr-10 ${passwordMatchError ? 'border-red-500' : 'border-gray-200'}`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                >
                  {showPassword.confirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {passwordMatchError && (
              <div className="bg-red-50 text-red-600 p-2.5 rounded-lg text-xs border border-red-200 font-medium">
                Passwords do not match!
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              className={`px-6 py-2.5 border border-transparent rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
              }`}
              disabled={loading}
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Change Password
                </>
              )}
            </button>
            <BackButton className="sm:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all" />
          </div>
        </form>
      </div>
    </div>
  );
}
