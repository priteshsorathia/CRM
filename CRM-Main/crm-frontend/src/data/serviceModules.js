import {
  BarChart3,
  BriefcaseBusiness,
  Clock3,
  UsersRound,
} from "lucide-react";

export const serviceModules = [
  {
    slug: "client-crm",
    title: "Client & CRM",
    shortDescription:
      "Centralize client data, track interactions, and manage every relationship from one place.",
    icon: UsersRound,
    iconClassName: "from-[#4f6cf6] to-[#5a56f1]",
    accent: "#5f6dff",
    eyebrow: "Service Excellence Module",
    heroTitle: "Smart CRM for Service-First Success",
    heroDescription:
      "Transform every interaction into a long-term relationship. Keep records, conversations, and projects perfectly synced in one unified client ecosystem.",
    features: [
      "Client Database",
      "Lead Tracking",
      "Interaction Logs",
    ],
    detailSections: [
      {
        title: "Total Client Visibility",
        items: [
          "Comprehensive 360° client profiles with complete interaction timelines.",
          "Custom lead stages tailored to your unique service sales cycle.",
          "Integrated document storage for contracts, proposals, and NDAs.",
          "Automated task reminders for follow-ups and service renewals.",
        ],
      },
      {
        title: "Maximize Client Lifetime Value",
        items: [
          "Convert more leads with data-driven pipeline visualization.",
          "Enhance service quality by having historical context for every meeting.",
          "Prevent churn using automated health score and engagement alerts.",
          "Seamlessly transition from sales to project delivery teams.",
        ],
      },
    ],
    workflow: [
      "Import leads or create contacts directly from initial enquiries.",
      "Track every touchpoint via notes, meetings, and shared files.",
      "Move deals through custom stages with clear ownership.",
      "Access a unified dashboard for renewals and high-value opportunities.",
    ],
  },
  {
    slug: "project-tracking",
    title: "Project Tracking",
    shortDescription:
      "Real-time visibility into project milestones, tasks, and team progress across engagements.",
    icon: BriefcaseBusiness,
    iconClassName: "from-[#6a5cf6] to-[#8c3ff0]",
    accent: "#7a56f5",
    eyebrow: "Service Excellence Module",
    heroTitle: "Deliver Better with Real-Time Tracking",
    heroDescription:
      "Bridge the gap between vision and delivery. Monitor team assignments, dead-lines, and progress without losing sight of the finer details.",
    features: [
      "Task Management",
      "Milestone Tracking",
      "Team Progress",
    ],
    detailSections: [
      {
        title: "Operational Control",
        items: [
          "Dynamic Kanban and list views for flexible task management.",
          "Real-time milestone tracking with automated risk indicators.",
          "Team workload visualization to prevent burnout and bottlenecks.",
          "Internal collaboration hub for task-specific discussions and files.",
        ],
      },
      {
        title: "Excellence in Delivery",
        items: [
          "Ensure on-time project completion with critical path analysis.",
          "Standardize service quality using reusable project templates.",
          "Improve team accountability with clear task ownership history.",
          "Share real-time professional progress reports with your clients.",
        ],
      },
    ],
    workflow: [
      "Initialize project from a client contract with predefined templates.",
      "Break down work into manageable milestones and assigned tasks.",
      "Monitor team capacity and update progress in real-time.",
      "Generate delivery reports for sign-off and billing integration.",
    ],
  },
  {
    slug: "hrms-attendance",
    title: "HRMS & Attendance",
    shortDescription:
      "Automate attendance tracking, leave management, and monthly payroll operations.",
    icon: Clock3,
    iconClassName: "from-[#8c3ff0] to-[#ef3f9c]",
    accent: "#c252e8",
    eyebrow: "Service Excellence Module",
    heroTitle: "Effortless Workforce Management",
    heroDescription:
      "Build a stronger culture with structured people operations. Automate the complex workflows so you can focus on your people.",
    features: [
      "Payroll Management",
      "Attendance Tracking",
      "Leave Workflow",
    ],
    detailSections: [
      {
        title: "Modern HR Operations",
        items: [
          "Seamless attendance tracking via mobile, web, or biometric sync.",
          "One-click monthly payroll generation with statutory compliance.",
          "Customizable leave policies and approval hierarchies.",
          "Employee self-service portal for payslips and leave requests.",
        ],
      },
      {
        title: "Culture & Accountability",
        items: [
          "Enhance transparency with automated salary and deduction logs.",
          "Simplify team scheduling with unified holiday and leave calendars.",
          "Maintain secure, digital employee records and history.",
          "Support scaling teams with standardized onboarding flows.",
        ],
      },
    ],
    workflow: [
      "employees log attendance via their preferred input method.",
      "Managers review and approve leave requests with one click.",
      "Payroll automatically calculates based on attendance and policies.",
      "System distributes digital payslips and logs financial data.",
    ],
  },
  {
    slug: "accounting-finance",
    title: "Accounting & Finance",
    shortDescription:
      "Professional invoicing, expense tracking, and deep financial visibility for service teams.",
    icon: BarChart3,
    iconClassName: "from-[#2877f0] to-[#0ea5e9]",
    accent: "#2f8ef2",
    eyebrow: "Service Excellence Module",
    heroTitle: "Service-Centric Financial Intelligence",
    heroDescription:
      "Take control of your cash flow. Manage invoicing, tracking, and reporting with a finance system built for service operations.",
    features: [
      "GST Billing",
      "Expense Tracking",
      "Profit Dashboards",
    ],
    detailSections: [
      {
        title: "Optimized Billing Cycle",
        items: [
          "Generate professional GST-ready invoices in seconds.",
          "Automated recurring billing for subscription-based services.",
          "Centralized expense tracking with multi-category logging.",
          "Unified view of accounts receivable and pending collections.",
        ],
      },
      {
        title: "Data-Driven Financials",
        items: [
          "Analyze business health with real-time profit and loss reports.",
          "Identify high-margin services vs operational cost centers.",
          "Simplify tax filing with exports formatted for your auditors.",
          "Integrate billing data directly with project delivery logs.",
        ],
      },
    ],
    workflow: [
      "Create professional invoices based on project milestones or cycles.",
      "Monitor payment status and send automated follow-up reminders.",
      "Log operational expenses as they happen for accurate overhead tracking.",
      "Review monthly growth and margin reports on the manager dashboard.",
    ],
  },
];

export const serviceModuleMap = Object.fromEntries(
  serviceModules.map((module) => [module.slug, module])
);
