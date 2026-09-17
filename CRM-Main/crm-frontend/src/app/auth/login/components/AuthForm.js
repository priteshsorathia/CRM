"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff, FiLogIn, FiMail, FiLock } from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import { useShop } from "@/context/ShopContext";
import { motion } from "framer-motion";
import BlockedScreen from "@/components/BlockedScreen";
import { getRedirectByUserType } from "@/constants/routes";
import { toast } from "sonner";
import { getApiBase } from "@/utils/apiBase";
import AuthLoader from "@/components/AuthLoader";

export default function AuthForm() {
  const router = useRouter();
  const { setShop } = useShop();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    accept_terms: true,
  });

  // State for inline validation errors
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    password: "",
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams) {
      const emailParam = searchParams.get('email');
      const passwordParam = searchParams.get('password');
      
      if (emailParam && passwordParam) {
        setFormData(prev => ({
          ...prev,
          username: emailParam.trim(),
          password: passwordParam.trim()
        }));
        
        // Use a small timeout to ensure form is rendered and state is updated before submission
        const timer = setTimeout(() => {
          const loginBtn = document.querySelector('button[type="submit"]');
          if (loginBtn) loginBtn.click();
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Trim space value before and after input for Password field
    const processedValue = type === "checkbox" ? checked : (name === "password" ? value.trim() : value);
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear custom inline validation error when typing/interacting
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Trim username/password before validation & submission
    const trimmedUsername = formData.username.trim();
    const trimmedPassword = formData.password.trim();

    // Inline field validation
    const errors = { username: "", password: "" };
    let hasErrors = false;

    if (!trimmedUsername) {
      errors.username = "Email or Username is required";
      hasErrors = true;
    }

    if (!trimmedPassword) {
      errors.password = "Password is required";
      hasErrors = true;
    }

    setFieldErrors(errors);

    if (hasErrors) {
      return;
    }

    setLoading(true);
    setError("");

    if (!formData.accept_terms) {
      setError("You must accept our Terms of Service and Privacy Policy");
      setLoading(false);
      return;
    }

    try {
      const API_BASE = getApiBase();
      if (!API_BASE) throw new Error("API base URL is not configured");

      const response = await fetch(
        `${API_BASE}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: trimmedUsername,
            password: trimmedPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Check if user is blocked
        if (result.blocked) {
          setIsBlocked(true);
          setBlockedReason(result.error || "Your account has been blocked");
          setLoading(false);
          return;
        }
        throw new Error(result.error || "Login failed");
      }

      if (result.success) {
        toast.success("Login successful");
        localStorage.setItem("authToken", result.data.token);
        localStorage.setItem("token", result.data.token);
        localStorage.setItem("userData", JSON.stringify(result.data.user));
        try {
          sessionStorage.setItem("justLoggedIn", "1");
        } catch {
          // non-blocking
        }

        // Set cookie for middleware
        document.cookie = `authToken=${result.data.token}; path=/; max-age=86400; SameSite=Lax`;

        const shopData = result.data.user?.shop;
        if (!shopData) throw new Error("Shop information not found");

        setShop({
          id: shopData.id,
          name: shopData.name,
          address: shopData.address || "",
          phone: shopData.phone || "",
          email: shopData.email || "",
          gstNumber: shopData.gstNumber || "",
          logo: shopData.logo || null,
          logo_path: shopData.logo || null,
        });

        // Decode token to get userType and redirect accordingly
        try {
          const tokenPayload = JSON.parse(atob(result.data.token.split('.')[1]));
          const userType = tokenPayload.userType || shopData.userType || 'retailers';
          const role = result.data.user?.role || result.data.user?.user_role || '';
          
          // Force redirect based on userType
          router.replace(getRedirectByUserType(userType, role));
        } catch (error) {
          console.error('Error decoding token:', error);
          // Fallback to default dashboard
          router.replace('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Show blocked screen if user is blocked
  if (isBlocked) {
    return <BlockedScreen reason={blockedReason} />;
  }

  return (
    <div className="w-full">
      {loading && <AuthLoader />}
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Sign in to your account
        </h2>
        <p className="text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/get-started"
            className="font-medium text-[#5655eb] hover:text-[#4338ca] transition-colors"
          >
            Get started
          </Link>
        </p>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Email or Username <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiMail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="username"
              name="username"
              type="text"
              required
              disabled={loading}
              value={formData.username}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`block w-full pl-10 pr-3 py-3 border rounded-lg 
                focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]
                disabled:bg-gray-50 disabled:text-gray-500
                transition-colors ${
                  fieldErrors.username
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
            />
          </div>
          {fieldErrors.username && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {fieldErrors.username}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password <span className="text-red-500 font-bold">*</span>
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-[#5655eb] hover:text-[#4338ca] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiLock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={loading}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`block w-full pl-10 pr-10 py-3 border rounded-lg 
                focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]
                disabled:bg-gray-50 disabled:text-gray-500
                transition-colors ${
                  fieldErrors.password
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <FiEyeOff className="h-5 w-5" />
              ) : (
                <FiEye className="h-5 w-5" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1.5 text-xs text-red-600 font-medium">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start">
          <input
            id="accept_terms"
            type="checkbox"
            name="accept_terms"
            checked={formData.accept_terms}
            onChange={handleChange}
            className="h-4 w-4 mt-1 rounded border-gray-300 text-[#5655eb] focus:ring-[#5655eb]"
          />
          <label htmlFor="accept_terms" className="ml-3 text-sm text-gray-600">
            I agree to the{" "}
            <Link href="/auth/terms" className="text-[#5655eb] hover:text-[#4338ca] font-medium">
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link href="/auth/privacy" className="text-[#5655eb] hover:text-[#4338ca] font-medium">
              Privacy Policy
            </Link>
          </label>
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center py-3 px-4
            rounded-lg text-base font-semibold text-white
            bg-[#5655eb] hover:bg-[#4338ca]
            focus:outline-none focus:ring-2 focus:ring-[#5655eb] focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </>
          ) : (
            <>
              <FiLogIn className="mr-2 h-5 w-5" />
              Sign in
            </>
          )}
        </motion.button>
      </form>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            Need help?{" "}
            <Link
              href="/auth/support"
              className="font-medium text-[#5655eb] hover:text-[#4338ca] transition-colors"
            >
              Contact Support
            </Link>
          </p>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} CRM. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
