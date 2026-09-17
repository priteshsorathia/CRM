"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Suspense } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import resetPasswordImage from "../../../../public/images/login.png";
import AuthCard from "../login/components/AuthCard";
import { CheckCircle2, Clock, Lock, Shield, Eye, EyeOff, Key, AlertCircle } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState("");
  const [isValidToken, setIsValidToken] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Custom inline field errors
  const [fieldErrors, setFieldErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const features = [
    {
      icon: <Lock className="w-5 h-5 text-indigo-600" />,
      title: "Secure Reset",
      description: "Your password will be updated securely",
    },
    {
      icon: <Clock className="h-5 w-5 text-indigo-600" />,
      title: "Quick Process",
      description: "Get back to your account in seconds",
    },
    {
      icon: <CheckCircle2 className="h-5 w-5 text-indigo-600" />,
      title: "Instant Access",
      description: "Login immediately with your new password",
    },
    {
      icon: <Shield className="h-5 w-5 text-indigo-600" />,
      title: "Enhanced Security",
      description: "Protect your account with a strong password",
    },
  ];

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setIsValidToken(false);
      setIsLoading(false);
      toast.error("Invalid reset link Please request a new password reset");
    }
  }, [searchParams]);

  const validateToken = async (token) => {
    try {
      // Validate token with backend to check if it's already used or expired
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/validate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setIsValidToken(false);
      }
      setIsLoading(false);
    } catch (error) {
      setIsValidToken(false);
      setIsLoading(false);
    }
  };

  const validatePassword = () => {
    const errors = { newPassword: "", confirmPassword: "" };
    let hasErrors = false;

    if (!newPassword) {
      errors.newPassword = "New password is required";
      hasErrors = true;
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
      hasErrors = true;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      errors.newPassword = "Password must contain uppercase, lowercase letters and numbers";
      hasErrors = true;
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required";
      hasErrors = true;
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      hasErrors = true;
    }

    setFieldErrors(errors);
    return !hasErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🔄 Resetting password...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      if (result.success) {
        toast.success("Password reset successfully Redirecting to login");
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to reset password');
      }

    } catch (error) {
      console.error('❌ Reset password error:', error);
      toast.error(error.message || "Failed to reset password Please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordRequirements = [
    { text: "At least 8 characters", met: newPassword.length >= 8 },
    { text: "One uppercase letter (A-Z)", met: /[A-Z]/.test(newPassword) },
    { text: "One lowercase letter (a-z)", met: /[a-z]/.test(newPassword) },
    { text: "One number (0-9)", met: /\d/.test(newPassword) },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AuthCard>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Invalid Reset Link
              </h1>
              <p className="text-gray-600 mb-6">
                This password reset link is invalid, expired, or has already been used.
              </p>
              <Link 
                href="/auth/forgot-password" 
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Request New Reset Link
              </Link>
              <div className="mt-6 text-sm text-gray-500">
                <Link href="/auth/login" className="text-indigo-600 hover:underline">
                  Back to login
                </Link>
              </div>
            </div>
          </AuthCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col lg:flex-row relative">
      {/* Page Loader Spinner Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[9999] flex items-center justify-center pointer-events-auto">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">Resetting Password...</p>
          </div>
        </div>
      )}

      {/* Left Side - Features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto text-center lg:text-left">
          <div className="mb-8 mx-auto w-full max-w-xs lg:max-w-md">
            <Image
              src={resetPasswordImage}
              alt="Reset Password Illustration"
              width={500}
              height={400}
              priority
              className="w-full h-auto"
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Set a new password
          </h2>
          <p className="text-gray-600 mb-8">
            Create a strong, secure password to protect your account.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-indigo-100 p-2 rounded-full flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          <AuthCard>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-sm text-gray-500">
                v{process.env.NEXT_PUBLIC_APP_VERSION}
              </span>
            </div>

            <div className="mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="w-6 h-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Create new password
              </h1>
              <p className="text-gray-600 text-center">
                Enter your new password below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (fieldErrors.newPassword) setFieldErrors(prev => ({ ...prev, newPassword: "" }));
                    }}
                    placeholder="Enter new password"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10 ${
                      fieldErrors.newPassword ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.newPassword && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {fieldErrors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                    }}
                    placeholder="Confirm new password"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10 ${
                      fieldErrors.confirmPassword ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Password Requirements:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {req.met ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <div className="h-3 w-3 rounded-full border border-blue-400" />
                      )}
                      <span className={req.met ? "text-green-700" : ""}>
                        {req.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                <Key className="w-4 h-4 mr-2" />
                Reset Password
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Remembered your password?{" "}
              <Link href="/auth/login" className="text-indigo-600 hover:underline">
                Back to login
              </Link>
              <div className="mt-4">
                © {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME}. All
                rights reserved.
                <div className="mt-1">
                  <Link href="/auth/privacy" className="text-indigo-600 hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  |{" "}
                  <Link href="/auth/terms" className="text-indigo-600 hover:underline">
                    Terms of Service
                  </Link>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Need help?{" "}
                  <Link href="/auth/support" className="text-indigo-600 hover:underline font-medium">
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </AuthCard>
        </div>
      </div>
    </div>
  );
}

// Export the main page, wrapping the content in Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}