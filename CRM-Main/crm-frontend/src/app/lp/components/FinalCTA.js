import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-[#5655eb] to-[#4338ca] relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to transform your business?
          </h2>

          <p className="text-xl text-white/90 mb-10">
            Start your 14-day free trial today. No credit card required.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href={"/auth/get-started"}>
              <button className="px-10 py-4 bg-white text-[#5655eb] font-semibold rounded-lg hover:bg-gray-50 hover:shadow-xl transition-all duration-200 shadow-lg text-lg">
                Start Free Trial
              </button>
            </Link>

            <Link href={"/auth/login"}>
              <button className="px-10 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-200 text-lg">
                Login
              </button>
            </Link>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
            <span>✓ No credit card required</span>
            <span>✓ 14-day free trial</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}
