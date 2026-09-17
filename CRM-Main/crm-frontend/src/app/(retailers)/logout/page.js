"use client";

import { useEffect } from "react";
import { logout } from "@/utils/auth";

export default function LogoutPage() {
  useEffect(() => {
    // Force logout immediately
    logout();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-gray-600">Logging out...</p>
      </div>
    </div>
  );
}
