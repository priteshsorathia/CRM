"use client";

import RetailersInfo from "@/app/lp/components/retailersInfo";
import Footer from "@/components/layout/Footer";

export default function RetailersInfoPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="pt-10">
        <RetailersInfo />
      </div>
      <Footer />
    </main>
  );
}
