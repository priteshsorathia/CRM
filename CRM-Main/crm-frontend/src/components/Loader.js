"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Barcode,
  CreditCard,
  PackageCheck,
  Loader2,
} from "lucide-react";

const icons = [
  ShoppingCart,
  Barcode,
  CreditCard,
  PackageCheck,
];

/**
 * Enhanced Loader Component
 * @param {Object} props
 * @param {'full-page' | 'container' | 'inline-compact'} props.variant - Display mode
 * @param {string} props.message - Optional loading message
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.autoHide - Whether to automatically hide after window load (only for full-page)
 */
export default function Loader({
  variant = 'full-page',
  message,
  className = "",
  autoHide = true
}) {
  const [showLoader, setShowLoader] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % icons.length);
    }, 500);

    if (variant === 'full-page' && autoHide) {
      const handleLoad = () => {
        setTimeout(() => setShowLoader(false), 700);
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener("load", handleLoad);
        return () => {
          clearInterval(interval);
          window.removeEventListener("load", handleLoad);
        };
      }
    }

    return () => clearInterval(interval);
  }, [variant, autoHide]);

  if (!showLoader && variant === 'full-page' && autoHide) return null;

  if (variant === 'inline-compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-inherit" />
        {message && <span className="text-sm font-medium">{message}</span>}
      </div>
    );
  }

  if (variant === 'container') {
    return (
      <div className={`flex flex-col items-center justify-center p-8 w-full ${className}`}>
        <div className="flex gap-3 mb-4">
          {icons.map((Ico, i) => (
            <Ico
              key={i}
              className={`h-6 w-6 transition-all duration-300
                ${i === active
                  ? "text-blue-500 scale-110"
                  : "text-slate-300"
                }`}
            />
          ))}
        </div>
        <p className="text-slate-500 text-sm font-medium animate-pulse">
          {message || "Loading..."}
        </p>
      </div>
    );
  }

  // Default: full-page
  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900 ${className}`}>
      <div className="flex gap-4 mb-6">
        {icons.map((Ico, i) => (
          <Ico
            key={i}
            className={`h-10 w-10 transition-all duration-300
              ${i === active
                ? "text-indigo-400 scale-125"
                : "text-slate-600"
              }`}
          />
        ))}
      </div>

      <p className="text-slate-400 text-sm tracking-wide">
        {message || "Initializing POS System…"}
      </p>
    </div>
  );
}
