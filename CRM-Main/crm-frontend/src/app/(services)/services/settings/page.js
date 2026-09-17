"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Settings,
  Shield,
  Building,
  FileText,
  Briefcase,
  Users,
  UserCog,
} from "lucide-react";
import AccessDenied from "@/components/AccessDenied";
import { useRole } from "@/app/(services)/context/RoleContext";

// Reuse the existing, real settings components (they talk to the real backend).
import AdminSettings from "@/app/(retailers)/settings/components/AdminSettings";
import CompanySettings from "@/app/(retailers)/settings/components/CompanySettings";
import ChangePassword from "@/app/(retailers)/settings/components/ChangePassword";
import BillingSettings from "@/app/(restaurants)/restaurant/settings/components/BillingSettings";
import ProjectPrefixSettings from "./components/ProjectPrefixSettings";
import ClientPrefixSettings from "./components/ClientPrefixSettings";

const ACTIVE_TAB_STORAGE_KEY = "servicesSettingsActiveTab";

function SettingsContent() {
  const [activeTab, setActiveTab] = useState("admin");
  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "password") {
      setActiveTab("password");
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, "password");
      return;
    }

    const saved =
      typeof window !== "undefined" &&
      localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (saved) setActiveTab(saved === "invoice" ? "billing" : saved);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
    }
  }, [activeTab]);

  const { can } = useRole();

  const tabs = [
    {
      id: "admin",
      name: "My Profile",
      icon: UserCog,
      description: "Manage your personal information and preferences",
    },
    ...(can("SETTINGS", "READ")
      ? [
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
            id: "project",
            name: "Project Prefix",
            icon: Briefcase,
            description: "Configure project ID prefix and numbering",
          },
          {
            id: "client",
            name: "Client Prefix",
            icon: Users,
            description: "Configure client ID prefix and numbering",
          },
        ]
      : []),
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
    <div className="w-full">
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
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
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
          {activeTab === "project" && <ProjectPrefixSettings />}
          {activeTab === "client" && <ClientPrefixSettings />}
          {activeTab === "password" && <ChangePassword />}
        </div>
      </div>
    </div>
  );
}

export default function ServicesSettingsPage() {
  const { loading } = useRole();

  if (loading) {
    return (
      <div className="p-10 text-center font-medium">Verifying access...</div>
    );
  }

  return (
    <Suspense fallback={<div className="p-10 text-center">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

