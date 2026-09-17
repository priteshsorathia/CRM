import GetStartedClient from "./GetStartedClient";

export const metadata = {
    title: "Get Started with CRM - Growth Your Business",
    description: "Register your shop with CRM. Manage HRMS, Invoices, Inventory, and Sales Analytics. Join thousands of Indian businesses growing with our smart POS solution.",
    keywords: [
        "Start Business with CRM",
        "POS System Registration",
        "HRMS for Shops",
        "Inventory Management Startup",
        "Shop Billing Software",
        "Business Growth Tools India"
    ],
    openGraph: {
        title: "Get Started with CRM - Growth Your Business",
        description: "Join thousands of Indian businesses growing with our smart POS solution.",
        images: ["/og-image.png"],
    },
    twitter: {
        card: "summary_large_image",
        title: "Get Started with CRM",
        description: "Join thousands of Indian businesses growing with our smart POS solution.",
        images: ["/og-image.png"],
    },
};

export default function GetStartedPage() {
    return <GetStartedClient />;
}