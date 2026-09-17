import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";

import { retailerModuleMap, retailerModules } from "@/data/retailerModules";

export function generateStaticParams() {
  return retailerModules.map((module) => ({ slug: module.slug }));
}

export default async function RetailerModuleDetailPage({ params }) {
  const { slug } = await params;
  const module = retailerModuleMap[slug];

  if (!module) {
    notFound();
  }

  const Icon = module.icon;

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="border-b border-[#edf0f5] bg-[linear-gradient(180deg,#f8faff_0%,#ffffff_100%)]">
        <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:px-10 lg:py-14">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#10b981]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to landing page
          </Link>

          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ecfbf5] px-5 py-2 text-sm font-semibold text-[#11b981]">
                <Icon className="h-4 w-4" />
                <span>{module.eyebrow}</span>
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#20242c] sm:text-3xl md:text-4xl">
                {module.heroTitle}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6f7c8d] md:text-xl">
                {module.heroDescription}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {module.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-[#dbffef] bg-white px-4 py-2 text-sm font-medium text-[#10b981]"
                  >
                    {feature}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/auth/get-started"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10b981] px-6 py-3 text-base font-semibold text-white transition hover:bg-[#0da06f]"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-xl border border-[#d8dfec] px-6 py-3 text-base font-semibold text-[#2a2f37]"
                >
                  Login
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#edf0f5] bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <div
                className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${module.iconClassName} shadow-[0_15px_35px_rgba(16,185,129,0.22)]`}
              >
                <Icon className="h-7 w-7 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-[#20242c]">{module.title}</h2>
              <p className="mt-3 text-base leading-7 text-[#6f7c8d]">
                {module.shortDescription}
              </p>

              <div className="mt-8 space-y-4">
                {module.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 rounded-2xl bg-[#f8faff] px-4 py-4">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[#10b981]" />
                    <span className="font-medium text-[#334155]">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detail Sections */}
      <section className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {module.detailSections.map((section) => (
            <div
              key={section.title}
              className="rounded-[28px] border border-[#edf0f5] bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
            >
              <h3 className="text-2xl font-bold text-[#20242c]">{section.title}</h3>
              <div className="mt-6 space-y-4">
                {section.items.map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-[#10b981]" />
                    <p className="text-base leading-7 text-[#6f7c8d]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Section */}
      <section className="bg-[#f8faff] py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-10">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#10b981]">
              How It Works
            </p>
            <h3 className="mt-3 text-3xl font-semi text-[#20242c] sm:text-4xl">
              A simple retail workflow that saves time
            </h3>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {module.workflow.map((step, index) => (
              <div
                key={step}
                className="rounded-[24px] border border-[#e6ebf5] bg-white p-7 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ecfbf5] text-lg font-bold text-[#10b981]">
                  {index + 1}
                </div>
                <p className="mt-5 text-base leading-7 text-[#516070]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
