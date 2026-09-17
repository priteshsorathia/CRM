"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShopProvider } from "@/context/ShopContext";
import Link from "next/link";
import Image from "next/image";

import AuthForm from "./components/AuthForm";
import { isAuthenticated } from "@/utils/auth";
import { getRedirectByUserType } from "@/constants/routes";
import {
  Shield,
  Zap,
  BarChart3,
  Lock,
  CheckCircle2,
  HelpCircle
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    try {
      sessionStorage.removeItem("isLoggingOut");
    } catch {
      // non-blocking
    }

    if (isAuthenticated()) {
      // Check userType and redirect accordingly
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token) {
          const parts = token.split('.');
          if (parts.length < 2) {
            throw new Error("Invalid token format");
          }
          const payload = JSON.parse(atob(parts[1]));
          const exp = Number(payload?.exp);
          if (Number.isFinite(exp) && exp <= Date.now() / 1000 + 5) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("token");
            setCheckingAuth(false);
            return;
          }
          const userType = payload.userType || 'retailers';

          let role = '';
          try {
            const rawUser = localStorage.getItem('userData') || localStorage.getItem('user');
            const u = rawUser ? JSON.parse(rawUser) : null;
            role = u?.role || u?.user_role || u?.user?.role || '';
          } catch {
            role = '';
          }

          router.push(getRedirectByUserType(userType, role));
        } else {
          setCheckingAuth(false);
        }
      } catch {
        localStorage.removeItem("authToken");
        localStorage.removeItem("token");
        setCheckingAuth(false);
      }
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#5655eb] border-t-transparent" />
      </div>
    );
  }

  const features = [
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Enterprise Security",
      desc: "Bank-grade encryption & data protection"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Lightning Fast",
      desc: "Optimized for speed and performance"
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Real-time Analytics",
      desc: "Make data-driven decisions instantly"
    },
    {
      icon: <Lock className="w-5 h-5" />,
      title: "Privacy First",
      desc: "Your data stays in India"
    }
  ];

  return (
    <ShopProvider>
      <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 via-white to-slate-50">
        
        {/* Left Panel - Branding & Features */}
        <div className="lg:w-1/2 flex flex-col justify-between px-6 py-8 lg:px-12 lg:py-12 bg-gradient-to-br from-[#5655eb] to-[#4338ca] text-white relative overflow-hidden">
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>

          <div className="relative z-10 flex flex-col h-full">
            {/* Top - Logo & Branding */}
            <div className="mb-8 lg:mb-12">
              <Link href="/" className="inline-block mb-8 hover:opacity-90 transition-opacity">
                <div className="bg-white rounded-lg px-4 py-3 shadow-lg inline-block">
                  <Image
                    src="/shop-logo.png"
                    alt="CRM Logo"
                    width={160}
                    height={48}
                    className="h-12 w-auto object-contain"
                    priority
                  />
                </div>
              </Link>
              <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                Welcome back
              </h1>
              <p className="text-white/90 text-lg">
                Sign in to continue to your business dashboard
              </p>
            </div>

            {/* Middle - Features */}
            <div className="flex-1 flex items-center">
              <div className="space-y-6 w-full max-w-md">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-white/80 text-sm">
                        {feature.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Bottom - Footer */}
            <div className="mt-8 pt-8 border-t border-white/20">
              <p className="text-white/80 text-sm mb-2">
                Powered by <span className="font-semibold text-white">CRM</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                <Link href="/auth/support" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" />
                  Support
                </Link>
                <Link href="/auth/terms" className="hover:text-white transition-colors">
                  Terms
                </Link>
                <Link href="/auth/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="lg:w-1/2 flex items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Suspense fallback={<div className="h-40 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-[#5655eb] border-t-transparent" /></div>}>
                <AuthForm />
              </Suspense>
            </motion.div>
          </div>
        </div>

      </div>
    </ShopProvider>
  );
}
