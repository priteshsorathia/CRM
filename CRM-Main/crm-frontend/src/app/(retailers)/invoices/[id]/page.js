"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import {
  Printer,
  Download,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Layout,
  Settings2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Maximize,
  Plus,
} from "lucide-react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { Toaster, toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Backend API base URL
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

// --- Helper Functions ---

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken") || localStorage.getItem("token");
  }
  return null;
};

const safeNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return parseFloat(parseFloat(value).toFixed(decimals)).toString();
};

const safeQuantity = (value, unitSymbol = "") => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  const isKgUnit =
    unitSymbol.toLowerCase() === "kg" || unitSymbol.toLowerCase() === "g";
  const decimals = isKgUnit ? 3 : 0;
  return parseFloat(parseFloat(value).toFixed(decimals)).toString();
};

// --- CSS Definition (A4 Print Sizing Fix) ---

const getInvoiceCSS = (format) => {
  return `
    /* Base invoice styles */
    .invoice {
        background-color: white;
        padding: 20px;
        margin: 0 auto;
        color: #000;
        font-family: Helvetica, Arial, sans-serif;
    }

    .invoice-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        border-bottom: 2px solid #333;
        padding-bottom: 20px;
    }

    .shop-info { flex: 2; }
    .invoice-info { flex: 1; text-align: right; }
    .invoice-body { margin-top: 20px; }
    .customer-info { margin-bottom: 20px; }

    .invoice-items {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 13px;
    }

    .invoice-items th {
        background-color: #f2f2f2;
        padding: 12px;
        text-align: left;
    }

    .invoice-items td {
        padding: 12px;
        border-bottom: 1px solid #eee;
    }

    .invoice-totals {
        margin-top: 30px;
        width: 100%;
        max-width: 300px;
        margin-left: auto;
        font-size: 14px;
    }

    .totals-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #eee;
    }

    .grand-total {
        font-weight: bold;
        font-size: 1.2em;
        border-top: 2px solid #333;
        margin-top: 10px;
        padding-top: 10px;
    }

    .total {
        font-weight: 600;
        font-size: 1em;
        border-top: 2px solid #333;
        margin-top: 10px;
        padding-top: 10px;
    }

    .invoice-footer {
        margin-top: 50px;
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #eee;
    }

    .software-branding {
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        opacity: 0.7;
        font-size: 0.8em;
    }

    .item-code { font-size: 0.8em; color: #666; }
    .amount_th { text-align: right !important; }

    .shop-info-item {
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .invoice.thermal .shop-info-item {
        justify-content: flex-start;
    }

    .shop-info-label {
        font-weight: bold;
        font-size: 11px;
        color: #444;
        margin-right: 6px;
    }

    .shop-info-value {
        color: #000 !important;
        font-weight: 400;
        font-size: 13px;
        display: inline-block;
    }

    /* --- Status Stamps --- */
    .stamp {
        position: absolute;
        font-size: 58px;
        font-weight: 900;
        text-transform: uppercase;
        padding: 5px 30px;
        border: 4px solid;
        outline: 2px solid;
        outline-offset: -10px;
        border-radius: 4px;
        opacity: 0.18;
        pointer-events: none;
        z-index: 10;
        white-space: nowrap;
        font-family: sans-serif;
        letter-spacing: 4px;
        transition: all 0.3s ease;
    }
    
    /* Position Overrides */
    .stamp-top-left     { top: 10%; left: 5%; transform: rotate(-12deg); }
    .stamp-top-center   { top: 10%; left: 50%; transform: translate(-50%, 0) rotate(-12deg); }
    .stamp-top-right    { top: 10%; right: 5%; transform: rotate(-12deg); }
    .stamp-bottom-left  { bottom: 15%; left: 5%; transform: rotate(-12deg); }
    .stamp-bottom-center{ bottom: 15%; left: 50%; transform: translate(-50%, 0) rotate(-12deg); }
    .stamp-bottom-right { bottom: 15%; right: 5%; transform: rotate(-12deg); }

    .stamp-paid { color: #059669; border-color: #059669; outline-color: #059669; }
    .stamp-unpaid { color: #dc2626; border-color: #dc2626; outline-color: #dc2626; }

    /* --- Status Badges --- */
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 600;
        margin-bottom: 20px;
        width: 100%;
        font-size: 14px;
    }
    .status-badge-paid { background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
    .status-badge-unpaid { background-color: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

    /* --- A4 Format --- */
    .invoice.a4 {
        width: 210mm;
        max-width: 100%;
        font-size: 14px;
    }
    .invoice.a4 .invoice-items { 
        table-layout: fixed; 
        width: 100%;
    }
    /* Fixed Column Widths */
    .invoice.a4 .invoice-items th:nth-child(2),
    .invoice.a4 .invoice-items td:nth-child(2) { width: 40%; } /* Item Name */
    .invoice.a4 .invoice-items th:nth-child(3),
    .invoice.a4 .invoice-items td:nth-child(3) { width: 15%; } /* Price */
    .invoice.a4 .invoice-items th:nth-child(4),
    .invoice.a4 .invoice-items td:nth-child(4) { width: 15%; } /* Qty */
    .invoice.a4 .invoice-items th:nth-child(5),
    .invoice.a4 .invoice-items td:nth-child(5) { width: 15%; } /* Amount */

    .invoice.a4 .invoice-items th { border: 1px solid #ddd; }
    .invoice.a4 .invoice-items td { border: 1px solid #ddd; border-bottom: 1px solid #eee; }

    /* --- Thermal Format --- */
    .invoice.thermal {
        width: 72mm;
        padding: 5px;
        font-family: monospace;
        font-size: 11px;
    }
    .invoice.thermal .invoice-header { display: block; text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; }
    .invoice.thermal .shop-info { flex: none; width: 100%; text-align: flex-start; }
    .invoice.thermal .invoice-info { flex: none; width: 100%; text-align: right; }
    .invoice.thermal .shop-info img { display: block; margin: 0 auto; }
    .invoice.thermal .invoice-info h2 { display: none; }
    .invoice.thermal .invoice-items th, .invoice.thermal .invoice-items td { 
        border: none; 
        padding: 2px 1px; 
        border-bottom: 1px dashed #eee; 
        font-size: 9.5px;
        vertical-align: top;
        line-height: 1.2;
    }
    .invoice.thermal .invoice-items th { border-bottom: 1px solid #000; font-weight: bold; font-size: 8.5px; padding: 2px 1px; }
    
    /* Column Widths and No-Wrap for Thermal */
    .invoice.thermal .invoice-items th:nth-child(1), .invoice.thermal .invoice-items td:nth-child(1) { width: 4% !important; }
    .invoice.thermal .invoice-items th:nth-child(2), .invoice.thermal .invoice-items td:nth-child(2) { width: 34% !important; }
    .invoice.thermal .invoice-items th:nth-child(3), .invoice.thermal .invoice-items td:nth-child(3) { width: 26% !important; text-align: left; white-space: nowrap; }
    .invoice.thermal .invoice-items th:nth-child(4), .invoice.thermal .invoice-items td:nth-child(4) { width: 16% !important; text-align: center; white-space: nowrap; }
    .invoice.thermal .invoice-items th:nth-child(5), .invoice.thermal .invoice-items td:nth-child(5) { width: 20% !important; text-align: right; white-space: nowrap; }
    
    .invoice.thermal .invoice-totals { max-width: 100%; margin-left: 0; font-size: 11px; }
    .invoice.thermal .totals-row { border-top: 1px dashed #000; padding: 2px 0; margin-top: 2px; }
    .invoice.thermal .grand-total { border-top: 2px dashed #000; padding: 8px 0; margin-top: 5px; }
    .invoice.thermal .item-code { display: none; }
    .invoice.thermal .invoice-footer { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #000; font-size: 10px; }

    /* --- Print Overrides --- */
    @media print {
        @page {
            margin: 0;
            size: ${format === "a4" ? "A4" : "80mm auto"};
        }
        body {
            visibility: hidden; 
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
        }
        .no-print {
            display: none !important;
        }
        .invoice-wrapper-outer {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        #invoice-capture {
            visibility: visible !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            padding: ${format === "a4" ? "10mm" : "2mm"} !important;
            width: ${format === "a4" ? "210mm" : "72mm"} !important;
            min-height: ${format === "a4" ? "297mm" : "unset"} !important;
            height: auto !important;
            overflow: visible !important;
        }
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
    }
  `;
};

