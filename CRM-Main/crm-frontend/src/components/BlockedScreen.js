"use client";
import React from 'react';
import { FiShieldOff, FiAlertCircle } from 'react-icons/fi';
import { logout } from '@/utils/auth';

export default function BlockedScreen({ reason = 'Your account has been blocked' }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6 font-['Poppins',_sans-serif]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShieldOff className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Account Blocked</h1>
          <p className="text-gray-600 mb-6">{reason}</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-red-800 font-semibold mb-1">What does this mean?</p>
              <p className="text-sm text-red-700">
                Your account or shop has been temporarily suspended. Please contact the administrator for assistance.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="w-full px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-semibold"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}
