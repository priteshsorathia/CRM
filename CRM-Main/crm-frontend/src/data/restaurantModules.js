import {
  LayoutGrid,
  Flame,
  ClipboardList,
  UtensilsCrossed,
  ChefHat,
  Table,
  Receipt,
  BarChart3,
} from "lucide-react";

export const restaurantModules = [
  {
    slug: "table-management",
    title: "Table Management",
    shortDescription: "Take control of your dining floor with real-time visibility. Monitor table occupancy, manage advanced reservations, and track capacity to optimize guest seating.",
    icon: LayoutGrid,
    iconClassName: "from-[#8b5cf6] to-[#7c3aed]", // Purple
    accent: "#2563eb",
    eyebrow: "Restaurant Management Module",
    heroTitle: "Smart Floor Management for Modern Dining",
    heroDescription: "Optimize your restaurant's seating capacity with real-time tracking, digital floor plans, and a seamless reservation system that keeps your waitlist moving.",
    features: ["Live Status", "Reservation System", "Capacity Tracking"],
    detailSections: [
      {
        title: "Complete control of your floor",
        items: [
          "Interactive digital floor plan to visualize your restaurant's current seating state.",
          "Real-time status updates (Occupied, Reserved, Available, or Billing).",
          "Advanced reservation engine integrated with guest reminders and contact info.",
          "Capacity tracking to help managers understand peak hours and staffing needs.",
        ],
      },
      {
        title: "Why it's important for your business",
        items: [
          "Reduce guest wait times by identifying soon-to-be-available tables faster.",
          "Maximize revenue by ensuring high-capacity tables are prioritized for larger groups.",
          "Improve guest satisfaction with a smoother booking and arrival experience.",
          "Minimize manual seating errors that lead to service delays or lost revenue.",
        ],
      },
    ],
    workflow: [
      "Set up your digital floor map with custom table layouts and zones.",
      "Accept reservations online or via call and assign them to specific tables.",
      "Track live occupancy as guests arrive and seat themselves via host dashboard.",
      "Monitor billing status to prepare for the next guest arrival instantly.",
    ],
  },
  {
    slug: "kitchen-kot",
    title: "Kitchen KOT",
    shortDescription: "Bridge the gap between servers and chefs with digital KOTs. Accelerate food preparation, ensure order precision, and prioritize tickets for peak efficiency.",
    icon: Flame,
    iconClassName: "from-[#f97316] to-[#ea580c]", // Orange
    accent: "#2563eb",
    eyebrow: "Restaurant Management Module",
    heroTitle: "Accelerate Your Kitchen with Digital KOTs",
    heroDescription: "Eliminate paper chaos and miscommunication. Our digital Kitchen Order Ticket system ensures that every order is timed, prioritized, and perfectly executed.",
    features: ["Live Order Sync", "Chef Dashboard", "Priority Marking"],
    detailSections: [
      {
        title: "Precision in every preparation",
        items: [
          "Real-time ticket arrival on a centralized kitchen display or thermal printer.",
          "Category-wise filtering to separate bar, kitchen, and pastry orders.",
          "Visual timers for every order to track 'Time to Table' metrics.",
          "Priority marking for delayed orders or special guest requests.",
        ],
      },
      {
        title: "Impact on kitchen performance",
        items: [
          "Zero order loss compared to manual paper systems.",
          "Reduced kitchen-to-server conflict with clear status updates.",
          "Faster preparation times through automated ticket routing.",
          "Precise stock tracking as items are fired in the kitchen.",
        ],
      },
    ],
    workflow: [
      "Server takes order on mobile/POS and sends it instantly to the kitchen.",
      "Kitchen Dashboard displays active tickets with priority and timers.",
      "Chef updates status to 'Preparing' then 'Ready' as the food is cooked.",
      "Wait-staff is notified immediately for pickup and delivery to the table.",
    ],
  },
  {
    slug: "running-orders",
    title: "Running Orders",
    shortDescription: "Manage all dine-in, takeaway, and delivery orders in one unified view. Track the live lifecycle of every order from entry to delivery without missing a beat.",
    icon: ClipboardList,
    iconClassName: "from-[#3b82f6] to-[#2563eb]", // Blue
    accent: "#2563eb",
    eyebrow: "Restaurant Management Module",
    heroTitle: "Unified Command for All Active Orders",
    heroDescription: "Whether it's a guest at Table 5 or a Zomato delivery, keep track of every active order in your restaurant from one simplified, real-time command center.",
    features: ["Status Updates", "Platform Split", "Quick Actions"],
    detailSections: [
      {
        title: "All channels, one view",
        items: [
          "Centralized dashboard for Dine-In, Takeaway, Zomato, and Swiggy orders.",
          "Automatic status syncing across platforms to avoid manual entry.",
          "Filter by 'Preparing', 'Ready for Pickup', or 'Out for Delivery'.",
          "Quick modification of items or quantities directly from the running view.",
        ],
      },
      {
        title: "Scale your delivery business",
        items: [
          "Handle high volumes during peak hours without missing delivery windows.",
          "Identify platform performance to see which channel brings the most revenue.",
          "Reduce staff stress with a clear 'what's next' list of tasks.",
          "Ensure no delivery rider is kept waiting with 'Ready' notifications.",
        ],
      },
    ],
    workflow: [
      "Capture orders from all sources automatically into the Running Orders list.",
      "Monitor the prep status synced directly from the kitchen module.",
      "Use platform-specific filters to manage delivery riders and pickups.",
      "Complete the cycle by marking 'Delivered' or 'Paid' in the system.",
    ],
  },
  {
    slug: "billing-reports",
    title: "Billing & Reports",
    shortDescription: "Empower your front desk with rapid GST-compliant billing and revenue tracking. Access deep analytics on daily sales and overall business performance.",
    icon: UtensilsCrossed,
    iconClassName: "from-[#10b981] to-[#059669]", // Green
    accent: "#2563eb",
    eyebrow: "Restaurant Management Module",
    heroTitle: "Fast Billing & Intelligence for Growth",
    heroDescription: "Close checks in seconds and gain insights in minutes. Professional GST-ready invoicing with a powerful analytics engine that tracks your best-sellers.",
    features: ["Fast Checkout", "Daily Revenue", "Top-selling Items"],
    detailSections: [
      {
        title: "Efficient billing workflows",
        items: [
          "GST-compliant invoicing with automated tax and discount calculation.",
          "Multi-payment support including Cards, UPI, Cash, and Split-billing.",
          "Digital receipts sent via WhatsApp or Email to save paper.",
          "One-click reconciliation for platform orders (Zomato/Swiggy).",
        ],
      },
      {
        title: "Data that drives decisions",
        items: [
          "Live Revenue Dashboard showing daily, weekly, and monthly growth.",
          "Top-Selling Items report to help you optimize your menu pricing.",
          "Server Performance reports to track efficiency and tip management.",
          "Inventory consumption reports synced with your billings.",
        ],
      },
    ],
    workflow: [
      "Initiate billing from the Running Orders or Table Management view.",
      "Apply discounts, split the bill, and select the payment method.",
      "Generate and share the digital receipt with the customer instantly.",
      "Review automated reports at EOD to reconcile sales and stock.",
    ],
  },
];

export const restaurantModuleMap = Object.fromEntries(
  restaurantModules.map((module) => [module.slug, module])
);
