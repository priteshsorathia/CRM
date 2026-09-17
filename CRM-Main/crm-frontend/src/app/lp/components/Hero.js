import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* LEFT SIDE */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5655eb]/10 text-[#5655eb] text-sm font-medium mb-6">
              <span className="h-2 w-2 rounded-full bg-[#5655eb] animate-pulse"></span>
              All-in-One Business Platform
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Streamline Your
              <span className="block text-[#5655eb] mt-2">
                Business Operations
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-10">
              POS, billing, inventory, HRMS, and analytics—unified in one powerful platform designed for growing businesses.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/auth/get-started">
                <button className="px-8 py-4 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  Start Free Trial
                </button>
              </Link>
              <Link href="/auth/login">
                <button className="px-8 py-4 bg-white text-[#5655eb] font-semibold rounded-lg border-2 border-[#5655eb] hover:bg-[#5655eb] hover:text-white transition-all duration-200">
                  Login
                </button>
              </Link>
            </div>

            <div className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-4">
                Trusted by 5,000+ businesses
              </p>
              <div className="flex flex-wrap gap-6">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 bg-green-500 rounded-full"></span>
                  GST Compliant
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 bg-green-500 rounded-full"></span>
                  Bank-Grade Security
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 bg-green-500 rounded-full"></span>
                  24/7 Support
                </span>
              </div>
            </div>
          </div>

          
          <div className="relative flex justify-center lg:justify-end">
            <Image
              src="/lp/1.png"
              alt="CRM POS Dashboard"
              width={900}
              height={700}
              className="w-full max-w-2xl rounded-xl shadow-2xl"
              priority
            />
          </div>

        </div>
      </div>
    </section>
  );
}
