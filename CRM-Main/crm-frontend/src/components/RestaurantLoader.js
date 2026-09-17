"use client";

import { useEffect, useState } from "react";
import {
  FaUtensils,
  FaFire,
  FaShoppingCart,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";

const restaurantIcons = [
  FaUtensils,
  FaFire,
  FaShoppingCart,
  FaCheckCircle,
];

/**
 * Restaurant-themed Loader Component
 * @param {Object} props
 * @param {'full-page' | 'container' | 'inline-compact'} props.variant - Display mode
 * @param {string} props.message - Optional loading message
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.autoHide - Whether to automatically hide after window load (only for full-page)
 */
export default function RestaurantLoader({
  variant = 'container',
  message,
  className = "",
  autoHide = true
}) {
  const [showLoader, setShowLoader] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % restaurantIcons.length);
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
        <FaSpinner className="h-4 w-4 animate-spin text-indigo-600" />
        {message && <span className="text-sm font-medium">{message}</span>}
      </div>
    );
  }

  if (variant === 'container') {
    return (
      <div className={`flex flex-col items-center justify-center p-8 w-full gap-4 ${className}`}>
        <div className="relative">
          {/* Animated Utensils Icon in Center */}
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <FaUtensils className="text-white text-3xl" />
          </div>
          {/* Rotating Icons around */}
          <div className="absolute inset-0 flex items-center justify-center">
            {restaurantIcons.map((Ico, i) => {
              const angle = (i * 360) / restaurantIcons.length;
              const radius = 50;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              return (
                <div
                  key={i}
                  className={`absolute transition-all duration-500 ${
                    i === active ? "scale-125 opacity-100" : "scale-100 opacity-40"
                  }`}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                >
                  <Ico
                    className={`h-6 w-6 transition-all duration-300 ${
                      i === active
                        ? "text-indigo-600 scale-110"
                        : "text-gray-400"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-gray-600 text-base font-semibold animate-pulse">
          {message || "Loading Restaurant..."}
        </p>
      </div>
    );
  }

  // Default: full-page
  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white gap-5 ${className}`}>
      <div className="relative">
        {/* Animated Utensils Icon in Center */}
        <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
          <FaUtensils className="text-white text-5xl" />
        </div>
        {/* Rotating Icons around */}
        <div className="absolute inset-0 flex items-center justify-center">
          {restaurantIcons.map((Ico, i) => {
            const angle = (i * 360) / restaurantIcons.length;
            const radius = 80;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            return (
              <div
                key={i}
                className={`absolute transition-all duration-500 ${
                  i === active ? "scale-125 opacity-100" : "scale-100 opacity-40"
                }`}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
              >
                <Ico
                  className={`h-10 w-10 transition-all duration-300 ${
                    i === active
                      ? "text-indigo-600 scale-110"
                      : "text-gray-400"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-gray-700 text-lg font-semibold tracking-wide animate-pulse">
        {message || "Initializing Restaurant System…"}
      </p>
    </div>
  );
}
