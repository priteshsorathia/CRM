"use client";

import { useRouter } from "next/navigation";
import { ShieldX, ArrowLeft, Home } from "lucide-react";

export default function AccessDenied({
  homeHref = "/dashboard",
  homeLabel = "Go to Dashboard",
} = {}) {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Access Denied
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-2">
          You don't have permission to access this page.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          This page is restricted to Shop Owners only. Please contact your administrator if you believe this is an error.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => router.push(homeHref)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Home className="w-4 h-4" />
            {homeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

