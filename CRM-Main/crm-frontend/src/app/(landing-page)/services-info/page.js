"use client";

import ServiceInfo from "@/app/lp/components/ServiceInfo";
import Footer from "@/components/layout/Footer";

export default function ServicesInfoPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="pt-10">
        <ServiceInfo />
      </div>
      <Footer />
    </main>
  );
}
