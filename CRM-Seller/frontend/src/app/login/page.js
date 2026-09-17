"use client";
import React, { useState } from 'react';
import { Shield, Zap, BarChart3, Lock, Mail, Eye, LogIn, HelpCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import api from '../../lib/axios';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('/auth/login', {
        identifier,
        password
      });

      if (res.data.success) {
        setSuccess('Login successful! Redirecting to dashboard...');
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        
        setTimeout(() => {
          router.push('/');
        }, 1500);
        return; // Keep loading true during redirect
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  const features = [
    {
      icon: <Shield size={18} />,
      title: "Enterprise Security",
      description: "Bank-grade encryption & data protection"
    },
    {
      icon: <Zap size={18} />,
      title: "Lightning Fast",
      description: "Optimized for speed and performance"
    },
    {
      icon: <BarChart3 size={18} />,
      title: "Real-time Analytics",
      description: "Make data-driven decisions instantly"
    },
    {
      icon: <Lock size={18} />,
      title: "Privacy First",
      description: "Your data stays in India"
    }
  ];

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Sidebar - Left Section */}
      <div className="hidden lg:flex lg:w-[48%] bg-[#4f46e5] relative flex-col justify-between p-12 overflow-hidden">
        {/* Subtle Background Pattern - Plus Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        {/* Logo Section */}
        <div className="relative z-10 mb-10"> 
          <div className="bg-white p-2 rounded-lg w-fit shadow-lg">
            <img src="/shop-logo.png" alt="CRM Logo" className="h-14 p-1 object-contain" /> 
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1 className="text-5xl font-bold text-white mb-4">Welcome back</h1>
          <p className="text-lg text-white/80 mb-12">Sign in to continue to your seller dashboard</p>

          <div className="space-y-8">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start">
                <div className="bg-white/10 p-3 rounded-lg mr-4 border border-white/5">
                  <div className="text-white opacity-80">{feature.icon}</div>
                </div>
                <div>
                  <h3 className="text-white text-base font-semibold mb-0.5">{feature.title}</h3>
                  <p className="text-white/60 text-lg">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Left Side Footer */}
        <div className="relative z-10 pt-10">
          <p className="text-white/60 text-lg mb-4">Powered by <span className="font-semibold text-white">CRM</span></p> 
        </div>
      </div>

      {/* Main Panel - Form Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#fcfcfd]">
        <div className="w-full max-w-md">
          {/* Form Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
            <p className="text-gray-500 text-sm">
              Don't have an account? <Link href="#" className="text-indigo-600 hover:underline">Get started</Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium flex items-center animate-in fade-in duration-300">
                <Shield size={18} className="mr-3" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-xl text-sm font-medium flex items-center animate-in fade-in duration-300">
                <CheckCircle size={18} className="mr-3" />
                {success}
              </div>
            )}

            {/* Email/Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email or Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-300" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300 text-gray-700 bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Link href="#" className="text-sm font-medium text-indigo-600 hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-300" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300 text-gray-700 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <Eye size={18} />
                </button>
              </div>
            </div>



            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-[#4f46e5] text-white py-3.5 rounded-lg font-bold text-sm shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center space-x-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Signing in...' : 'Sign in'}</span>
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
