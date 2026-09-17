"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSidebar } from "@/app/(restaurants)/context/SidebarContext";
import { useEffect, useRef, useState } from "react";
import {
  Printer,
  Download,
  CheckCircle,
  Eye,
  EyeOff,
  Layout,
  Settings2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Maximize,
  List,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { Toaster, toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getApiBase } from "@/utils/apiBase";
import AccessDenied from "@/components/AccessDenied";
import RestaurantLoader from "@/components/RestaurantLoader";

// Backend API base URL
const API_BASE = getApiBase();

const getDisplayTable = (tableNum, orderToken) => {
  const clean = String(tableNum || "").trim();
  if (!clean || clean === "-" || clean === "—") {
    if (orderToken && (orderToken.includes("Take away") || orderToken.includes("Takeaway"))) {
      return "Take away";
    }
    return "";
  }
  return clean;
};

// --- Helper Functions ---

const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken") || localStorage.getItem("token");
  }
  return null;
};

const safeNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return "0.00";
  return parseFloat(value).toFixed(decimals);
};

const safeQuantity = (value, unitSymbol = "") => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  const isKgUnit =
    unitSymbol.toLowerCase() === "kg" || unitSymbol.toLowerCase() === "g";
  const decimals = isKgUnit ? 3 : 0;
  return parseFloat(value).toFixed(decimals);
};

// --- CSS Definition (A4 Print Sizing Fix) ---

