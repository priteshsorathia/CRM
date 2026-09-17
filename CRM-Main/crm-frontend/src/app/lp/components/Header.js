import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Image
              src="/shop-logo.png"
              alt="CRM Logo"
              width={120}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-700 hover:text-[#5655eb] font-medium transition-colors">
              Features
            </a>
            <a href="#modules" className="text-gray-700 hover:text-[#5655eb] font-medium transition-colors">
              Modules
            </a>
            <a href="#analytics" className="text-gray-700 hover:text-[#5655eb] font-medium transition-colors">
              Analytics
            </a>
            <a href="#security" className="text-gray-700 hover:text-[#5655eb] font-medium transition-colors">
              Security
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-3">
            <Link 
              href="/auth/login" 
              className="px-4 py-2 text-[#5655eb] font-medium border border-[#5655eb] rounded-lg hover:bg-[#5655eb] hover:text-white transition-all duration-200"
            >
              Login
            </Link>
            <Link 
              href="/auth/get-started" 
              className="px-4 py-2 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white font-medium rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
