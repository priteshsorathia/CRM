"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, Shield, Building, FileText, UserCog, ClipboardList } from "lucide-react";
import AccessDenied from "@/components/AccessDenied";

// Reuse the existing, real settings components (they talk to the real backend).
import AdminSettings from "@/app/(retailers)/settings/components/AdminSettings";
import CompanySettings from "@/app/(retailers)/settings/components/CompanySettings";
import ChangePassword from "@/app/(retailers)/settings/components/ChangePassword";
import BillingSettings from "./components/BillingSettings";
import OrderSettings from "./components/OrderSettings";

function SettingsContent() {
  const [activeTab, setActiveTab] = useState("admin");
  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "password") {
      setActiveTab("password");
      localStorage.setItem("restaurantSettingsActiveTab", "password");
      return;
    }

    const saved =
      typeof window !== "undefined" &&
      localStorage.getItem("restaurantSettingsActiveTab");
    if (saved) setActiveTab(saved === "invoice" ? "billing" : saved);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("restaurantSettingsActiveTab", activeTab);
    }
  }, [activeTab]);

  const tabs = [
    {
      id: "admin",
      name: "My Profile",
      icon: UserCog,
      description: "Manage your personal information and preferences",
    },
    {
      id: "company",
      name: "Company Settings",
      icon: Building,
      description: "Update your company information and branding",
    },
    {
      id: "billing",
      name: "Billing Settings",
      icon: FileText,
      description: "Configure bill prefix, GST and footer notes",
    },
    {
      id: "order",
      name: "Order Settings",
      icon: ClipboardList,
      description: "Configure order prefix and numbering",
    },
    {
      id: "password",
      name: "Change Password",
      icon: Shield,
      description: "Update your password for account security",
    },
  ];

  const activeTabData = tabs.find((t) => t.id === activeTab);
  const ActiveIcon = activeTabData?.icon;

  return (
    <main className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        </div>
        <p className="text-sm text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-b border-gray-200 bg-gray-50">
          <div className="px-6 py-4">
            <div className="flex items-center gap-3">
              {ActiveIcon && <ActiveIcon className="w-5 h-5 text-gray-600" />}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeTabData?.name}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {activeTabData?.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {activeTab === "admin" && <AdminSettings />}
          {activeTab === "company" && <CompanySettings />}
          {activeTab === "billing" && <BillingSettings />}
          {activeTab === "order" && <OrderSettings />}
          {activeTab === "password" && <ChangePassword />}
        </div>
      </div>
    </main>
  );
}

export default function RestaurantSettingsPage() {
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
      const u = rawUser ? JSON.parse(rawUser) : null;
      const role = String(u?.role || u?.user_role || u?.user?.role || "").trim().toLowerCase();

      const isOwnerOrManager =
        role === "admin" ||
        role === "administrator" ||
        role === "owner" ||
        role === "shop_owner" ||
        role === "restaurant_owner" ||
        role === "manager" ||
        role === "restaurant_manager" ||
        role.endsWith("_owner") ||
        role.endsWith("_manager");

      setHasAccess(isOwnerOrManager);
      setAccessChecked(true);
    } catch {
      setHasAccess(false);
      setAccessChecked(true);
    }
  }, []);

  if (!accessChecked) {
    return <div className="p-10 text-center">Verifying access...</div>;
  }

  if (!hasAccess) {
    return <AccessDenied homeHref="/restaurant/tables" homeLabel="Go to Tables" />;
  }

  return (
    <Suspense fallback={<div className="p-10 text-center">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
