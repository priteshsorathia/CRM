"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  Package,
  FileText,
  Users,
  Wallet,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { isAuthenticated } from "@/utils/auth";
import { REDIRECT_ROUTES, getRedirectByUserType } from "@/constants/routes";

export default function LandingPageClient() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (isAuthenticated()) {
      // Get userType from token and redirect accordingly
      try {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userType = payload.userType || 'retailers';

          let role = '';
          try {
            const rawUser = localStorage.getItem('userData') || localStorage.getItem('user');
            const u = rawUser ? JSON.parse(rawUser) : null;
            role = u?.role || u?.user_role || u?.user?.role || '';
          } catch {
            role = '';
          }

          const redirectPath = getRedirectByUserType(userType, role);
          router.replace(redirectPath);
        } else {
          router.replace(REDIRECT_ROUTES.authenticated);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        router.replace(REDIRECT_ROUTES.authenticated);
      }
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden
      bg-[radial-gradient(circle_at_top_left,_#eef2ff,_#f8fafc_40%,_#ffffff)]"
    >
      {/* ================= HERO ================= */}
      <section className="relative z-10 px-6 lg:px-20 pt-28 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl"
        >
          <h1 className="text-5xl font-bold text-gray-900 leading-tight">
            One platform to manage
            <span className="block text-indigo-600 mt-2">
              your entire business
            </span>
          </h1>

          <p className="mt-6 text-lg text-gray-600 max-w-2xl">
            CRM helps you manage sales, invoices, inventory, expenses,
            payroll, HRMS, and analytics — all from a single, powerful
            dashboard.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2
              rounded-lg bg-indigo-600 px-6 py-3 text-white
              font-medium hover:bg-indigo-700 transition"
            >
              Login to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/auth/get-started"
              className="inline-flex items-center gap-2
              rounded-lg border border-indigo-200 px-6 py-3
              text-indigo-600 font-medium hover:bg-indigo-50 transition"
            >
              Get Started
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="px-6 lg:px-20 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <Feature
            icon={<BarChart3 />}
            title="Sales & Analytics"
            desc="Track revenue, profit, and growth in real-time."
          />
          <Feature
            icon={<FileText />}
            title="Invoices & Billing"
            desc="Create GST invoices, manage payments and dues."
          />
          <Feature
            icon={<Package />}
            title="Inventory Management"
            desc="Stock tracking, low-stock alerts, unit pricing."
          />
          <Feature
            icon={<Wallet />}
            title="Expenses & Accounting"
            desc="Track business expenses and cash flow."
          />
          <Feature
            icon={<Users />}
            title="HRMS & Payroll"
            desc="Attendance, salaries, payroll processing."
          />
          <Feature
            icon={<ShieldCheck />}
            title="Secure & Reliable"
            desc="Enterprise-grade security and data protection."
          />
        </motion.div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="px-6 lg:px-20 pb-24">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">
          How CRM works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Step
            number="01"
            title="Create your account"
            desc="Sign up and configure your shop details."
          />
          <Step
            number="02"
            title="Manage daily operations"
            desc="Sales, invoices, inventory, staff & payroll."
          />
          <Step
            number="03"
            title="Track & grow"
            desc="Use analytics to make better decisions."
          />
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="px-6 lg:px-20 pb-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl bg-indigo-600 px-10 py-16 text-center"
        >
          <h2 className="text-3xl font-bold text-white">
            Ready to manage your business smarter?
          </h2>

          <p className="mt-4 text-indigo-100">
            Start using CRM today and simplify your operations.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/auth/login"
              className="bg-white text-indigo-600 font-medium
              px-6 py-3 rounded-lg hover:bg-indigo-50 transition"
            >
              Login
            </Link>

            <Link
              href="/auth/get-started"
              className="border border-white/40 text-white
              px-6 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Get Started
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-gray-200 px-6 lg:px-20 py-6 text-sm text-gray-500">
        © {new Date().getFullYear()} CRM. All rights reserved.
      </footer>
    </div>
  );
}

/* ---------- Components ---------- */

function Feature({ icon, title, desc }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600 text-sm">{desc}</p>
    </div>
  );
}

function Step({ number, title, desc }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="text-indigo-600 font-bold text-xl">{number}</div>
      <h3 className="mt-2 font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600 text-sm">{desc}</p>
    </div>
  );
}
