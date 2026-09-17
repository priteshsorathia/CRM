"use client";
import React from 'react';

// Access denied page - password is required in URL
export default function SellerDashboardAccessDenied() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-['Poppins',_sans-serif]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          This page is password protected. Please include the password in the URL.
        </p>
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 font-semibold mb-2">Correct URL format:</p>
          <code className="text-xs text-blue-600 break-all">
            /auth/seller-dashboard/[password]
          </code>
        </div>
        <p className="text-sm text-gray-500">
          Example: <code className="bg-gray-100 px-2 py-1 rounded text-xs">/auth/seller-dashboard/admin123</code>
        </p>
      </div>
    </div>
  );
}