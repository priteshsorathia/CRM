"use client";

import {
  ShoppingCart,
  Users,
  Package,
  CreditCard,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function Modules() {
  const modules = [
    {
      name: 'POS & Billing',
      description: 'Complete billing solution',
      icon: ShoppingCart,
      features: ['GST Invoices', 'Multiple Payments', 'Quick Billing', 'Print Receipts'],
      color: 'from-[#5655eb] to-[#4338ca]'
    },
    {
      name: 'Client Management',
      description: 'Manage customer relationships',
      icon: Users,
      features: ['Client Database', 'Payment History', 'Credit Limits', 'Sales Reports'],
      color: 'from-[#4338ca] to-[#5655eb]'
    },
    {
      name: 'Inventory',
      description: 'Real-time stock tracking',
      icon: Package,
      features: ['Stock Alerts', 'Batch Tracking', 'Supplier Info', 'Stock Reports'],
      color: 'from-[#5655eb] to-[#4338ca]'
    },
    {
      name: 'HR & Payroll',
      description: 'Employee management system',
      icon: CreditCard,
      features: ['Attendance', 'Salary Processing', 'Leave Management', 'Compliance'],
      color: 'from-[#4338ca] to-[#5655eb]'
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Header - Reduced margin-bottom */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5655eb]/10 rounded-full text-[#5655eb] text-sm font-medium mb-6">
            <CheckCircle className="w-4 h-4" />
            <span>Complete Business Solution</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Run Your Business
          </h2>
          
          <p className="text-xl text-gray-600">
            All essential tools in one integrated platform
          </p>
        </div>

        {/* MODULE CARDS - Tightened spacing */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {modules.map((module, index) => (
            <div 
              key={index}
              className="group relative"
            >
              {/* Main Card - Reduced padding */}
              <div className="relative bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 z-10">
                
                {/* Top Gradient Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${module.color} rounded-t-2xl`}></div>
                
                {/* Icon with Floating Effect - Reduced margin */}
                <div className="relative mb-6">
                  <div className={`absolute -inset-2 bg-gradient-to-br ${module.color} opacity-5 rounded-lg`}></div>
                  <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg`}>
                    <module.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                
                {/* Content - Reduced spacing */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{module.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{module.description}</p>
                  
                  {/* Features with Checkmarks - Tighter spacing */}
                  <ul className="space-y-2 mb-6">
                    {module.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#5655eb]/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-2.5 h-2.5 text-[#5655eb]" />
                        </div>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Hover Button - Shows on hover */}
                <div className="absolute bottom-6 left-6 right-6 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  <Link href={"/auth/get-started"}>
                    <button className="w-full py-2.5 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white font-medium rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center gap-2 text-sm">
                      <span>Learn More</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </Link>
                </div>
              </div>
              
              {/* Background Glow Effect on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-r ${module.color} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity duration-500 -z-10`}></div>
            </div>
          ))}
        </div>

        {/* Integration Banner - Reduced padding and margin */}
        <div className="bg-gradient-to-r from-[#5655eb] to-[#4338ca] rounded-2xl p-8 md:p-10 text-white mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                Everything Works Together
              </h3>
              <p className="text-blue-100 mb-4 text-sm">
                All modules share data automatically. Update inventory once, and it reflects everywhere.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Data syncs automatically</span>
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="relative w-56 h-56">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full border-2 border-white/20"></div>
                </div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                
                {modules.map((module, idx) => (
                  <div 
                    key={idx}
                    className={`absolute ${idx === 0 ? 'top-0 left-1/2 -translate-x-1/2' : idx === 1 ? 'right-0 top-1/2 -translate-y-1/2' : idx === 2 ? 'bottom-0 left-1/2 -translate-x-1/2' : 'left-0 top-1/2 -translate-y-1/2'} w-9 h-9 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg`}
                  >
                    <module.icon className="w-4 h-4 text-white" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section - Reduced spacing */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#5655eb]/10 rounded-full text-[#5655eb] text-sm font-medium mb-4">
            <CheckCircle className="w-4 h-4" />
            <span>All features included � 14-day free trial</span>
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h3>
          
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-sm">
            Join thousands of businesses already using our platform
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Link href={"/auth/get-started"}>
              <button className="px-6 py-3 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white font-semibold rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 text-sm">
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href={"/auth/login"}>
              <button className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:border-[#5655eb] hover:text-[#5655eb] transition-all duration-200 flex items-center justify-center gap-2 text-sm">
                <span>Login</span>
              </button>
            </Link>
          </div>
          
          <p className="text-gray-500 text-xs">
            No credit card required � Cancel anytime � Full access to all modules
          </p>
        </div>

      </div>
    </section>
  );
}