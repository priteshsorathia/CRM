import LandingPageClient from "@/components/LpClient";
import Home from "./lp/page";

export const metadata = {
  title: "CRM - All-in-One Business Management & POS Software",
  description:
    "Manage HRMS, Invoices, Inventory, Sales Analytics, and Customer Management with CRM. The ultimate POS solution for modern shops and enterprises.",
  keywords: [
    "HRMS Module",
    "Invoice Management",
    "Inventory Management",
    "Total Sales Analytics",
    "Bill Management",
    "Purchase Bill Management",
    "Customer Management",
    "Sales Management",
    "POS Software",
    "CRM",
  ],
  openGraph: {
    title: "CRM - Empower Your Business with Smart POS",
    description:
      "Manage your entire business from one powerful platform. HRMS, Inventory, Sales, and more.",
    url: "http://localhost:3000",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CRM Business Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CRM - Empower Your Business with Smart POS",
    description:
      "Manage your entire business from one powerful platform. HRMS, Inventory, Sales, and more.",
    images: ["/og-image.png"],
  },
};

export default function LandingPage() {
  // return <LandingPageClient />;
  return <Home />;
}
