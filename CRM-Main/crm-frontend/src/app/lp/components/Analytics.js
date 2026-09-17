'use client';

import { 
  BarChart3,
  TrendingUp,
  PieChart,
  Eye,
  DollarSign,
  Users,
  Package,
  FileText,
  CheckCircle,
  Calendar,
  ArrowUpRight,
  Smartphone,
  TrendingDown,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart as ReBarChart, 
  Bar, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

import { useState, useEffect } from 'react';

export default function Analytics() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  // Sample data for charts
  const revenueData = [
    { day: 'Mon', revenue: 38500, profit: 12500 },
    { day: 'Tue', revenue: 42850, profit: 15600 },
    { day: 'Wed', revenue: 51200, profit: 18500 },
    { day: 'Thu', revenue: 39500, profit: 14200 },
    { day: 'Fri', revenue: 61800, profit: 22500 },
    { day: 'Sat', revenue: 57200, profit: 19800 },
    { day: 'Sun', revenue: 46800, profit: 16500 },
  ];

  const categoryData = [
    { name: 'Electronics', value: 35, color: '#5655eb' },
    { name: 'Fashion', value: 25, color: '#8482f5' },
    { name: 'Home', value: 20, color: '#22c55e' },
    { name: 'Books', value: 15, color: '#f59e0b' },
    { name: 'Other', value: 5, color: '#ef4444' },
  ];

  const performanceData = [
    { metric: 'Website', score: 85 },
    { metric: 'Mobile', score: 92 },
    { metric: 'Social', score: 78 },
    { metric: 'Email', score: 88 },
    { metric: 'Direct', score: 70 },
  ];

  const monthlyData = [
    { month: 'Jan', sales: 42, revenue: 125 },
    { month: 'Feb', sales: 38, revenue: 112 },
    { month: 'Mar', sales: 45, revenue: 138 },
    { month: 'Apr', sales: 52, revenue: 158 },
    { month: 'May', sales: 61, revenue: 185 },
    { month: 'Jun', sales: 68, revenue: 210 },
  ];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#e0f2fe] to-[#dbeafe] text-[#5655eb] text-sm rounded-full mb-4 shadow-sm">
            <Eye className="w-4 h-4" />
            Business Intelligence Dashboard
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] mb-4">
            Transform Data Into  Actionable Insights
          </h2>
          <p className="text-lg text-gray-600">
            Real-time analytics to drive your business decisions
          </p>
        </div>

        {/* Main Content */}
        <div className="grid  gap-6">
          
   

          {/* Right Side - Dashboard */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Revenue Dashboard */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg">
              
              {/* Dashboard Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5655eb] to-[#4338ca] flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-[#0f172a]">Revenue Dashboard</h3>
                    <p className="text-sm text-gray-600">Last 7 days performance</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#5655eb] bg-[#e0f2fe] rounded-lg hover:bg-[#dbeafe] transition">
                    <Calendar className="w-4 h-4" />
                    Weekly
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Main Chart */}
              <div className="mb-8">
                <div className="h-72">
                  {isClient ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis 
                          dataKey="day" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6b7280' }}
                          tickFormatter={(value) => `₹${value/1000}K`}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#5655eb"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Revenue"
                        />
                        <Line
                          type="monotone"
                          dataKey="profit"
                          stroke="#22c55e"
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Profit"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center rounded-xl animate-pulse">
                      <p className="text-gray-400 text-sm">Loading Chart...</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                    <div className="text-sm text-gray-600 mb-1">Weekly Total</div>
                    <div className="font-bold text-2xl text-[#0f172a]">₹2.8L</div>
                    <div className="text-xs text-[#22c55e] font-medium mt-1">
                      <ArrowUpRight className="w-3 h-3 inline mr-1" />
                      +12.4%
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                    <div className="text-sm text-gray-600 mb-1">Avg Daily</div>
                    <div className="font-bold text-2xl text-[#0f172a]">₹40K</div>
                    <div className="text-xs text-[#22c55e] font-medium mt-1">
                      <ArrowUpRight className="w-3 h-3 inline mr-1" />
                      +8.2%
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                    <div className="text-sm text-gray-600 mb-1">Growth Rate</div>
                    <div className="font-bold text-2xl text-[#0f172a]">28%</div>
                    <div className="text-xs text-[#22c55e] font-medium mt-1">
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      All time high
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Radar Chart */}
            
            </div>

            {/* Bottom Row */}
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Monthly Sales Chart */}
             

              {/* Recent Activity */}
            
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#dcfce7] to-[#d1fae5] text-[#22c55e] font-medium rounded-full mb-6 shadow-sm">
            <CheckCircle className="w-5 h-5" />
            Free 14-day trial • No credit card required
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/get-started">
              <button className="px-8 py-4 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 shadow-md">
                Start Free Trial
              </button>
            </Link>
            <Link href="/auth/login">
              <button className="px-8 py-4 bg-white text-[#5655eb] font-semibold rounded-xl border-2 border-[#5655eb] hover:bg-[#5655eb] hover:text-white transition-all duration-300 shadow-sm">
                Login
              </button>
            </Link>
          </div>
          
          <p className="mt-6 text-sm text-gray-500">
            Join 2,500+ businesses already using our analytics platform
          </p>
        </div>
      </div>
    </section>
  );
}