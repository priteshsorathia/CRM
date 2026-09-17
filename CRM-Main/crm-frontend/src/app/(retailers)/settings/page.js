'use client';

import { useEffect, useState, Suspense } from 'react';
import AdminSettings from './components/AdminSettings';
import CompanySettings from './components/CompanySettings';
import InvoiceSettings from './components/InvoiceSettings';
import { Settings, Shield, Building, FileText, UserCog } from 'lucide-react';
import ChangePassword from './components/ChangePassword';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

function SettingsContent() {
  const [activeTab, setActiveTab] = useState('admin');
  const [userRole, setUserRole] = useState(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Detect user role from local storage
    if (typeof window !== "undefined") {
      const userDataStr = localStorage.getItem("userData");
      const userStr = localStorage.getItem("user");
      let user = {};
      try {
        if (userDataStr) user = { ...user, ...JSON.parse(userDataStr) };
        if (userStr) user = { ...user, ...JSON.parse(userStr) };
        setUserRole(user.role || user.user_role || null);
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }

    // Check if coming with a tab parameter or path
    const pathTabName = pathname ? decodeURIComponent(pathname.split('/').pop()) : null;
    let matchedTabId = null;
    const normalizedPath = pathTabName ? pathTabName.toLowerCase().replace(/\s+/g, '-') : '';

    if (normalizedPath === 'admin-settings' || normalizedPath === 'profile-settings' || normalizedPath === 'admin-setting' || normalizedPath === 'admin') {
      matchedTabId = 'admin';
    } else if (normalizedPath === 'company-settings' || normalizedPath === 'company-setting' || normalizedPath === 'company') {
      matchedTabId = 'company';
    } else if (normalizedPath === 'invoice-settings' || normalizedPath === 'invoice-setting' || normalizedPath === 'invoice') {
      matchedTabId = 'invoice';
    } else if (normalizedPath === 'change-password' || normalizedPath === 'password') {
      matchedTabId = 'password';
    }

    const tabParam = searchParams.get('tab');
    
    if (matchedTabId) {
      setActiveTab(matchedTabId);
      localStorage.setItem('settingsActiveTab', matchedTabId);
    } else if (tabParam) {
      setActiveTab(tabParam);
      localStorage.setItem('settingsActiveTab', tabParam);
    } else {
      const saved = typeof window !== 'undefined' && localStorage.getItem('settingsActiveTab');
      if (saved) setActiveTab(saved);
    }
  }, [searchParams, pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('settingsActiveTab', activeTab);
  }, [activeTab]);

  const isOwner = userRole && ["shop_owner", "owner"].includes(userRole);

  const allTabs = [
    { 
      id: 'admin', 
      name: isOwner ? 'Admin Settings' : 'Profile Settings', 
      icon: UserCog,
      description: isOwner ? 'Manage administrator preferences and system settings' : 'Update your personal profile information'
    },
    { 
      id: 'company', 
      name: 'Company Settings', 
      icon: Building,
      description: 'Update your company information and branding'
    },
    { 
      id: 'invoice', 
      name: 'Invoice Settings', 
      icon: FileText,
      description: 'Customize invoice templates and numbering'
    },
    { 
      id: 'password', 
      name: 'Change Password', 
      icon: Shield,
      description: 'Update your password for account security'
    }
  ];

  const tabs = allTabs.filter(tab => {
    if (!isOwner) {
      return tab.id === 'admin' || tab.id === 'password';
    }
    return true;
  });

  // Ensure activeTab is valid for the current role
  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const getActiveTabData = () => {
    return tabs.find(tab => tab.id === activeTab) || tabs[0];
  };

  return (
    <main className="p-4 sm:p-6">
      
      {/* Page Header */}
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
        
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    const urlSlug = tab.name.toLowerCase().replace(/\s+/g, '-');
                    router.push(`/settings/${urlSlug}`);
                  }}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Header */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="px-6 py-4">
            {(() => {
              const activeTabData = getActiveTabData();
              const IconComponent = activeTabData?.icon;
              return (
                <div className="flex items-center gap-3">
                  {IconComponent && <IconComponent className="w-5 h-5 text-gray-600" />}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {activeTabData?.name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {activeTabData?.description}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'admin' && <AdminSettings />}
          {isOwner && activeTab === 'company' && <CompanySettings />}
          {isOwner && activeTab === 'invoice' && <InvoiceSettings />}
          {activeTab === 'password' && <ChangePassword />}
        </div>
      </div>
    </main>
  );
}

// Export the main component wrapped in Suspense
export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}