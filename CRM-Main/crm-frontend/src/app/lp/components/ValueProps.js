import {
  Zap,
  Package,
  Users,
  TrendingUp,
  Shield,
  CheckCircle,
  FileText,
  BarChart3,
  Clock,
  Smartphone,
  Cloud,
  DollarSign,
  Timer,
  TrendingUp as Growth,
  ArrowRight,
  ShieldCheck,
  ShoppingCart
} from 'lucide-react';
import Link from 'next/link';

export default function ValueProps() {
  const features = [
    // Services (2 Cards)
    {
      icon: Users,
      title: 'Elevated Client CRM',
      description: 'Scale your service business with unified client profiles, lead conversion tools, and deep interaction tracking.',
      stats: 'Capture Leads'
    },
    {
      icon: Shield,
      title: 'Autonomous HRMS',
      description: 'Empower your workforce with high-precision attendance, payroll automation, and seamless compliance.',
      stats: 'Zero Error'
    },
    // Retailers (2 Cards)
    {
      icon: Package,
      title: 'Total Stock Control',
      description: 'Achieve perfect inventory balance with multi-location sync, batch tracking, and predictive stock insights.',
      stats: 'Live Sync'
    },
    {
      icon: ShoppingCart,
      title: 'High-Velocity POS',
      description: 'Accelerate retail growth with a lightning-fast GST system that captures every sale with precision.',
      stats: 'Fast Sales'
    },
    // Restaurants (2 Cards)
    {
      icon: Zap,
      title: 'Kitchen Intelligence',
      description: 'Command your kitchen with instant KOT routing, order progress tracking, and unified POS operations.',
      stats: 'Faster Prep'
    },
    {
      icon: TrendingUp,
      title: 'Operational Analytics',
      description: 'Optimize dining transitions and occupancy rates with powerful, real-time insights for your restaurant.',
      stats: 'Peak Growth'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5f6dff]/10 text-[#5f6dff] text-sm font-semibold mb-6">
            <ShieldCheck className="w-4 h-4" />
            Engineered for Modern Growing Businesses
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            One Powerful Platform,
            <span className="block text-[#5f6dff] mt-2">Infinite Possibilities</span>
          </h2>
          <p className="text-xl text-[#5b6676]">
            Empower your operations with the most advanced management suite 
            specifically engineered for scale and efficiency.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 border-2 border-gray-100 hover:border-[#5f6dff]/40 hover:shadow-[0_20px_50px_rgba(95,109,255,0.1)] transition-all duration-300 hover:-translate-y-2 relative overflow-hidden fade-in-up shadow-sm"
                style={{ animationDelay: `${index * 0.1}s` }}
              >

                {/* Header: Icon + Title in one row */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#5f6dff] to-[#4338ca] flex items-center justify-center flex-shrink-0 group-hover:shadow-lg group-hover:shadow-[#5f6dff]/30 transition-all duration-300">
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-[19px] font-bold text-[#1a1c21] relative leading-tight">
                    {feature.title}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#5f6dff] to-[#4338ca] group-hover:w-full transition-all duration-500"></span>
                  </h3>
                </div>

                <p className="text-[#5b6676] text-sm mb-5 leading-relaxed">
                  {feature.description}
                </p>

                {/* Stats with checkmark */}
                <div className="flex items-center gap-2.5 pt-2 border-t border-gray-50">
                  <div className="w-7 h-7 rounded-lg bg-[#dcfce7] flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <CheckCircle className="w-3.5 h-3.5 text-[#22c55e]" />
                  </div>
                  <span className="text-sm font-bold text-[#5f6dff]">{feature.stats}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats Banner */}
        <div className="bg-gradient-to-r from-[#5655eb] to-[#4338ca] rounded-2xl p-8 md:p-12 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10,000+', label: 'Active Businesses', icon: FileText },
              { value: '₹500Cr+', label: 'Monthly Revenue Tracked', icon: BarChart3 },
              { value: '99.9%', label: 'System Uptime', icon: Cloud },
              { value: '24/7', label: 'Support Available', icon: Clock }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center text-white group">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                  <div className="text-white/90">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Separator */}
        <div className="relative h-[1px] bg-gradient-to-r from-transparent via-[#5655eb]/20 to-transparent mb-16">
          <div className="absolute left-1/4 top-0 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#5655eb] to-transparent"></div>
        </div>

        {/* Benefits Section */}
        <div className="max-w-5xl mx-auto mb-20">
          <h3 className="text-3xl font-bold text-center text-[#0f172a] mb-12">
            How CRM helps you grow
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Save Money',
                description: 'Reduce operational costs by 40% with automated workflows',
                icon: DollarSign,
                color: 'bg-[#e0f2fe]',
                iconColor: 'text-[#5655eb]'
              },
              {
                title: 'Save Time',
                description: 'Cut administrative work by 70% with smart automation',
                icon: Timer,
                color: 'bg-[#dcfce7]',
                iconColor: 'text-[#22c55e]'
              },
              {
                title: 'Grow Faster',
                description: 'Make data-driven decisions with real-time business insights',
                icon: Growth,
                color: 'bg-[#f3e8ff]',
                iconColor: 'text-[#8482f5]'
              }
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="text-center group">
                  <div className={`w-20 h-20 rounded-full ${benefit.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-10 h-10 ${benefit.iconColor}`} />
                  </div>
                  <h4 className="text-xl font-semibold text-[#0f172a] mb-3">{benefit.title}</h4>
                  <p className="text-[#64748b]">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simple CTA */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#dcfce7] text-[#22c55e] text-sm font-medium mb-6">
            <CheckCircle className="w-4 h-4" />
            No credit card required • Free 14-day trial
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={"/auth/get-started"}>
              <button className="group px-8 py-4 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#5655eb]/30 hover:-translate-y-1 transition-all duration-300 text-lg">
                <span className="flex items-center justify-center gap-2">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
            <Link href={"/auth/login"}>

              <button className="px-8 py-4 bg-white text-[#5655eb] font-semibold rounded-xl border-2 border-gray-300 hover:border-[#5655eb] hover:bg-[#f3f5f7] transition-all duration-200 text-lg">
                Login
              </button>
            </Link>
          </div>

          <p className="text-gray-600 text-sm mt-6">
            Join 10,000+ businesses using CRM
          </p>
        </div>
      </div>
    </section>
  );
}
