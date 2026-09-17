"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import forgotPasswordImage from "../../../../public/images/login.png";
import AuthCard from "../login/components/AuthCard";
import { CheckCircle2, Clock, Lock, Shield, Mail, AlertCircle } from "lucide-react";

import AuthLoader from "@/components/AuthLoader";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const features = [
    {
      icon: <Lock className="w-5 h-5 text-indigo-600" />,
      title: "Secure Process",
      description: "Reset your password safely and securely",
    },
    {
      icon: <Clock className="h-5 w-5 text-indigo-600" />,
      title: "Fast Recovery",
      description: "Receive reset instructions within seconds",
    },
    {
      icon: <CheckCircle2 className="h-5 w-5 text-indigo-600" />,
      title: "Simple Steps",
      description: "Just one step to reset your account password",
    },
    {
      icon: <Shield className="h-5 w-5 text-indigo-600" />,
      title: "Your Privacy Matters",
      description: "We never share your personal information",
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldError("Please enter your email address");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFieldError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setHasSubmitted(false);
    const processedEmail = trimmedEmail.toLowerCase();

    try {
      console.log('📧 Sending password reset request for:', processedEmail);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: processedEmail }),
      });

      console.log('📨 Response status:', response.status);
      
      let result;
      try {
        result = await response.json();
        console.log('📨 Forgot password response:', result);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        throw new Error('Invalid response from server. Please try again');
      }

      if (!response.ok) {
        if (response.status === 404) {
          setFieldError(result.error || 'Email address is not registered');
          setIsSubmitting(false);
          return;
        } else if (response.status === 400) {
          setFieldError(result.error || 'Invalid request. Please check your email address');
          setIsSubmitting(false);
          return;
        } else if (response.status === 500) {
          const errorMsg = result.error || 'Server error. Please try again later';
          console.error('❌ Server error details:', errorMsg);
          throw new Error(errorMsg);
        } else {
          throw new Error(result.error || `Request failed (Status: ${response.status})`);
        }
      }

      if (result.success) {
        toast.success(result.message || "Password reset link sent successfully");
        setSubmittedEmail(processedEmail);
        setHasSubmitted(true);
        setEmail(""); // Clear email field after successful submission
      } else {
        throw new Error(result.error || 'Failed to send reset email');
      }

    } catch (error) {
      console.error('❌ Forgot password error:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error("Cannot connect to server. Please check your internet connection and try again", {
          duration: 6000,
        });
      } else if (error.message.includes('ECONNREFUSED')) {
        toast.error("Server is unavailable. Please try again in a few moments", {
          duration: 6000,
        });
      } else if (error.message.includes('timeout')) {
        toast.error("Request timed out. Please check your connection and try again");
      } else {
        toast.error(error.message || "Failed to send reset email. Please try again", {
          duration: 6000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setEmail("");
    setFieldError("");
    setHasSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col lg:flex-row relative">
      {/* Page Loader Spinner Overlay */}
      {isSubmitting && <AuthLoader />}

      {/* Left Side - Features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto text-center lg:text-left">
          <div className="mb-8 mx-auto w-full max-w-xs lg:max-w-md">
            <Image
              src={forgotPasswordImage}
              alt="Forgot Password Illustration"
              width={500}
              height={400}
              priority
              className="w-full h-auto"
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {hasSubmitted ? "Check Your Email" : "Forgot your password?"}
          </h2>
          <p className="text-gray-600 mb-8">
            {hasSubmitted 
              ? "We've sent a password reset link to your email address. The link will expire in 15 minutes."
              : "Don't worry. We'll send you a secure link to reset it and get you back on track."
            }
          </p>

          {!hasSubmitted && (
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
          )}  
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

            {hasSubmitted ? (
              // Success State
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Check Your Email
                </h1>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to:<br />
                  <strong className="text-indigo-600">{submittedEmail}</strong>
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Important:
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Check your spam folder if you don't see the email</li>
                    <li>• The reset link expires in 15 minutes</li>
                    <li>• For security, the link can only be used once</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleResetForm}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Send to a different email
                  </button>
                  <Link 
                    href="/auth/login" 
                    className="block w-full py-2 px-4 text-center border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Back to login
                  </Link>
                </div>
              </div>
            ) : (
              // Form State
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                    Reset your password
                  </h1>
                  <p className="text-gray-600 text-center">
                    Enter your email and we'll send you a secure reset link.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldError) setFieldError("");
                      }}
                      placeholder="Enter your email address"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed ${
                        fieldError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"
                      }`}
                      disabled={isSubmitting}
                    />
                    {fieldError && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium">
                        {fieldError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex justify-center items-center py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:shadow-md"
                    }`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Reset Link
                  </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                  Remembered your password?{" "}
                  <Link 
                    href="/auth/login" 
                    className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
                  >
                    Back to login
                  </Link>
                </div>
              </>
            )}

            <div className="mt-6 text-center text-sm text-gray-500">
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