const getInvoiceCSS = (format) => {
  return `
    /* Base invoice styles */
    .invoice {
        background-color: white;
        padding: 30px;
        margin: 0 auto;
        color: #000;
        font-family: Helvetica, Arial, sans-serif;
        line-height: 1.6;
    }

    .invoice-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        border-bottom: 2px solid #333;
        padding-bottom: 25px;
    }

    .shop-info { 
        flex: 2; 
        padding-right: 20px;
    }
    .shop-info p {
        margin: 4px 0;
        line-height: 1.5;
    }
    .invoice-info { 
        flex: 1; 
        text-align: right;
        padding-left: 20px;
    }
    .invoice-info p {
        margin: 6px 0;
        line-height: 1.5;
    }
    .invoice-body { 
        margin-top: 30px; 
    }
    .customer-info { 
        margin-bottom: 30px;
        padding: 15px 0;
    }
    .customer-info p {
        margin: 6px 0;
        line-height: 1.6;
    }

    .invoice-items {
        width: 100%;
        border-collapse: collapse;
        margin: 30px 0;
        font-size: 14px;
        table-layout: fixed;
    }

    .invoice-items th {
        background-color: #f5f5f5;
        padding: 14px 12px;
        text-align: left;
        font-weight: 600;
        border: 1px solid #ddd;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .invoice-items td {
        padding: 14px 12px;
        border: 1px solid #eee;
        border-top: none;
        vertical-align: middle;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .invoice-items tbody tr {
        border-bottom: 1px solid #eee;
    }
    .invoice-items tbody tr:last-child {
        border-bottom: 1px solid #ddd;
    }
    
    .invoice-items .item-name-cell {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .invoice-totals {
        margin-top: 40px;
        width: 100%;
        max-width: 350px;
        margin-left: auto;
        font-size: 15px;
    }

    .totals-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #eee;
    }

    .grand-total {
        font-weight: bold;
        font-size: 1.3em;
        border-top: 3px solid #333;
        margin-top: 15px;
        padding-top: 15px;
    }

    .total {
        font-weight: 600;
        font-size: 1.1em;
        border-top: 2px solid #333;
        margin-top: 15px;
        padding-top: 15px;
    }

    .invoice-footer {
        margin-top: 60px;
        text-align: center;
        padding-top: 30px;
        border-top: 1px solid #eee;
    }

    .software-branding {
        margin-top: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        opacity: 0.7;
        font-size: 0.85em;
    }

    .item-code { 
        font-size: 0.85em; 
        color: #666; 
        display: inline;
        margin-left: 8px;
    }
    .amount_th { text-align: right !important; }
    
    .payment-method {
        margin-top: 30px;
        padding: 15px 0;
    }
    .payment-method p {
        margin: 8px 0;
        line-height: 1.6;
    }
    
    .invoice-notes {
        margin-top: 30px;
        padding-top: 20px;
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

    /* --- A4 Format --- */
    .invoice.a4 {
        width: 210mm;
        max-width: 100%;
        font-size: 15px;
        padding: 35px 40px;
    }
    .invoice.a4 .invoice-header {
        margin-bottom: 35px;
        padding-bottom: 30px;
    }
    .invoice.a4 .invoice-body {
        margin-top: 35px;
    }
    .invoice.a4 .customer-info {
        margin-bottom: 35px;
        padding: 20px 0;
    }
    .invoice.a4 .invoice-items { 
        table-layout: fixed; 
        width: 100%;
        margin: 35px 0;
        font-size: 15px;
    }
    .invoice.a4 .invoice-items th {
        padding: 16px 14px;
        white-space: nowrap;
    }
    .invoice.a4 .invoice-items td {
        padding: 16px 14px;
        white-space: nowrap;
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
    .invoice.a4 .invoice-items td { border: 1px solid #eee; }
    .invoice.a4 .invoice-totals {
        margin-top: 45px;
        max-width: 380px;
        font-size: 16px;
    }
    .invoice.a4 .totals-row {
        padding: 14px 0;
    }
    .invoice.a4 .invoice-footer {
        margin-top: 70px;
        padding-top: 35px;
    }

    /* --- Thermal Format --- */
    .invoice.thermal {
        width: 80mm;
        padding: 8px;
        font-family: monospace;
        font-size: 12px;
    }
    .invoice.thermal .invoice-header { 
        display: block; 
        text-align: center; 
        border-bottom: 1px dashed #000; 
        padding-bottom: 10px;
        margin-bottom: 15px;
    }
    .invoice.thermal .shop-info, 
    .invoice.thermal .invoice-info { 
        flex: none; 
        width: 100%; 
        text-align: center;
        padding: 0;
    }
    .invoice.thermal .shop-info p,
    .invoice.thermal .invoice-info p {
        margin: 3px 0;
    }
    .invoice.thermal .shop-info img { 
        display: block; 
        margin: 0 auto 8px; 
    }
    .invoice.thermal .invoice-info h2 { display: none; }
    .invoice.thermal .invoice-body {
        margin-top: 15px;
    }
    .invoice.thermal .customer-info {
        margin-bottom: 15px;
        padding: 10px 0;
    }
    .invoice.thermal .customer-info p {
        margin: 4px 0;
    }
    .invoice.thermal .invoice-items { 
        margin: 15px 0;
        font-size: 11px;
        table-layout: fixed;
    }
    /* Allow full item name on thermal */
    .invoice.thermal .invoice-items .item-name-cell {
        white-space: normal !important;
        overflow: visible !important;
        text-overflow: clip !important;
        word-break: break-word;
        line-height: 1.25;
    }
    /* Keep headers readable on thermal */
    .invoice.thermal .invoice-items th {
        white-space: nowrap;
        overflow: visible;
        text-overflow: clip;
    }
    .invoice.thermal .invoice-items th, 
    .invoice.thermal .invoice-items td { 
        border: none; 
        padding: 6px 0; 
        border-bottom: 1px dashed #ddd;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .invoice.thermal .invoice-items th { 
        border-bottom: 1px solid #000; 
        padding-bottom: 8px;
    }
    .invoice.thermal .invoice-items tbody tr:last-child td {
        border-bottom: 1px solid #000;
    }
    .invoice.thermal .invoice-totals { 
        max-width: 100%; 
        margin-left: 0;
        margin-top: 20px;
        font-size: 12px;
    }
    .invoice.thermal .totals-row { 
        border-top: 1px dashed #000; 
        padding-top: 8px; 
        margin-top: 8px; 
    }
    .invoice.thermal .grand-total { 
        border-top: 2px dashed #000;
        padding-top: 10px;
        margin-top: 10px;
    }
    .invoice.thermal .item-code { display: none; }
    .invoice.thermal .payment-method {
        margin-top: 10px;
        padding: 6px 0;
    }
    .invoice.thermal .invoice-footer {
        margin-top: 18px;
        padding-top: 12px;
    }
    .invoice.thermal .invoice-notes {
        margin-top: 10px;
        padding-top: 10px;
    }
    .invoice.thermal .invoice-notes h4 {
        margin-bottom: 4px;
    }
    .invoice.thermal .invoice-notes p {
        margin-top: 4px;
        line-height: 1.3;
    }

    /* --- Print Overrides --- */
    @media print {
        @page {
            margin: 0;
            size: ${format === "a4" ? "auto" : "80mm auto"};
        }
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
        }
        /* Hide everything by default, then show only the invoice capture. This keeps
           the restaurant layout (header/footer/sidebar) out of print AND avoids
           absolute-position clipping (so long thermal bills can span pages). */
        body * {
            visibility: hidden !important;
        }
        header, footer, nav, aside {
            display: none !important;
        }
        .no-print {
            display: none !important;
        }
        .invoice-wrapper-outer {
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        #invoice-capture {
            visibility: visible !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            padding: ${format === "a4" ? "15mm 20mm" : "4mm"} !important;
            width: ${format === "a4" ? "210mm" : "80mm"} !important;
            min-height: ${format === "a4" ? "297mm" : "auto"} !important; 
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            break-after: avoid-page !important;
            page-break-after: avoid !important;
        }
        .invoice-wrapper-outer {
            break-after: avoid-page !important;
            page-break-after: avoid !important;
        }
        #invoice-capture, #invoice-capture * {
            visibility: visible !important;
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
  const computedSubtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || 0);
    const price =
      parseFloat(item.price_per_unit ?? item.price ?? 0);
    const itemTotal =
      item.item_total !== undefined && item.item_total !== null
        ? parseFloat(item.item_total)
        : qty * price;
    return sum + (Number.isNaN(itemTotal) ? 0 : itemTotal);
  }, 0);

  const displayTaxPercentage =
    invoice.tax_percentage !== undefined && invoice.tax_percentage !== null
      ? parseFloat(invoice.tax_percentage)
      : 0;
  const computedTaxAmount = computedSubtotal * (displayTaxPercentage / 100);
  const displaySubtotal =
    invoice.subtotal !== undefined && invoice.subtotal !== null
      ? parseFloat(invoice.subtotal)
      : computedSubtotal;
  const displayTaxAmount =
    invoice.tax_amount !== undefined && invoice.tax_amount !== null
      ? parseFloat(invoice.tax_amount)
      : computedTaxAmount;
  const displayDiscount =
    invoice.discount !== undefined && invoice.discount !== null
      ? parseFloat(invoice.discount)
      : 0;
  const computedTotal = displaySubtotal + displayTaxAmount - displayDiscount;
  const displayTotal =
    invoice.total !== undefined && invoice.total !== null
      ? parseFloat(invoice.total)
      : computedTotal;
  const displayRoundedTotal =
    invoice.rounded_total !== undefined && invoice.rounded_total !== null
      ? parseFloat(invoice.rounded_total)
      : Math.round(displayTotal);
  const displayRoundOff =
    invoice.round_off !== undefined && invoice.round_off !== null
      ? parseFloat(invoice.round_off)
      : displayRoundedTotal - displayTotal;

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
      className={`invoice ${formatClass} bg-white mx-auto relative overflow-hidden ${printFormat === "a4" ? "max-w-4xl shadow-lg" : "max-w-sm"
        }`}
    >
      {/* Background Stamp */}
      {stampSettings?.visible && (
        <div
          className={`stamp ${
            (String(invoice.payment_status || "").toLowerCase() === "paid" || parseFloat(invoice.balance_due || 0) <= 0)
              ? "stamp-paid"
              : "stamp-unpaid"
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
          {(String(invoice.payment_status || "").toLowerCase() === "paid" || parseFloat(invoice.balance_due || 0) <= 0) ? "PAID" : "UNPAID"}
        </div>
      )}

      {/* Status Badge */}
      <div className="no-print">
        {parseFloat(invoice.balance_due) <= 0 && (
          <div className="status-badge status-badge-paid">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Success: Received All Payments</span>
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
            <p className="text-gray-600 whitespace-pre-line" style={{ marginTop: '8px' }}>
              {shopDetails.shop_address}
            </p>
          )}
          {shopDetails.shop_phone && (
            <p className="text-gray-600" style={{ marginTop: '4px' }}>Phone: {shopDetails.shop_phone}</p>
          )}
          {shopDetails.shop_email && (
            <p className="text-gray-600" style={{ marginTop: '4px' }}>Email: {shopDetails.shop_email}</p>
          )}
          {shopDetails.shop_gst && (
            <p className="text-gray-600" style={{ marginTop: '4px' }}>GST: {shopDetails.shop_gst}</p>
          )}
        </div>
        <div className="invoice-info">
          <h2 className="text-xl font-bold" style={{ marginBottom: '12px' }}>BILL</h2>
          <p style={{ marginTop: '6px' }}>
            <strong>Bill #</strong> {invoice.invoice_number}
          </p>
          <p style={{ marginTop: '6px' }}>
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
            className="text-lg font-semibold"
            style={{ textAlign: "left", marginBottom: '12px' }}
          >
            Bill To:
          </h3>
          <p style={{ marginTop: '6px' }}>
            <strong>{invoice.customer_name}</strong>
          </p>
          {getDisplayTable(invoice.table_number, invoice.order_token) && (
            <p style={{ marginTop: '6px' }}>
              <strong>Table/Type:</strong> {getDisplayTable(invoice.table_number, invoice.order_token)}
            </p>
          )}
          {invoice.customer_phone && (
            <p style={{ marginTop: '6px' }}>Phone: {invoice.customer_phone}</p>
          )}
          {invoice.address && (
            <p style={{ marginTop: '6px' }}>
              Address:{" "}
              <span className="whitespace-pre-line">{invoice.address}</span>
            </p>
          )}
          {invoice.gst_no && (
            <p style={{ marginTop: '6px' }}>GST No: {invoice.gst_no}</p>
          )}
          {invoice.notes && (
            <p style={{ marginTop: '6px' }} className="whitespace-pre-wrap">
              Notes: {invoice.notes}
            </p>
          )}
        </div>

        {/* Items Table */}
        <table className="invoice-items">
          <thead>
            <tr>
              <th style={{ width: "5%" }}>#</th>
              <th style={{ width: "40%" }}>Item</th>

              {/* ✅ DYNAMIC LABEL: Uses Config Value */}
              <th style={{ width: "15%" }}>{priceLabel}</th>

              <th style={{ width: "15%" }}>Qty</th>
              <th className="amount_th" style={{ width: "15%" }}>
                Amount (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const unit =
                item.unit_symbol === "g" ? "kg" : item.unit_symbol || "";

              return (
                <tr key={item.id || index}>
                  <td style={{ whiteSpace: 'nowrap' }}>{index + 1}</td>
                  <td className="item-name-cell" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span>{item.item_name || "Unknown Item"}</span>
                    {item.item_code && (
                      <span className="item-code">({item.item_code})</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    ₹{safeNumber(item.price_per_unit)}/{item.unit_symbol || ""}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {safeQuantity(item.quantity, item.unit_symbol)} {unit}
                  </td>
                  <td className="amount_th" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>₹{safeNumber(item.item_total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div className="invoice-totals">
          <div className="totals-row">
            <span>Subtotal:</span>
            <span>₹{safeNumber(displaySubtotal)}</span>
          </div>

          <div className="totals-row">
            <span>Tax:</span>
            <span>
              ₹{safeNumber(displayTaxAmount)} (
              {safeNumber(displayTaxPercentage, 0)}%)
            </span>
          </div>

          <div className="totals-row">
            <span>Discount (Flat):</span>
            <span>-₹{safeNumber(displayDiscount)}</span>
          </div>

          <div className="totals-row total">
            <span>Total:</span>
            <span>₹{safeNumber(displayTotal)}</span>
          </div>
          <div className="totals-row">
            <span>Round Off:</span>
            <span>
              {displayRoundOff > 0 ? "+" : ""}₹{Math.abs(displayRoundOff).toFixed(2)}
            </span>
          </div>

          <div className="totals-row grand-total">
            <span>Net Total:</span>
            <span>₹{safeNumber(displayRoundedTotal)}</span>
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
            <strong>Payment Method:</strong> {invoice.payment_method || "Cash"}
          </p>
          {parseFloat(invoice.amount_paid) > 0 && (
            <p className="mt-1 text-green-700 font-medium">
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

export default function ViewInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldAutoPrint = searchParams?.get("print") === "true";
  const isPopupPrint = searchParams?.get("popup") === "1";
  const hasAutoPrinted = useRef(false);
  const { collapsed, mobileOpen } = useSidebar();
  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shopDetails, setShopDetails] = useState({});
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("userData") || localStorage.getItem("user");
      const u = rawUser ? JSON.parse(rawUser) : null;
      const role = String(u?.role || u?.user_role || u?.user?.role || "").trim().toLowerCase();

      const isOwner =
        role === "admin" ||
        role === "administrator" ||
        role === "owner" ||
        role === "shop_owner" ||
        role === "restaurant_owner" ||
        role.endsWith("_owner") ||
        role === "manager" ||
        role === "restaurant_manager";

      setHasAccess(isOwner);
      setAccessChecked(true);
    } catch {
      setHasAccess(false);
      setAccessChecked(true);
    }
  }, []);

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
      return localStorage.getItem(localStorageKey) || "a4";
    }
    return "a4";
  });

  const calculateTotals = () => {
    if (!invoice || !items)
      return { totalDiscount: 0, rounded_total: 0, round_off: 0 };

    const totalDiscount = parseFloat(invoice.discount) || 0;
    const total = parseFloat(invoice.total) || 0;
    const rounded_total =
      parseFloat(invoice.rounded_total) || Math.round(total);
    const round_off = parseFloat(invoice.round_off) || rounded_total - total;

    return { totalDiscount, rounded_total, round_off };
  };

  const totals = calculateTotals();

  // --- Data Fetching (Real Data) ---
  useEffect(() => {
    if (!accessChecked || !hasAccess) return;
    const loadInvoice = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const token = getToken();
        const [invoiceRes, shopRes] = await Promise.all([
          fetch(`${API_BASE}/api/restaurant/invoices/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/invoices/shop-details`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!invoiceRes.ok) {
          const errorData = await invoiceRes.json().catch(() => ({}));
          toast.error(errorData.error || "Bill not found");
          setInvoice(null);
          setItems([]);
          setIsLoading(false);
          return;
        }

        const invoiceData = await invoiceRes.json();
        const invoicePayload = invoiceData.invoice;

        setInvoice({
          ...invoicePayload,
          invoice_date: invoicePayload.created_at,
          address: invoicePayload.customer_address,
          gst_no: invoicePayload.customer_gst,
          exchange: false,
          buyback: false,
        });

        setItems(invoicePayload.items || []);

        if (shopRes.ok) {
          const shopData = await shopRes.json();
          setShopDetails({
            shop_name: shopData.shop_name,
            shop_address: shopData.shop_address,
            shop_phone: shopData.shop_phone,
            shop_email: shopData.shop_email,
            shop_gst: shopData.shop_gst,
            shop_logo: shopData.logo_path,
            message: shopData.settings?.invoice_notes || "Thank you for your purchase!",
          });

          setConfig({
            priceLabel: shopData.settings?.price_column_label || "Price",
            enableBuyBack: false,
          });
        }
      } catch (error) {
        console.error("Failed to load invoice:", error);
        toast.error("Failed to load invoice");
        setInvoice(null);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInvoice();
  }, [id, accessChecked, hasAccess]);

  useEffect(() => {
    if (!shouldAutoPrint) return;

    const handleAfterPrint = () => {
      if (isPopupPrint) {
        window.close();
        return;
      }
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/restaurant/billing");
      }
    };

    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, [shouldAutoPrint, isPopupPrint, router]);

  useEffect(() => {
    if (!shouldAutoPrint) return;
    if (hasAutoPrinted.current) return;
    if (isLoading) return;
    if (!invoice) return;

    hasAutoPrinted.current = true;
    const t = setTimeout(() => window.print(), 50);
    return () => clearTimeout(t);
  }, [shouldAutoPrint, isLoading, invoice]);

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
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download invoice.");
    }
  };

  if (isLoading || !accessChecked) {
    return (
      <div className="flex items-center justify-center p-4 sm:p-6 min-h-[60vh]">
        <RestaurantLoader variant="container" message={!accessChecked ? "Verifying..." : "Loading invoice..."} />
      </div>
    );
  }

  if (!hasAccess) {
    return <AccessDenied homeHref="/restaurant/tables" homeLabel="Go to Tables" />;
  }

  if (!invoice) {
    return (
      <div
        className="flex items-center justify-center p-4 sm:p-6"
      >
        Bill not found.
      </div>
    );
  }

  return (
    <div
      className="p-4 sm:p-6"
    >
      <style dangerouslySetInnerHTML={{ __html: getInvoiceCSS(printFormat) }} />

      <div className="flex flex-col gap-4 mb-6 no-print">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">
            Bill #{invoice.invoice_number}
          </h1>
          <div className="flex items-center gap-2">
            <BackButton fallbackUrl="/restaurant/billing" />
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
