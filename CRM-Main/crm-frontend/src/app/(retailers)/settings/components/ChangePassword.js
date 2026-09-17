'use client';

import { CheckCircle, Eye, EyeOff, Shield } from 'lucide-react';
import { useState } from 'react';
import { getApiBase } from '@/utils/apiBase';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!newPassword) newErrors.newPassword = 'New password is required';
    else if (newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
    else if (newPassword.length > 32) newErrors.newPassword = 'Password must be at most 32 characters';
    else if (/\s/.test(newPassword)) newErrors.newPassword = 'Password must not contain spaces';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={[\]}|:;"'<,>.?/~`])/.test(newPassword)) newErrors.newPassword = 'Password must contain uppercase, lowercase, numbers, and at least one special character';
    // deprecated check:
      // newErrors.newPassword = 'Password must contain uppercase, lowercase, and numbers';
    // }
    
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    if (!validateForm()) {
      setLoading(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const API_BASE = getApiBase();
      
      const response = await fetch(`${API_BASE}/api/settings/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password');
      }

      if (result.success) {
        setMessage({ type: 'success', text: result.message + '. Logging out...' });
        setTimeout(() => {
          const { logout } = require('@/utils/auth');
          logout();
        }, 1500);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('❌ Password change error:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      

      {/* Security Tips */}
      {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-800 mb-2">🔒 Security Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use at least 8 characters with uppercase, lowercase, and numbers</li>
          <li>• Avoid using personal information in your password</li>
          <li>• Don't reuse passwords from other accounts</li>
        </ul>
      </div> */}

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center">
            {message.type === 'success' && <CheckCircle className="h-5 w-5 mr-2" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Current Password
            </label>
            <div className="relative">
              <input 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)} 
                type={showCurrentPassword ? "text" : "password"}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" 
                placeholder="Enter your current password"
                disabled={loading}
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={loading}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              New Password
            </label>
            <div className="relative">
              <input 
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                type={showNewPassword ? "text" : "password"} maxLength={32}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" 
                placeholder="Create a new password"
                disabled={loading}
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={loading}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Must be between 8 and 32 characters, and contain uppercase, lowercase, numbers, and at least one special character. Spaces are not allowed.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Confirm New Password
            </label>
            <div className="relative">
              <input 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                type={showConfirmPassword ? "text" : "password"} maxLength={32}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors" 
                placeholder="Confirm your new password"
                disabled={loading}
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating Password...
              </>
            ) : (
              <>
                <CheckCircle className='h-4 w-4' />
                Update Password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
