'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import RestaurantLoader from '@/components/RestaurantLoader';
import ChangePassword from '@/app/(retailers)/settings/components/ChangePassword';
import { getApiBase } from '@/utils/apiBase';

const API_BASE = getApiBase();

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken') || localStorage.getItem('token');
}

export default function RestaurantAccountPage() {
  const [activeTab, setActiveTab] = useState('profile'); // profile | password
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [userRole, setUserRole] = useState('');

  const isRestrictedRole = ['manager', 'restaurant_manager', 'staff', 'cook'].includes(userRole);

  const canSave = useMemo(() => {
    const name = String(profile.name || '').trim();
    const email = String(profile.email || '').trim();
    return Boolean(name || email);
  }, [profile]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('userData') || localStorage.getItem('user');
        const parsed = raw ? JSON.parse(raw) : null;
        const role = String(parsed?.role || parsed?.user_role || parsed?.user?.role || '').trim().toLowerCase();
        setUserRole(role);
      } catch (e) {
        console.error(e);
      }
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) {
          toast.error('Authentication required. Please login again.');
          return;
        }

        const res = await fetch(`${API_BASE}/api/profile/get-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to load profile');
        }

        const data = json.data || {};
        setProfile({
          name: data.name || '',
          email: data.email || '',
        });
      } catch (err) {
        toast.error(err?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    if (saving) return;

    try {
      setSaving(true);
      const token = getToken();
      if (!token) {
        toast.error('Authentication required. Please login again.');
        return;
      }

      const body = {
        name: String(profile.name || '').trim() || undefined,
        email: String(profile.email || '').trim() || undefined,
      };

      const res = await fetch(`${API_BASE}/api/profile/update-profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update profile');
      }

      // Keep localStorage userData in sync for Header, Sidebar, etc.
      try {
        const existing = localStorage.getItem('userData');
        const parsed = existing ? JSON.parse(existing) : {};
        const updated = { ...parsed, ...json.data };
        localStorage.setItem('userData', JSON.stringify(updated));
        window.dispatchEvent(new Event('userUpdated'));
      } catch {
        // non-blocking
      }

      toast.success(json.message || 'Profile updated');
    } catch (err) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <RestaurantLoader variant="container" message="Loading settings..." className="py-8" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Update your profile and password.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('password')}
                className={`px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'password'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Password
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'profile' ? (
              <div className="max-w-2xl space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    value={profile.email}
                    onChange={(e) => {
                      if (!isRestrictedRole) {
                        setProfile((p) => ({ ...p, email: e.target.value }));
                      }
                    }}
                    readOnly={isRestrictedRole}
                    className={`w-full px-3 py-2.5 border rounded-lg outline-none ${
                      isRestrictedRole
                        ? 'bg-gray-50 text-gray-500 cursor-not-allowed border-gray-300 select-none'
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="you@example.com"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <ChangePassword />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