// --- Custom Components ---

const InvoicePreview = ({
  invoice,
  items,
  shopDetails,
  printFormat,
  totals,
  config, // ✅ RECIEVING CONFIG (Settings)
  stampSettings, // ✅ RECIEVING STAMP SETTINGS
}) => {
  if (!invoice) return null;
  const { totalDiscount, rounded_total, round_off } = totals;
  const formatClass = printFormat;

  const shopLogoPath = "/shop-logo.png";

  // ✅ USE PASSED CONFIG
  const showBuyBack = config?.enableBuyBack || false;
  const priceLabel = config?.priceLabel || "Price";

  // State to handle logo loading error
  const [logoError, setLogoError] = useState(false);

  // Helper function to get shop logo URL
  const getShopLogoUrl = () => {
    const logoPath = shopDetails.shop_logo;
    if (!logoPath) return null;

    // If it's already a full URL, return as is
    if (logoPath.startsWith("http")) {
      return logoPath;
    }

    // If it's a relative path, prepend API_BASE
    if (logoPath.startsWith("/")) {
      return `${API_BASE}${logoPath}`;
    }

    // Otherwise, assume it's a relative path
    return `${API_BASE}/${logoPath}`;
  };

  const shopLogoUrl = getShopLogoUrl();

  // Reset logo error when shop logo URL changes
  useEffect(() => {
    setLogoError(false);
  }, [shopLogoUrl]);

  return (
    <div
      id="invoice-capture"
      className={`invoice ${formatClass} bg-white mx-auto relative overflow-hidden ${printFormat === "a4" ? "max-w-4xl shadow-lg p-6" : "max-w-sm p-2"
        }`}
    >
      {/* Background Stamp */}
      {stampSettings?.visible && (
        <div
          className={`stamp ${parseFloat(invoice.balance_due) <= 0 ? "stamp-paid" : "stamp-unpaid"
            } stamp-${stampSettings.position}`}
          style={{
            transform: `scale(${stampSettings.scale}) rotate(-12deg)`,
            transformOrigin: stampSettings.position.includes("center")
              ? "center"
              : stampSettings.position.includes("left")
                ? "left"
                : "right",
          }}
        >
          {parseFloat(invoice.balance_due) <= 0 ? "PAID" : "UNPAID"}
        </div>
      )}

      {/* Status Badge */}
      <div className="no-print">
        {parseFloat(invoice.balance_due) <= 0 ? (
          <div className="status-badge status-badge-paid">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="whitespace-nowrap">Success: Received All Payments</span>
          </div>
        ) : (
          <div className="status-badge status-badge-unpaid">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="whitespace-nowrap">Unpaid Amount: ₹{safeNumber(invoice.balance_due)}</span>
          </div>
        )}
      </div>
      {/* Header */}
      <div className="invoice-header">
        <div className="shop-info">
          {/* Show logo if available and no error, otherwise show shop name */}
          {shopLogoUrl && !logoError ? (
            <div className="mb-[10px]">
              <img
                src={shopLogoUrl}
                alt={shopDetails.shop_name || "Shop Logo"}
                className="max-h-10 max-w-[140px] object-contain"
                onError={() => {
                  // Fallback to shop name if image fails to load
                  setLogoError(true);
                }}
              />
            </div>
          ) : (
            shopDetails.shop_name && (
              <h1 className="text-xl font-bold mb-[10px]">
                {shopDetails.shop_name}
              </h1>
            )
          )}
          {shopDetails.shop_address && (
            <div className="shop-info-item">
              <span className="shop-info-label">Location:</span>
              <span className="shop-info-value">{shopDetails.shop_address}</span>
            </div>
          )}
          {shopDetails.shop_phone && (
            <div className="shop-info-item">
              <span className="shop-info-label">Phone:</span>
              <span className="shop-info-value">{shopDetails.shop_phone}</span>
            </div>
          )}
          {shopDetails.shop_email && (
            <div className="shop-info-item">
              <span className="shop-info-label">Email:</span>
              <span className="shop-info-value">{shopDetails.shop_email}</span>
            </div>
          )}
          {shopDetails.shop_gst && (
            <div className="shop-info-item">
              <span className="shop-info-label">GST:</span>
              <span className="shop-info-value">{shopDetails.shop_gst}</span>
            </div>
          )}
        </div>
        <div className="invoice-info">
          <h2 className="text-xl font-bold mb-[10px]">INVOICE</h2>
          <p>
            <strong>Invoice #</strong> {invoice.invoice_number}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {invoice.invoice_date
              ? new Date(invoice.invoice_date).toLocaleDateString("en-GB")
              : ""}{" "}
            {invoice.created_at
              ? new Date(invoice.created_at).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })
              : ""}
          </p>

          {/* ✅ CONDITIONAL RENDERING based on Config */}
          {showBuyBack && (
            <div className="mt-2 border-t border-gray-200 pt-2">
              <p>
                <strong>Exchange:</strong> {invoice.exchange ? "Yes" : "No"}
              </p>
              <p>
                <strong>BuyBack:</strong> {invoice.buyback ? "Yes" : "No"}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="invoice-body">
        {/* Customer Info */}
        <div className="customer-info">
          <h3
            className="text-lg font-semibold mb-[10px]"
            style={{ textAlign: "left" }}
          >
            Bill To:
          </h3>
          <p>
            <strong>{invoice.customer_name}</strong>
          </p>
          {invoice.customer_phone && <p>Phone: {invoice.customer_phone}</p>}
          {invoice.address && (
            <p>
              Address:{" "}
              <span className="whitespace-pre-line">{invoice.address}</span>
            </p>
          )}
          {invoice.gst_no && <p>GST No: {invoice.gst_no}</p>}
        </div>

        {/* Items Table */}
        <table className="invoice-items">
          <thead>
            <tr>
              <th style={{ width: "5%" }}>#</th>
              <th style={{ width: "40%" }}>Item</th>
              <th style={{ width: "15%" }}>{formatClass === "thermal" ? "Rate" : priceLabel}</th>
              <th style={{ width: "15%" }}>Qty</th>
              <th className="amount_th" style={{ width: "15%" }}>
                {formatClass === "thermal" ? "Amt" : "Amount (₹)"}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const unit =
                item.unit_symbol === "g" ? "kg" : item.unit_symbol || "";

              return (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>
                  <td>
                    {item.item_name || "Unknown Item"}
                    {item.item_code && (
                      <div className="item-code">{`Item Code: ${item.item_code}`}</div>
                    )}
                  </td>
                  <td>
                    ₹{safeNumber(item.price_per_unit)}/{item.unit_symbol || ""}
                  </td>
                  <td>
                    {safeQuantity(item.quantity, item.unit_symbol)} {unit}
                  </td>
                  <td className="amount_th">₹{safeNumber(item.item_total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="invoice-totals">
          <div className="totals-row">
            <span>Subtotal:</span>
            <span>₹{safeNumber(invoice.subtotal)}</span>
          </div>

          {invoice.tax_amount > 0 && (
            <div className="totals-row">
              <span>Tax:</span>
              <span>
                ₹{safeNumber(invoice.tax_amount)} (
                {safeNumber(invoice.tax_percentage, 0)}%)
              </span>
            </div>
          )}

          {invoice.discount_amount > 0 && (
            <div className="totals-row">
              <span>
                {invoice.discount_type === "percentage"
                  ? `Discount (${safeNumber(invoice.discount, 0)}%):`
                  : "Discount (Flat):"}
              </span>
              <span>-₹{safeNumber(invoice.discount_amount)}</span>
            </div>
          )}

          {round_off.toFixed(2) !== "0.00" && (
            <>
              <div className="totals-row total">
                <span>Total:</span>
                <span>₹{safeNumber(invoice.total)}</span>
              </div>
              <div className="totals-row">
                <span>Round Off:</span>
                <span>
                  {round_off > 0 ? "+" : ""}₹{Math.abs(round_off).toFixed(2)}
                </span>
              </div>
            </>
          )}

          <div className="totals-row grand-total">
            <span>Net Total:</span>
            <span>₹{safeNumber(rounded_total)}</span>
          </div>

          {totalDiscount > 0 && (
            <p
              style={{
                textAlign: "right",
                fontWeight: "bold",
                color: "green",
                marginTop: "5px",
                fontSize: "0.9em",
              }}
            >
              You saved ₹{safeNumber(totalDiscount)}
            </p>
          )}
        </div>

        <div className="payment-method">
          <p>
            <strong>Payment Method:</strong> {invoice.payment_method || ""}
          </p>
          {parseFloat(invoice.amount_paid) > 0 && (
            <p className="mt-1 text-black font-medium">
              <strong>Note:</strong> ₹{safeNumber(invoice.amount_paid)} received
              as Advance
            </p>
          )}

          {invoice.payment_method === "EMI" && invoice.emi_months > 0 && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-indigo-800 text-xs font-bold uppercase tracking-wider mb-2">
                EMI Plan Details
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-indigo-600 font-medium">Duration:</span>
                  <span className="ml-2 text-indigo-900">
                    {invoice.emi_months} Months
                  </span>
                </div>
                {invoice.interest_percentage > 0 && (
                  <div>
                    <span className="text-indigo-600 font-medium">
                      Interest:
                    </span>
                    <span className="ml-2 text-indigo-900">
                      {invoice.interest_percentage}%
                    </span>
                  </div>
                )}
                {invoice.interest_amount > 0 && (
                  <div className="col-span-2">
                    <span className="text-indigo-600 font-medium">
                      Interest Amount:
                    </span>
                    <span className="ml-2 text-indigo-900">
                      ₹{safeNumber(invoice.interest_amount)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {invoice.notes && (
          <div className="invoice-notes mt-6 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-bold text-gray-700 mb-1">Notes:</h4>
            <p className="text-gray-600 text-sm whitespace-pre-line leading-relaxed italic">
              {invoice.notes}
            </p>
          </div>
        )}
      </div>

      <div className="invoice-footer">
        <p
          dangerouslySetInnerHTML={{
            __html: shopDetails.message || "Thank you for your business!",
          }}
        />
        <div className="software-branding">
          <img
            src={shopLogoPath}
            alt="Shop Logo"
            style={{ height: "20px", width: "auto" }}
          />
        </div>
      </div>
    </div>
  );
};

// --- Main View Component ---

function InvoiceViewContent() {
  const searchParams = useSearchParams();
  const printParam = searchParams.get("print");
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shopDetails, setShopDetails] = useState({});

  // ✅ CONFIG STATE: Store settings here
  const [config, setConfig] = useState({
    priceLabel: "Price",
    enableBuyBack: false,
  });

  // ✅ Stamp Customization State (with Persistence)
  const [stampSettings, setStampSettings] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crm_stamp_settings") || localStorage.getItem("gvoice_stamp_settings");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse stamp settings", e);
        }
      }
    }
    return {
      visible: false,
      position: "bottom-right",
      scale: 0.8,
    };
  });

  // Sync stamp settings to localStorage
  useEffect(() => {
    localStorage.setItem(
      "crm_stamp_settings",
      JSON.stringify(stampSettings)
    );
  }, [stampSettings]);

  const localStorageKey = `invoicePrintFormat_${id}`;
  const [printFormat, setPrintFormat] = useState(() => {
    if (typeof window !== "undefined" && id) {
      return localStorage.getItem(localStorageKey) || "thermal";
    }
    return "thermal";
  });

  const calculateTotals = () => {
    if (!invoice || !items)
      return { totalDiscount: 0, rounded_total: 0, round_off: 0 };

    const totalDiscount = parseFloat(invoice.discount_amount) || 0;
    const total = parseFloat(invoice.total) || 0;
    const rounded_total =
      parseFloat(invoice.rounded_total) || Math.round(total);
    const round_off = parseFloat(invoice.round_off) || rounded_total - total;

    return { totalDiscount, rounded_total, round_off };
  };

  const totals = calculateTotals();

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = getToken();
        if (!token) throw new Error("Authentication token not found.");

        // 1. Fetch Settings Explicitly (Guarantees we get the latest label/toggle)
        try {
          const settingsRes = await fetch(`${API_BASE}/api/settings/invoice`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const settingsData = await settingsRes.json();
          if (settingsData.success) {
            setConfig({
              priceLabel: settingsData.data.price_column_label || "Price",
              enableBuyBack: settingsData.data.enable_buyback_exchange || false,
            });
          }
        } catch (err) {
          console.error("Failed to load settings in view", err);
        }

        // 2. Fetch Invoice Data
        const response = await fetch(`${API_BASE}/api/invoices/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const invoiceData = await response.json();

          setInvoice({
            ...invoiceData,
            invoice_date: invoiceData.invoice_date
              ? new Date(invoiceData.invoice_date).toISOString().split("T")[0]
              : "",
            address: invoiceData.customer_address,
            gst_no: invoiceData.customer_gst,
            tax_amount: invoiceData.tax_amount,
            tax_percentage: invoiceData.tax_percentage,
            discount: invoiceData.discount || 0,
            discount_type: invoiceData.discount_type || "percentage",
            discount_amount: invoiceData.discount_amount || 0,
            total: invoiceData.total || 0,
            rounded_total: invoiceData.rounded_total,
            round_off: invoiceData.round_off,
            exchange: invoiceData.exchange,
            buyback: invoiceData.buyback,
          });

          setItems(
            invoiceData.invoice_items.map((item) => ({
              ...item,
              price_per_unit: item.price_per_unit,
              item_code: item.inventory_item?.item_code || "",
            })) || []
          );

          if (invoiceData.shop) {
            setShopDetails({
              shop_name: invoiceData.shop.name || "CRM Demo",
              shop_address: invoiceData.shop.address || "Address not available",
              shop_phone: invoiceData.shop.phone || "",
              shop_email: invoiceData.shop.email || "",
              shop_gst: invoiceData.shop.gstNumber || "",
              shop_logo:
                invoiceData.shop.logo || invoiceData.shop.logo_path || null,
              message:
                "This is a computer-generated invoice.<br>Thank you for your purchase! Have a Great Day!",
            });
          }
        } else {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
            `Failed to fetch invoice with status: ${response.status}`
          );
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        toast.error("Failed to load invoice: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ✅ AUTO-PRINT LOGIC
  useEffect(() => {
    if (printParam === "true" && !isLoading && invoice) {
      // Small delay to ensure styles are applied
      const timer = setTimeout(() => {
        window.print();
        // Clean up URL to avoid re-printing on refresh
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [printParam, isLoading, invoice]);

  useEffect(() => {
    if (typeof window !== "undefined" && id) {
      localStorage.setItem(`invoicePrintFormat_${id}`, printFormat);
    }
  }, [printFormat, id]);

  // --- Handlers ---
  const handleFormatChange = (e) => setPrintFormat(e.target.value);
  const handlePrint = async () => window.print();

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    const element = document.getElementById("invoice-capture");
    if (!element) {
      toast.error("Invoice preview not found");
      return;
    }

    toast.info("Generating high-quality PDF...");

    try {
      // Temporarily hide elements with 'no-print' class
      const noPrintElements = element.querySelectorAll(".no-print");
      noPrintElements.forEach((el) => (el.style.display = "none"));

      // Use html2canvas to capture the element
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Restore 'no-print' elements
      noPrintElements.forEach((el) => (el.style.display = ""));

      const imgData = canvas.toDataURL("image/png");

      // Calculate PDF dimensions
      const pdf = new jsPDF({
        orientation: printFormat === "thermal" ? "p" : "p",
        unit: "mm",
        format:
          printFormat === "thermal"
            ? [80, (canvas.height * 80) / canvas.width]
            : "a4",
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${invoice.invoice_number}.pdf`);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF Generation Failed:", error);
      toast.error(
        "Failed to generate PDF. Please try printing to PDF instead."
      );
    }
  };

  const handleDownloadHTML = () => {
    if (!invoice) return;
    const generatePrintHTML = () => {
      const invoiceElement = document.getElementById("invoice-capture");
      if (!invoiceElement) return "";
      const content = invoiceElement.cloneNode(true);
      content.removeAttribute("id");
      return `<html><head><title>Invoice</title><style>${getInvoiceCSS(
        printFormat
      )} body{margin:0;padding:0}.invoice{box-shadow:none!important}</style></head><body>${content.outerHTML
        }</body></html>`;
    };
    try {
      const blob = new Blob([generatePrintHTML()], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${invoice.invoice_number}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("HTML file downloaded.");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download invoice.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        Loading invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center">
        Invoice not found.
      </div>
    );
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: getInvoiceCSS(printFormat) }} />

      <div className="flex flex-col gap-4 mb-6 no-print">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">
            Invoice #{invoice.invoice_number}
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/invoices/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Invoice</span>
            </Link>
            <BackButton fallbackUrl="/invoices" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          {/* Format Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Print Format
            </label>
            <select
              value={printFormat}
              onChange={handleFormatChange}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="a4">Layout 1 | A4 Paper</option>
              <option value="thermal">Layout 2 | 80mm Thermal</option>
            </select>
          </div>

          <div className="w-px h-10 bg-gray-100 hidden lg:block" />

          {/* Stamp Settings */}
          <div className="flex flex-col gap-2 flex-grow">
            <div className="flex items-center gap-2">
              <Settings2 className="w-3 h-3 text-gray-500" />
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Stamp Configuration
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Toggle Visibility */}
              <button
                onClick={() =>
                  setStampSettings((s) => ({ ...s, visible: !s.visible }))
                }
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${stampSettings.visible
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
              >
                {stampSettings.visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                {stampSettings.visible ? "Stamp Visible" : "Stamp Hidden"}
              </button>

              {/* Position Selector */}
              {stampSettings.visible && (
                <>
                  <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                    {[
                      {
                        id: "top-left",
                        icon: <AlignLeft className="w-3 h-3 rotate-180" />,
                        label: "TL",
                      },
                      {
                        id: "top-center",
                        icon: <AlignCenter className="w-3 h-3 rotate-180" />,
                        label: "TC",
                      },
                      {
                        id: "top-right",
                        icon: <AlignRight className="w-3 h-3 rotate-180" />,
                        label: "TR",
                      },
                      {
                        id: "bottom-left",
                        icon: <AlignLeft className="w-3 h-3" />,
                        label: "BL",
                      },
                      {
                        id: "bottom-center",
                        icon: <AlignCenter className="w-3 h-3" />,
                        label: "BC",
                      },
                      {
                        id: "bottom-right",
                        icon: <AlignRight className="w-3 h-3" />,
                        label: "BR",
                      },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() =>
                          setStampSettings((s) => ({ ...s, position: pos.id }))
                        }
                        title={pos.id.replace("-", " ")}
                        className={`p-1.5 rounded-md transition-all ${stampSettings.position === pos.id
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                          }`}
                      >
                        {pos.icon}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-100">
                    <Maximize className="w-3 h-3 text-gray-500" />
                    <input
                      type="range"
                      min="0.4"
                      max="1.5"
                      step="0.1"
                      value={stampSettings.scale}
                      onChange={(e) =>
                        setStampSettings((s) => ({
                          ...s,
                          scale: parseFloat(e.target.value),
                        }))
                      }
                      className="w-20 accent-blue-600"
                    />
                    <span className="text-[10px] font-bold text-gray-500 w-8">
                      {(stampSettings.scale * 100).toFixed(0)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="w-px h-10 bg-gray-100 hidden lg:block" />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm"
            >
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex justify-center invoice-wrapper-outer"
        key={printFormat}
      >
        <InvoicePreview
          invoice={invoice}
          items={items}
          shopDetails={shopDetails}
          printFormat={printFormat}
          totals={totals}
          config={config} // ✅ Pass Config to Preview
          stampSettings={stampSettings} // ✅ PASS STAMP SETTINGS
        />
      </div>
    </div>
  );
}

export default function ViewInvoicePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-10">Loading invoice viewer...</div>}>
      <InvoiceViewContent />
    </Suspense>
  );
}
