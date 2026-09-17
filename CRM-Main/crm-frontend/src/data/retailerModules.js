import {
  Package,
  CreditCard,
  ReceiptText,
  BarChart3,
} from "lucide-react";

export const retailerModules = [
  {
    slug: "smart-inventory",
    title: "Smart Inventory",
    shortDescription: "Complete control over your stock with real-time tracking, multi-category management, and low-stock alerts and history.",
    icon: Package,
    iconClassName: "from-[#13b79a] to-[#10b981]",
    accent: "#10b981",
    eyebrow: "Retail Excellence Module",
    heroTitle: "Precision Inventory Management for Growth",
    heroDescription: "Eliminate stock-outs and overstocking. Our intelligent inventory system tracks every SKU across your entire business in real-time.",
    features: ["Barcode Ready", "Category Management", "Stock History"],
    detailSections: [
      {
        title: "Master your supply chain",
        items: [
          "Full barcode integration for lightning-fast stock entry and searching.",
          "Hierarchical category management to organize thousands of products easily.",
          "Automated low-stock alerts sent directly to your management dashboard.",
          "Historical stock movement reports to identify your best (and worst) movers.",
        ],
      },
      {
        title: "How it helps your retail business",
        items: [
          "Maximize warehouse space by keeping only the inventory that sells.",
          "Reduce capital lock-in by optimizing your purchase orders based on data.",
          "Improve customer trust by always having items in stock when they need them.",
          "Detect discrepancies and prevent theft with detailed movement logs.",
        ],
      },
    ],
    workflow: [
      "Import your existing product list or scan new items via barcode.",
      "Assign products to specific categories and set minimum stock levels.",
      "Track every sale and purchase as the system updates totals automatically.",
      "Review automated replenishment reports to restock with confidence.",
    ],
  },
  {
    slug: "emi-payment-plans",
    title: "EMI Payment Plans",
    shortDescription: "Boost big-ticket sales by offering flexible EMI plans with custom tenures, interest rates, and automated collection alerts.",
    icon: CreditCard,
    iconClassName: "from-[#4e7cf6] to-[#5557f0]",
    accent: "#10b981",
    eyebrow: "Retail Excellence Module",
    heroTitle: "Increase Sales with Flexible Credit Plans",
    heroDescription: "Empower your customers to buy more today. Offer custom EMI plans directly at your billing counter without complex bank integrations.",
    features: ["Multiple Tenures", "Custom Interest", "Collection Alerts"],
    detailSections: [
      {
        title: "Financial tools for modern retail",
        items: [
          "Set custom EMI tenures ranging from 3 to 24 months per customer.",
          "Automated interest and late fee calculations built into the bill.",
          "Centralized credit ledger for every customer to track remaining balances.",
          "Direct SMS and notification system for upcoming payment reminders.",
        ],
      },
      {
        title: "Strategic business advantages",
        items: [
          "Attract customers looking for higher-value items through affordability.",
          "Build long-term customer relationships with personalized credit lines.",
          "Recover payments faster with automated digital collection workflows.",
          "Gain visibility into your total credit exposure and repayment health.",
        ],
      },
    ],
    workflow: [
      "Select a customer at checkout and enable the 'Credit/EMI' option.",
      "Choose the tenure, interest rate, and down-payment amount.",
      "System generates a legal repayment schedule for the customer to sign.",
      "Track installments monthly via the unified credit recovery dashboard.",
    ],
  },
  {
    slug: "gst-invoicing",
    title: "GST Invoicing",
    shortDescription: "Create professional, fully compliant GST invoices in seconds with automated tax calculations and digital receipt generation.",
    icon: ReceiptText,
    iconClassName: "from-[#ff9800] to-[#ff6a00]",
    accent: "#10b981",
    eyebrow: "Retail Excellence Module",
    heroTitle: "Compliant & Professional Billing in Seconds",
    heroDescription: "Stop worrying about tax calculations. Generate beautiful, professional GST-ready invoices that keep your business compliant and your customers impressed.",
    features: ["Tax Calculation", "Digital Receipts", "Payment Status"],
    detailSections: [
      {
        title: "Seamless checkout experience",
        items: [
          "Instant GST calculation for CGST, SGST, and IGST based on HSN codes.",
          "Support for both thermal printing and standard A4/A5 invoice formats.",
          "Digital receipt sharing via WhatsApp and Email for a paperless desk.",
          "Track payment status (Paid, Partial, or Unpaid) across all invoices.",
        ],
      },
      {
        title: "Reliability and compliance",
        items: [
          "Always be ready for tax filings with automated EOD sales reports.",
          "Maintain a clean trail of every transaction for audit readiness.",
          "Reduce billing errors with automated item fetching and pricing.",
          "Speed up the queue with one-click billing for frequent customers.",
        ],
      },
    ],
    workflow: [
      "Add items to the cart via barcode scan or quick-search.",
      "The system automatically applies the correct GST rates and discounts.",
      "Finalize the invoice and accept payment via cash, card, or UPI.",
      "Print or share the digital receipt instantly with the customer.",
    ],
  },
  {
    slug: "sales-analytics",
    title: "Sales Analytics",
    shortDescription: "Deep-dive into your growth with real-time revenue dashboards, top performance reports, and hourly sales insights.",
    icon: BarChart3,
    iconClassName: "from-[#25a9f5] to-[#2f80ed]",
    accent: "#10b981",
    eyebrow: "Retail Excellence Module",
    heroTitle: "Data-Driven Intelligence for Your Store",
    heroDescription: "Turn your sales data into actionable strategy. Our analytics engine helps you understand what's selling, when, and why.",
    features: ["Real-time Profit", "Top Performance", "Hourly Insights"],
    detailSections: [
      {
        title: "Visibility across your business",
        items: [
          "Real-time revenue and profit tracking visible from any device.",
          "Visual charts showing sales trends across days, weeks, and months.",
          "Deep dive into which categories and brands are driving your margin.",
          "Hourly traffic insights to help you manage your staff shifts effectively.",
        ],
      },
      {
        title: "Decide with confidence",
        items: [
          "Identify dead-stock and slow-moving items to clear space.",
          "Measure the success of your discount campaigns with ROI metrics.",
          "Evaluate staff performance based on sales volume and order size.",
          "Forecast future demand based on historical seasonal trends.",
        ],
      },
    ],
    workflow: [
      "Access the analytics dashboard from your main manager view.",
      "Filter data by date range, store location, or product category.",
      "Compare current performance against previous periods instantly.",
      "Export PDF or Excel reports for stakeholders and accounting.",
    ],
  },
];

export const retailerModuleMap = Object.fromEntries(
  retailerModules.map((module) => [module.slug, module])
);
