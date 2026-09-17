'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle, KeyRound, Eye, EyeOff, ChevronDown } from 'lucide-react'; // ✅ Added ChevronDown
import { Button } from '@headlessui/react';
import { useAuth } from '@/context/AuthContext';
import { useShop } from '@/context/ShopContext';
import BackButton from '@/components/BackButton';
import Loader from '@/components/Loader';
import { getApiBase } from '@/utils/apiBase';

const API_URL = `${getApiBase()}/api/hrms`;

export default function StaffForm({ isEdit = false, employeeData = null, isCurrentUser = false, staffBasePath = '/hrms/staff', userType = undefined, roleOptions: roleOptionsProp = undefined }) {
  const router = useRouter();
  const { user } = useAuth();
  const { currentShop } = useShop();
  const hasFetchedEmpId = useRef(false);

  const [formData, setFormData] = useState({
    emp_id: '',
    name: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    role: '',
    salary: '',
    join_date: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const [loadingEmpId, setLoadingEmpId] = useState(false);

  // ✅ State for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Custom inline validation and dropdown arrow states
  const [errors, setErrors] = useState({});
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  // ✅ Reset fetch flag when switching to create mode
  useEffect(() => {
    if (!isEdit) {
      hasFetchedEmpId.current = false;
    }
  }, [isEdit]);

  // ✅ Fetch next employee ID from backend (only once when creating new employee)
  useEffect(() => {
    if (!isEdit && !hasFetchedEmpId.current && currentShop?.id) {
      const fetchNextEmpId = async () => {
        setLoadingEmpId(true);
        try {
          const token = localStorage.getItem('authToken');
          if (!token) {
            console.warn('No token found, skipping employee ID fetch');
            return;
          }

          const response = await fetch(`${API_URL}/staff/next-id`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.nextEmpId) {
              setFormData(prev => ({ ...prev, emp_id: data.nextEmpId }));
              hasFetchedEmpId.current = true;
            } else {
              console.warn('Failed to get employee ID from API, using fallback');
              // Fallback: Generate a temporary ID (will be replaced by backend on creation)
              const fallbackId = `EMP-001`;
              setFormData(prev => ({ ...prev, emp_id: fallbackId }));
              hasFetchedEmpId.current = true;
            }
          } else {
            console.warn('API error fetching employee ID, using fallback');
            const fallbackId = `EMP-001`;
            setFormData(prev => ({ ...prev, emp_id: fallbackId }));
            hasFetchedEmpId.current = true;
          }
        } catch (error) {
          console.error('Error fetching next employee ID:', error);
          // Fallback: Generate a temporary ID
          const fallbackId = `EMP-001`;
          setFormData(prev => ({ ...prev, emp_id: fallbackId }));
          hasFetchedEmpId.current = true;
        } finally {
          setLoadingEmpId(false);
        }
      };

      fetchNextEmpId();
    }
  }, [isEdit, currentShop?.id]);

  // Populate form if editing
  useEffect(() => {
    if (isEdit && employeeData) {
      setFormData({
        emp_id: employeeData.emp_id || '',
        name: employeeData.full_name || '',
        email: employeeData.email || '',
        username: employeeData.username || '',
        password: '',
        phone: employeeData.phone || '',
        role: employeeData.role || '',
        salary: employeeData.salary || '',
        join_date: employeeData.join_date ? new Date(employeeData.join_date).toISOString().split('T')[0] : '',
        status: employeeData.status || 'active'
      });
    }
  }, [isEdit, employeeData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error message when user starts typing/editing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    // Strip HTML tags to prevent XSS
    return str.replace(/<[^>]*>/g, '').trim();
  };

  const validateForm = () => {
    const newErrors = {};

    const sanitizedName = sanitizeInput(formData.name);
    const sanitizedEmail = sanitizeInput(formData.email);
    const sanitizedUsername = sanitizeInput(formData.username);
    const sanitizedPhone = sanitizeInput(formData.phone);

    // 1. Full Name
    if (!sanitizedName) {
      newErrors.name = "Full Name is required";
    } else if (sanitizedName.length < 2) {
      newErrors.name = "Full Name must be at least 2 characters long";
    } else if (sanitizedName.length > 50) {
      newErrors.name = "Full Name must be at most 50 characters long";
    } else if (!/^[a-zA-Z\s.-]+$/.test(sanitizedName)) {
      newErrors.name = "Full Name can only contain letters, spaces, dots, and hyphens";
    }

    // 2. Email
    if (sanitizedEmail) {
      if (sanitizedEmail.length > 100) {
        newErrors.email = "Email must be at most 100 characters long";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitizedEmail)) {
          newErrors.email = "Invalid email format";
        }
      }
    }

    // 3. Username
    if (!isEdit) {
      if (!sanitizedUsername) {
        newErrors.username = "Username is required";
      } else if (sanitizedUsername.length < 3) {
        newErrors.username = "Username must be at least 3 characters long";
      } else if (sanitizedUsername.length > 30) {
        newErrors.username = "Username must be at most 30 characters long";
      } else if (!/^[a-zA-Z0-9._-]+$/.test(sanitizedUsername)) {
        newErrors.username = "Username can only contain alphanumeric characters, dots, hyphens, and underscores";
      }
    }

    // 4. Password
    if (!isEdit) {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else {
        const pwd = formData.password;
        if (pwd.length < 8) {
          newErrors.password = "Password must be at least 8 characters long";
        } else if (pwd.length > 50) {
          newErrors.password = "Password must be at most 50 characters long";
        } else if (!/[A-Z]/.test(pwd)) {
          newErrors.password = "Password must contain at least one uppercase letter";
        } else if (!/[a-z]/.test(pwd)) {
          newErrors.password = "Password must contain at least one lowercase letter";
        } else if (!/[0-9]/.test(pwd)) {
          newErrors.password = "Password must contain at least one number";
        } else if (!/[^A-Za-z0-9]/.test(pwd)) {
          newErrors.password = "Password must contain at least one special character";
        }
      }
    }

    // 5. Phone Number
    if (!sanitizedPhone) {
      newErrors.phone = "Phone Number is required";
    } else if (sanitizedPhone.length < 10) {
      newErrors.phone = "Phone Number must be at least 10 characters long";
    } else if (sanitizedPhone.length > 15) {
      newErrors.phone = "Phone Number must be at most 15 characters long";
    } else if (!/^\+?[\d-\s]+$/.test(sanitizedPhone)) {
      newErrors.phone = "Phone Number can only contain numbers, spaces, hyphens, and a leading '+'";
    }

    // 6. Role
    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    // 7. Salary
    if (formData.salary !== undefined && formData.salary !== '') {
      const salaryNum = parseFloat(formData.salary);
      if (isNaN(salaryNum) || salaryNum < 0) {
        newErrors.salary = "Salary must be a positive number";
      } else if (salaryNum > 10000000) {
        newErrors.salary = "Salary cannot exceed 10,000,000";
      }
    }

    // 8. Join Date
    if (!formData.join_date) {
      newErrors.join_date = "Joining Date is required";
    } else {
      const dateVal = new Date(formData.join_date);
      if (isNaN(dateVal.getTime())) {
        newErrors.join_date = "Invalid date format";
      }
    }

    return newErrors;
  };

  const cleanError = (errMessage) => {
    if (!errMessage) return 'An error occurred';
    return errMessage.replace(/_/g, ' ');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Inline client-side validation
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // ========================================================
      // ✅ FIX: Changed 'token' to 'authToken' to match login
      // ========================================================
      const token = localStorage.getItem('authToken');

      if (!token) {
        toast.error("Authentication failed. Please login.");
        router.push('/login');
        return;
      }

      // Trim and sanitize all text inputs before submitting
      const payload = {
        full_name: sanitizeInput(formData.name),
        email: sanitizeInput(formData.email),
        phone: sanitizeInput(formData.phone),
        username: sanitizeInput(formData.username),
        role: formData.role,
        salary: parseFloat(formData.salary || 0),
        join_date: formData.join_date,
        status: formData.status
      };

      // Include employee ID when creating a new staff member (if available)
      if (!isEdit && formData.emp_id) {
        payload.emp_id = formData.emp_id;
      }

      // Restaurant staff created from /restaurant/* should login into Restaurant Management.
      if (!isEdit && userType) {
        payload.userType = userType;
      }

      // Only send password when creating a new staff member
      if (!isEdit && formData.password) {
        payload.password = formData.password;
      }

      const url = isEdit
        ? `${API_URL}/staff/${formData.emp_id}`
        : `${API_URL}/staff`;

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Sends the 'authToken'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Operation failed');
      }

      // Role update must reflect immediately in the header bar after the change is saved
      if (isCurrentUser) {
        try {
          const meResponse = await fetch(`${getApiBase()}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (meResponse.ok) {
            const meData = await meResponse.json();
            if (meData.success && meData.data) {
              localStorage.setItem('userData', JSON.stringify(meData.data));
              window.dispatchEvent(new Event('storage'));
            }
          }
        } catch (err) {
          console.error("Failed to sync current user profile:", err);
        }
      }

      if (isEdit) {
        toast.success(isCurrentUser ? 'Profile updated successfully' : 'Employee updated successfully');
      } else {
        toast.success('Employee created successfully');
      }

      if (isCurrentUser) {
        router.push('/my-profile');
      } else {
        router.push(staffBasePath);
      }

    } catch (error) {
      console.error("Submit Error:", error);
      toast.error(`Error: ${cleanError(error.message)}`);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.user_role === 'admin';
  const effectiveRoleOptions = (() => {
    // Keep Business Management options as default.
    const defaultOptions = [
      { label: 'Manager', value: 'Manager' },
      { label: 'Cashier', value: 'Cashier' },
      { label: 'Stock Clerk', value: 'Stock Clerk' },
      { label: 'Sales', value: 'Sales' },
      { label: 'Helper', value: 'Helper' }
    ];

    if (!roleOptionsProp) return defaultOptions;

    if (Array.isArray(roleOptionsProp)) {
      return roleOptionsProp.map((opt) => {
        if (typeof opt === 'string') return { label: opt, value: opt };
        return { label: opt.label ?? opt.value, value: opt.value ?? opt.label };
      }).filter((o) => o.value);
    }

    return defaultOptions;
  })();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {isCurrentUser ? 'Edit My Profile' : isEdit ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h2>
          <p className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">
            {isCurrentUser ? 'Update your profile details' :
              isEdit ? 'Update employee details' : 'Fill in the form to add a new employee'}
          </p>
        </div>
        <div>
          <BackButton className="sm:w-auto px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all" />
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="divide-y divide-gray-100">
        <div className="px-4 sm:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Employee ID */}
            {(isEdit || formData.emp_id) && (
              <div>
                <label htmlFor="emp_id" className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight mb-1.5">
                  Employee ID
                </label>
                <input
                  type="text"
                  id="emp_id"
                  name="emp_id"
                  value={loadingEmpId ? "Loading..." : formData.emp_id}
                  className="w-full px-3 py-2 sm:py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm font-bold text-gray-500 cursor-not-allowed"
                  readOnly
                  placeholder={loadingEmpId ? "Loading..." : "Auto-generated"}
                />
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight mb-1.5">
                Full Name <span className="text-red-600 font-bold">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-sm font-medium transition-all outline-none ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="Enter full name"
                readOnly={isCurrentUser && !isAdmin}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight mb-1.5">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-sm font-medium transition-all outline-none ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="Enter email address"
                readOnly={isCurrentUser && !isAdmin}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight mb-1.5">
                Username {!isEdit && <span className="text-red-600 font-bold">*</span>}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-sm font-medium transition-all outline-none ${isEdit ? 'bg-gray-50 text-gray-500 border-gray-200' : errors.username ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="Enter username"
                readOnly={isEdit}
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.username}</p>
              )}
            </div>

            {/* Password - only when adding a new staff member */}
            {!isEdit && (
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight mb-1.5">
                  Password <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-sm font-medium transition-all outline-none pr-10 ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="Set initial password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.password}</p>
                )}
              </div>
            )}

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight mb-1.5">
                Phone Number <span className="text-red-600 font-bold">*</span>
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-sm font-medium transition-all outline-none ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone}</p>
              )}
            </div>

            {/* Role */}
            {(isAdmin || !isCurrentUser) && (
              <div>
                <label htmlFor="role" className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight mb-1.5">
                  Role <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={(e) => {
                      handleChange(e);
                      setIsRoleOpen(false);
                    }}
                    onFocus={() => setIsRoleOpen(true)}
                    onBlur={() => setIsRoleOpen(false)}
                    className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-sm font-medium transition-all outline-none appearance-none bg-white pr-10 ${errors.role ? 'border-red-500' : 'border-gray-200'}`}
                    disabled={isCurrentUser}
                  >
                    <option value="">Select Role</option>
                    {effectiveRoleOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isRoleOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
                {errors.role && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.role}</p>
                )}
              </div>
            )}

            {/* Salary */}
            {isAdmin && (
              <div>
                <label htmlFor="salary" className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight mb-1.5">
                  Monthly Salary
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-bold text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    id="salary"
                    name="salary"
                    step="0.01"
                    min="0"
                    value={formData.salary}
                    onChange={handleChange}
                    className={`w-full pl-8 pr-3 py-2 sm:py-2.5 border rounded-lg focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-sm font-bold transition-all outline-none ${errors.salary ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="0.00"
                    readOnly={isCurrentUser}
                  />
                </div>
                {errors.salary && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.salary}</p>
                )}
              </div>
            )}

            {/* Join Date */}
            <div>
              <label htmlFor="join_date" className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight mb-1.5">
                Joining Date <span className="text-red-600 font-bold">*</span>
              </label>
              <input
                type="date"
                id="join_date"
                name="join_date"
                value={formData.join_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:py-2.5 border rounded-lg focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 text-sm font-medium transition-all outline-none cursor-pointer bg-white ${errors.join_date ? 'border-red-500' : 'border-gray-200'}`}
                readOnly={isCurrentUser}
              />
              {errors.join_date && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.join_date}</p>
              )}
            </div>

            {/* Status */}
            {isAdmin && (
              <div>
                <label htmlFor="status" className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-tight mb-2">
                  Account Status <span className="text-red-600 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange({ target: { name: "status", value: "active" } })}
                    disabled={isCurrentUser}
                    className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${formData.status === "active"
                      ? "bg-green-600 text-white border-green-600 shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 shadow-sm"
                      } ${isCurrentUser ? "opacity-30 cursor-not-allowed" : "active:scale-95"}`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange({ target: { name: "status", value: "inactive" } })}
                    disabled={isCurrentUser}
                    className={`py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${formData.status === "inactive"
                      ? "bg-red-600 text-white border-red-600 shadow-sm"
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 shadow-sm"
                      } ${isCurrentUser ? "opacity-30 cursor-not-allowed" : "active:scale-95"}`}
                  >
                    Inactive
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 border border-transparent rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
              disabled={loading}
            >
              {loading ? (
                <Loader variant="inline-compact" message="Updating..." />
              ) : (
                <>
                  <CheckCircle className='h-4 w-4' />
                  {isCurrentUser ? 'Update Profile' : isEdit ? 'Update Staff' : 'Save Staff'}
                </>
              )}
            </button>
          </div>

          {isEdit && (
            <button
              type="button"
              onClick={() => {
                const targetId = isCurrentUser ? user.emp_id : employeeData?.emp_id;
                if (targetId) {
                  router.push(`${staffBasePath}/${targetId}/change-password`);
                } else {
                  toast.error("Employee ID not found");
                }
              }}
              className="w-full sm:w-auto px-4 py-2.5 border border-yellow-200 rounded-lg text-sm font-bold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <KeyRound className="w-4 h-4" />
              Change Password
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
