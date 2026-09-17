import { 
  Shield,
  Lock,
  FileText,
  Database,
  CheckCircle,
  Users,
  Server,
  Globe,
  ArrowRight,
  ShieldCheck,
  Eye,
  Key
} from 'lucide-react';
import Link from 'next/link';

export default function Security() {
  const securityFeatures = [
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      description: '256-bit encryption & enterprise protection',
      stats: 'ISO 27001 Certified'
    },
    {
      icon: Lock,
      title: 'Secure Payments',
      description: 'PCI-DSS compliant payment processing',
      stats: 'PCI-DSS Level 1'
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Control permissions for each team member',
      stats: 'Granular Controls'
    },
    {
      icon: Database,
      title: 'Data Protection',
      description: 'Your business data never leaves India',
      stats: 'GDPR Compliant'
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-[#f8fafc]">
      <div className="container mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#5655eb] to-[#4338ca] mb-4 mx-auto">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-[#0f172a] mb-3">
            Enterprise Security
            <span className="block text-[#5655eb]">You Can Trust</span>
          </h2>
          <p className="text-base text-gray-600">
            Built with security-first architecture for Indian businesses
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 max-w-6xl mx-auto">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="group bg-white rounded-xl border border-gray-200 hover:border-[#5655eb]/30 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                {/* Icon Section */}
                <div className="p-5 border-b border-gray-100">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#5655eb] to-[#4338ca] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-center text-[#0f172a] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 text-center">
                    {feature.description}
                  </p>
                </div>
                
                {/* Stats Section */}
                <div className="p-4 bg-[#f8fafc] rounded-b-xl">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                    <span className="text-sm font-medium text-[#5655eb]">{feature.stats}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security Badges */}
        <div className="mb-10">
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-[#e0f2fe] flex items-center justify-center">
                <Server className="w-4 h-4 text-[#5655eb]" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Uptime</div>
                <div className="font-semibold text-[#0f172a]">99.9%</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-[#dcfce7] flex items-center justify-center">
                <Eye className="w-4 h-4 text-[#22c55e]" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Monitoring</div>
                <div className="font-semibold text-[#0f172a]">24/7</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-[#f3e8ff] flex items-center justify-center">
                <Key className="w-4 h-4 text-[#8482f5]" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Encryption</div>
                <div className="font-semibold text-[#0f172a]">AES-256</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-[#fef3c7] flex items-center justify-center">
                <Globe className="w-4 h-4 text-[#f59e0b]" />
              </div>
              <div>
                <div className="text-xs text-gray-500">Compliance</div>
                <div className="font-semibold text-[#0f172a]">GDPR</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#5655eb] via-[#8482f5] to-[#5655eb] p-6 md:p-8">
          {/* Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '30px 30px'
            }}></div>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-lg">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-white" />
                <h3 className="text-xl md:text-2xl font-bold text-white">Trusted by Indian Businesses</h3>
              </div>
              <p className="text-white/90 text-sm md:text-base">
                Join 10,000+ growing businesses who trust CRM with their sensitive business data
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={"/auth/get-started"}>
                <button className="group px-6 py-3 bg-white text-[#5655eb] font-medium rounded-lg hover:bg-gray-50 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href={"/auth/login"}>
                <button className="px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition-all duration-200">
                  Login
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Trust Note */}
        <div className="mt-8 text-center">
          <div className="inline-flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-[#22c55e]" />
              Data stored in India
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-[#22c55e]" />
              Regular security audits
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-[#22c55e]" />
              SOC 2 Type II compliant
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}