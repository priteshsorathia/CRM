"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Package,
  ReceiptText,
  Store,
} from "lucide-react";

import { retailerModules } from "@/data/retailerModules";

export default function RetailersCard() {
  return (
    <section className="bg-[#fbfcfd] py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-10">
        <div className="mx-auto mb-16 max-w-4xl text-center">
          {/* <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-[#ecfbf5] px-5 py-2 text-sm font-semibold text-[#11b981]">
            <Store className="h-4 w-4" />
            <span>Retail Excellence Module</span>
          </div> */}

            <h2 className="text-3xl font-semibold text-[#1a1c21] sm:text-3xl md:text-4xl lg:text-[54px] lg:leading-[1.15] mb-6">
              Advanced Platform for{" "}
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-[#5f6dff] to-[#8c97ff] bg-clip-text text-transparent">
                Modern Retailers
              </span>
            </h2>

          <p className="mx-auto mt-8 max-w-[720px] text-lg leading-[1.7] text-[#5b6676] md:text-[20px]">
            Scale your retail business with purpose-built tools for inventory, credit
            management, and insightful analytics. Everything you need to grow in one
            place.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {retailerModules.map((module) => {
            const Icon = module.icon;

            return (
              <article
                key={module.title}
                className="group relative overflow-hidden rounded-[26px] border border-[#edf0f5] bg-white px-8 pb-8 pt-7 shadow-[0_8px_26px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(16,185,129,0.10)]"
              >
                {/* Horizontal Icon Bar as per SS */}
                <div className="mb-6 flex items-center rounded-2xl bg-[#f5fbf9] p-2.5">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br ${module.iconClassName} shadow-[0_8px_16px_rgba(16,185,129,0.12)]`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>

                <h3 className="px-1 text-xl font-bold text-[#2a2f37]">
                  {module.title}
                </h3>

                <ul className="mt-6 space-y-4">
                  {module.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-[#a9b3bf]">
                      <CheckCircle2
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: "#10b981" }}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Absolute Overlay Button */}
                <div className="absolute inset-x-0 bottom-0 flex h-20 items-end bg-gradient-to-t from-white via-white/95 to-transparent p-8 opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <Link
                    href={`/retailers/${module.slug}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10b981] py-2.5 text-[15px] font-bold text-white shadow-[0_10px_25px_rgba(16,185,129,0.25)] transition-all duration-300 translate-y-4 group-hover:translate-y-0 hover:bg-[#0da06f]"
                  >
                    <span>Explore Module</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {/* More Info Link */}
        <div className="mt-12 flex justify-end">
          <Link
            href="/retailers-info"
            className="group flex items-center gap-2 text-[17px] font-bold text-[#10b981] transition-all hover:gap-3"
          >
            <span>Explore All Feature Details</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
