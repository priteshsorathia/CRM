import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  const footerLinks = {
    Product: ['Features', 'Modules', 'Pricing', 'API'],
    Modules: ['POS & Billing', 'Inventory', 'HRMS', 'Analytics'],
    Company: ['About Us', 'Careers', 'Blog', 'Contact'],
    Support: ['Help Center', 'Documentation', 'Community', 'Status']
  };

  return (
    <footer className="bg-[#0f172a] text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/shop-logo.png"
                alt="CRM Logo"
                width={140}
                height={42}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 text-gray-400 text-sm">
              The all-in-one operating system for growing businesses
            </p>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-lg mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a 
                      href="#" 
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} CRM. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/auth/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/auth/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/auth/support" className="text-gray-400 hover:text-white text-sm transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
