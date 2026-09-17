import "./globals.css";
import { Toaster } from "sonner";

export const metadata = {
  metadataBase: new URL(process.env.CLIENT_URL || "http://localhost:3000"),
  title: {
    default: "CRM - Business Management & POS",
    template: "%s | CRM",
  },
  icons: {
    icon: "/shop-logo.png?v=2",
    shortcut: "/shop-logo.png?v=2",
    apple: "/shop-logo.png?v=2",
  },
  description:
    "CRM: Comprehensive business management platform featuring HRMS, Invoice & Inventory Management, Sales Analytics, and Customer Management.",
  keywords: [
    "HRMS Module",
    "Invoice Management",
    "Inventory Management",
    "Total Sales Analytics",
    "Bill Management",
    "Customer Management",
    "Sales Management",
    "POS Software India",
    "Business Management System",
  ],
  openGraph: {
    title: "CRM - Empower Your Business with Smart POS",
    description:
      "Manage your entire business from one powerful platform. HRMS, Inventory, Sales, Revenue and more.",
    url: process.env.CLIENT_URL,
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CRM Business Management Platform",
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "CRM - Business Management & POS",
    description:
      "Manage HRMS, Invoices, Inventory, and Sales Analytics with CRM.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body suppressHydrationWarning className="min-h-screen bg-gray-50">
        {children}
        <Toaster position="top-right" visibleToasts={1} expand={false} richColors />
      </body>
    </html>
  );
}
