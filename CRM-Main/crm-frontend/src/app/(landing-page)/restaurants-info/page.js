"use client";

import RestaurantsInfo from "@/app/lp/components/resturantsInfo";
import Footer from "@/components/layout/Footer";

export default function RestaurantsInfoPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="pt-10">
        <RestaurantsInfo />
      </div>
      <Footer />
    </main>
  );
}
