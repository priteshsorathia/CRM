'use client';
import { useDashboard } from "@/app/(retailers)/context/DashboardContext";
import SummaryCard from "@/components/SummaryCard";
import ChartCard from "@/components/ChartCard";
import { TopItemsTable } from "@/components/TopItemsTable";
import RecentInvoicesTable from "@/components/RecentInvoicesTable";
import Loader from "@/components/Loader";
import VersionCheck from "@/components/VersionCheck";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ArrowDown, Calendar, Plus, CreditCard, TrendingUp, Users, Sparkles, Info, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

// Import flatpickr components differently to avoid SSR issues
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";

// Import monthSelectPlugin separately
import monthSelectPlugin from "flatpickr/dist/plugins/monthSelect";
import "flatpickr/dist/plugins/monthSelect/style.css";

// Import flatpickr dynamically to avoid SSR issues
const FlatpickrComponent = dynamic(() => import("react-flatpickr"), {
  ssr: false,
  loading: () => (
    <div className="dashboard-datepicker px-3 py-2 border rounded-lg border-gray-300 bg-gray-100 text-sm font-medium w-32 h-[42px] animate-pulse"></div>
  ),
});

import dynamic from "next/dynamic";

export default function DashboardPage() {
  const { timeframe, setTimeframe } = useDashboard();
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [loading, setLoading] = useState(true);

  // State for View (Revenue vs Profit)
  const [viewMode, setViewMode] = useState('revenue');

  // State for Date Filter
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [isDateFilterActive, setIsDateFilterActive] = useState(false);

  // DB State: Hide Non-Taxable
  const [hideNonTaxable, setHideNonTaxable] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  // State for Data
  const [dashboardData, setDashboardData] = useState({
    summary: { total: 0, day: 0, week: 0, month: 0 },
    chart: { labels: [], data: [] },
    topItems: [],
    recentInvoices: []
  });

  // EMI Statistics State
  const [emiStats, setEmiStats] = useState({
    totalEmiInvoices: 0,
    totalEmiAmount: 0,
    activeEmiPlans: 0,
    monthlyEmiCollection: 0,
    totalOutstanding: 0
  });
  const [emiLoading, setEmiLoading] = useState(true);
  const [isEmiVisible, setIsEmiVisible] = useState(true);

  // Refs for flatpickr instances
  const datePickerRef = useRef(null);
  const monthPickerRef = useRef(null);

  // Check welcome banner
  useEffect(() => {
    const hasSeenWelcomeBanner = localStorage.getItem('hasSeenWelcomeBanner');
    if (!hasSeenWelcomeBanner) setShowWelcomeBanner(true);

    // Load EMI visibility preference
    const emiVisibility = localStorage.getItem('emiDashboardSectionVisible');
    if (emiVisibility !== null) {
      setIsEmiVisible(emiVisibility === 'true');
    }
  }, []);

  // 1. FETCH GLOBAL SETTING FROM DB ON MOUNT
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/shop-details`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data && data.settings) {
          setHideNonTaxable(data.settings.hide_non_taxable || false);
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      } finally {
        setIsSettingsLoaded(true);
      }
    };
    fetchSettings();
  }, []);

  // 2. TOGGLE FUNCTION
  const toggleNonTaxable = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/toggle-tax-view`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHideNonTaxable(data.hide_non_taxable);
      }
    } catch (e) {
      console.error("Failed to toggle settings", e);
    }
  };

  const handleCloseWelcomeBanner = () => {
    setShowWelcomeBanner(false);
    localStorage.setItem('hasSeenWelcomeBanner', 'true');
  };

  const toggleEmiVisibility = () => {
    const newValue = !isEmiVisible;
    setIsEmiVisible(newValue);
    localStorage.setItem('emiDashboardSectionVisible', newValue.toString());
  };

  // --- Fetch Data ---
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const queryParams = new URLSearchParams({
        timeframe: timeframe,
        view: viewMode,
        excludeNonTaxable: hideNonTaxable
      });

      // Handle Single Date Filter
      if (selectedDate) {
        const offset = selectedDate.getTimezoneOffset();
        const adjustedDate = new Date(selectedDate.getTime() - (offset * 60 * 1000));
        queryParams.append('selectedDate', adjustedDate.toISOString().split('T')[0]);
      }
      // Handle Month Filter
      else if (selectedMonth) {
        const monthStr = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;
        queryParams.append('selectedMonth', monthStr);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch EMI Statistics
  const fetchEmiStats = async () => {
    try {
      setEmiLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/emi`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();

        // Map API response to state structure
        if (result.success && result.data && result.data.stats) {
          const stats = result.data.stats;
          setEmiStats({
            totalEmiInvoices: stats.totalEmiInvoices || 0,
            totalEmiAmount: stats.totalEmiAmount || 0,
            activeEmiPlans: stats.activeEmiPlans || 0,
            monthlyEmiCollection: stats.monthlyEmiCollection || 0,
            totalOutstanding: stats.totalOutstanding || 0
          });
        }
      } else {
        console.error("Failed to fetch EMI stats:", response.status);
        // Set default values on error
        setEmiStats({
          totalEmiInvoices: 0,
          totalEmiAmount: 0,
          activeEmiPlans: 0,
          monthlyEmiCollection: 0,
          totalOutstanding: 0
        });
      }
    } catch (error) {
      console.error("Failed to load EMI stats:", error);
      // Set default values on error
      setEmiStats({
        totalEmiInvoices: 0,
        totalEmiAmount: 0,
        activeEmiPlans: 0,
        monthlyEmiCollection: 0,
        totalOutstanding: 0
      });
    } finally {
      setEmiLoading(false);
    }
  };

  // Fetch when inputs change
  useEffect(() => {
    if (!isSettingsLoaded) return;
    fetchDashboardData();
    fetchEmiStats();
  }, [timeframe, viewMode, isDateFilterActive, selectedDate, selectedMonth, hideNonTaxable, isSettingsLoaded]);

  // Handle Date/Month Changes
  const handleDateChange = useCallback((dates) => {
    if (dates && dates[0]) {
      setSelectedDate(dates[0]);
      setSelectedMonth(null); // Clear month if date selected
      setIsDateFilterActive(true);
    }
  }, []);

  const handleMonthChange = useCallback((dates) => {
    if (dates && dates[0]) {
      setSelectedMonth(dates[0]);
      setSelectedDate(null); // Clear date if month selected
      setIsDateFilterActive(true);
    }
  }, []);

  // Clear date filter
  const clearDateFilter = useCallback(() => {
    setSelectedDate(null);
    setSelectedMonth(null);
    setIsDateFilterActive(false);
    setTimeframe('week'); // Reset to default view
  }, [setTimeframe]);

  // ✅ FIXED: Enable Card Switching
  // When a card is clicked, we clear the date filter and switch to that card's timeframe
  const handleTimeframeChange = (newTimeframe) => {
    if (isDateFilterActive) {
      clearDateFilter();
    }
    setTimeframe(newTimeframe);
  };

  // Clean up flatpickr instances on unmount
  useEffect(() => {
    return () => {
      if (datePickerRef.current && datePickerRef.current.flatpickr) {
        datePickerRef.current.flatpickr.destroy();
      }
      if (monthPickerRef.current && monthPickerRef.current.flatpickr) {
        monthPickerRef.current.flatpickr.destroy();
      }
    };
  }, []);

  // Summary Data Map
  const summaryData = [
    {
      title: isDateFilterActive
        ? `${viewMode === 'revenue' ? 'Revenue' : 'Profit'} ${selectedDate ? 'on Date' : 'in Month'}`
        : `Total ${viewMode === 'revenue' ? 'Revenue' : 'Profit'}`,
      value: dashboardData.summary.total,
      icon: "rupee",
      color: "blue",
      timeframe: "total"
    },
    {
      title: `Today's ${viewMode === 'revenue' ? 'Revenue' : 'Profit'}`,
      value: dashboardData.summary.day,
      icon: "payment",
      color: "green",
      timeframe: "day"
    },
    {
      title: `Weekly ${viewMode === 'revenue' ? 'Revenue' : 'Profit'}`,
      value: dashboardData.summary.week,
      icon: "calendar-week",
      color: "purple",
      timeframe: "week"
    },
    {
      title: `Monthly ${viewMode === 'revenue' ? 'Revenue' : 'Profit'}`,
      value: dashboardData.summary.month,
      icon: "calendar",
      color: "indigo",
      timeframe: "month"
    }
  ];

  // Loading Screen
  if (loading && dashboardData.topItems.length === 0) {
    return (
      <div>
        <Loader variant="container" message="Preparing dashboard analytics..." className="min-h-[400px]" />
      </div>
    );
  }

  return (
    <div>

      {/* Version & Status Banner */}
      <div className="mb-6">
        <VersionCheck />
      </div>

      {/* Header Row: Title + Filters */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h1>
          {/* Quick Add Button for Mobile */}
          <Link
            href="/invoices/add"
            className="sm:hidden flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-md transition-all text-xs font-bold active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            New Invoice
          </Link>
        </div>

        {/* Filters Container */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">

          {/* FILTER GROUP: Date & Month */}
          <div className="relative flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 sm:bg-transparent sm:p-0 sm:border-0 sm:flex-row sm:items-center sm:gap-2 sm:w-auto">
            
            {/* Secret Button (Absolute to avoid layout shift) */}
            <div
              onClick={toggleNonTaxable}
              className="absolute -top-1 left-0 w-4 h-4 cursor-default opacity-0 select-none z-10"
              title=""
            ></div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest sm:hidden">Filter by Time</span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 w-full sm:flex sm:w-auto">
              {/* 1. Date Picker */}
              <FlatpickrComponent
                options={{
                  dateFormat: "d-m-Y",
                  maxDate: new Date(),
                  disableMobile: true // Prevents mobile native picker
                }}
                className={`dashboard-datepicker px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium w-full sm:w-32 ${selectedDate ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
                value={selectedDate ?? ""}
                onChange={handleDateChange}
                placeholder="Date"
                ref={datePickerRef}
              />

              <span className="text-gray-400 text-[10px] font-bold uppercase">or</span>

              {/* 2. Month Picker */}
              <FlatpickrComponent
                options={{
                  plugins: [
                    monthSelectPlugin({
                      shorthand: true,
                      dateFormat: "F Y",
                      altFormat: "F Y",
                      theme: "light"
                    })
                  ],
                  disableMobile: true // Prevents mobile native picker
                }}
                className={`dashboard-datepicker px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium w-full sm:w-32 ${selectedMonth ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
                value={selectedMonth ?? ""}
                onChange={handleMonthChange}
                placeholder="Month"
                ref={monthPickerRef}
              />
            </div>

            {isDateFilterActive && (
              <button
                onClick={clearDateFilter}
                className="absolute right-2 top-2 sm:relative sm:top-0 text-gray-500 hover:text-red-600 transition-colors ml-1"
                title="Clear filters"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* VIEW DROPDOWN & NEW INVOICE BUTTON (Desktop only link) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-none bg-white border border-gray-300 rounded-lg px-3 py-2 sm:border-0 sm:p-0 sm:bg-transparent h-[38px] sm:h-auto overflow-hidden">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest sm:text-sm sm:font-semibold sm:text-gray-600 sm:normal-case sm:tracking-normal whitespace-nowrap">View:</span>
              <div className="relative flex-1">
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                  className="appearance-none bg-transparent sm:bg-white sm:border sm:border-gray-300 text-gray-700 py-0 sm:py-2 sm:pl-4 sm:pr-8 rounded-lg sm:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold sm:font-medium cursor-pointer w-full sm:w-auto"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                >
                  <option value="revenue">Overall (Revenue)</option>
                  <option value="profit">Profit</option>
                </select>
                <div className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* New Invoice Button (Desktop) */}
            <Link
              href="/invoices/add"
              className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </Link>
          </div>
        </div>
      </div>

      {/* Active Filter Badge */}
      {isDateFilterActive && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <p className="text-sm text-blue-800">
            📅 Showing data for: <span className="font-bold">
              {selectedDate
                ? selectedDate.toLocaleDateString('en-GB')
                : selectedMonth
                  ? selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
                  : ''}
            </span>
          </p>
          <button
            onClick={clearDateFilter}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* EMI Feature Highlight - USP Banner */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border-2 border-indigo-100 overflow-hidden">
        <div
          className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
          onClick={toggleEmiVisibility}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                EMI Payment Plans
              </h2>
              {!isEmiVisible && <p className="text-gray-500 text-xs sm:text-sm">Flexible payment options to boost sales • Click to expand</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEmiVisible && (
              <div className="hidden sm:flex items-center gap-4 mr-4">
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Active Plans</p>
                  <p className="text-sm font-bold text-gray-900">{emiStats.activeEmiPlans}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Collection</p>
                  <p className="text-sm font-bold text-gray-900">₹{(emiStats.monthlyEmiCollection / 1000).toFixed(1)}K</p>
                </div>
              </div>
            )}
            {isEmiVisible ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>

        {isEmiVisible && (
          <div className="px-4 pb-6 sm:px-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Left: EMI Info */}
              <div className="flex-1 w-full">
                <p className="text-gray-600 text-sm sm:text-base mb-4">Offer flexible payment options to boost sales</p>

                {/* EMI Stats Grid */}
                {!emiLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs text-gray-600 font-medium">Total Plans</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{emiStats.totalEmiInvoices}</p>
                      <p className="text-xs text-gray-500 mt-1">All EMI invoices created</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-gray-600 font-medium">Total Value</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">₹{(emiStats.totalEmiAmount / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-gray-500 mt-1">Sum of all EMI invoice totals</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-gray-600 font-medium">Active Plans</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{emiStats.activeEmiPlans}</p>
                      <p className="text-xs text-gray-500 mt-1">Plans with outstanding balance</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-gray-600 font-medium">Monthly Collection</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">₹{(emiStats.monthlyEmiCollection / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-gray-500 mt-1">Expected monthly EMI collection</p>
                    </div>
                  </div>
                ) : (
                  <Loader variant="inline-compact" message="Loading EMI stats..." className="mt-4 text-gray-600" />
                )}
              </div>
            </div>

            {/* Features List */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold text-sm">Flexible Tenure</p>
                    <p className="text-gray-600 text-xs">3, 6, 9, or 12 months</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold text-sm">Custom Interest</p>
                    <p className="text-gray-600 text-xs">Set your own rates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        {summaryData.map((data, index) => (
          <SummaryCard
            key={`dashboard-summary-${index}`}
            title={data.title}
            value={data.value}
            icon={data.icon}
            color={data.color}
            timeframe={data.timeframe}
            onClick={() => handleTimeframeChange(data.timeframe)} // ✅ Now enabled for switching
          />
        ))}
      </div>

      {/* Charts and Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-6">
        <div className="lg:col-span-7 min-h-[300px]">
          <ChartCard
            title={`${isDateFilterActive ? (selectedDate ? 'Hourly' : 'Daily') : timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} ${viewMode === 'revenue' ? 'Revenue' : 'Profit'}`}
            data={dashboardData.chart}
          />
        </div>
        <div className="lg:col-span-5">
          <TopItemsTable items={dashboardData.topItems} />
        </div>
      </div>

      {/* Recent Invoices */}
      <RecentInvoicesTable invoices={dashboardData.recentInvoices} />
    </div>
  );
}