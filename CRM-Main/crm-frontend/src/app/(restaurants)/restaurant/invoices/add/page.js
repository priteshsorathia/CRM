'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import RestaurantLoader from "@/components/RestaurantLoader";
import { toast } from "sonner";
import {
  FaTable,
  FaReceipt,
  FaCheckCircle,
  FaTimes,
  FaSearch,
  FaPlus,
  FaSpinner
} from "react-icons/fa";
import Link from "next/link";
import { getApiBase } from "@/utils/apiBase";

const API_BASE = getApiBase();

export default function AddRestaurantInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Parameters
  const tokenParam = searchParams.get('token');
  const tableParam = searchParams.get('table');
  const totalParam = searchParams.get('total');
  const customerParam = searchParams.get('customer') || "";
  const phoneParam = searchParams.get('phone') || "";
  const notesParam = searchParams.get('notes') || "";

  const [shopDetails, setShopDetails] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingTables, setLoadingTables] = useState(false);
  const [error, setError] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [billOrders, setBillOrders] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [upiPaid, setUpiPaid] = useState(false);
  const [merchantUpi, setMerchantUpi] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [portalRoot, setPortalRoot] = useState(null);
  const storedCustomerByToken = useMemo(() => {
    if (typeof window === "undefined") return null;
    if (!tokenParam) return null;
    try {
      const raw = localStorage.getItem(`orderCustomer_${tokenParam}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [tokenParam]);

  const [customerName, setCustomerName] = useState(
    customerParam || storedCustomerByToken?.customer || ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    phoneParam || storedCustomerByToken?.phone || ""
  );
  const [customerNotes, setCustomerNotes] = useState(
    notesParam || ""
  );
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(tableParam || "");
  const [searchTable, setSearchTable] = useState("");
  const [discount, setDiscount] = useState(0);
  const [existingBill, setExistingBill] = useState(null);
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);
  const lastNotifiedBillIdRef = useRef(null);
  const tableParamAutoFetchedRef = useRef(false);

  useEffect(() => {
    if (typeof document !== "undefined") setPortalRoot(document.body);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        setShowQRModal(false);
      }
    };
    if (showQRModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showQRModal]);

  const billTotals = useMemo(() => {
    const total = (billOrders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
    return {
      total_amount: total
    };
  }, [billOrders]);

  const TAX_PCT = useMemo(() => {
    return (shopDetails?.settings?.default_tax !== undefined && shopDetails?.settings?.default_tax !== null)
      ? Number(shopDetails.settings.default_tax)
      : 0;
  }, [shopDetails]);
  const itemsSubtotal = useMemo(() => {
    const items = orderData?.items || [];
    return items.reduce((sum, item) => {
      const price = Number(item?.price_per_unit ?? item?.price ?? 0);
      const qty = Number(item?.quantity ?? 0);
      if (!Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return sum;
      return sum + price * qty;
    }, 0);
  }, [orderData?.items]);
  const itemsTax = useMemo(() => (itemsSubtotal * TAX_PCT) / 100, [itemsSubtotal, TAX_PCT]);
  const itemsGrandTotal = useMemo(() => itemsSubtotal + itemsTax, [itemsSubtotal, itemsTax]);

  const discountAmount = useMemo(() => {
    let base = 0;
    if (itemsSubtotal > 0) base = itemsGrandTotal;
    else if (Number.isFinite(billTotals.total_amount) && billTotals.total_amount > 0) base = billTotals.total_amount;
    else {
      const fallback = Number(orderData?.total_amount ?? totalParam ?? 0);
      base = Number.isFinite(fallback) ? fallback : 0;
    }
    return parseFloat(((base * (Number(discount) || 0)) / 100).toFixed(2));
  }, [billTotals.total_amount, itemsGrandTotal, itemsSubtotal, orderData?.total_amount, totalParam, discount]);

  const payableTotal = useMemo(() => {
    let base = 0;
    if (itemsSubtotal > 0) base = itemsGrandTotal;
    else if (Number.isFinite(billTotals.total_amount) && billTotals.total_amount > 0) base = billTotals.total_amount;
    else {
      const fallback = Number(orderData?.total_amount ?? totalParam ?? 0);
      base = Number.isFinite(fallback) ? fallback : 0;
    }
    return Math.round(Math.max(0, base - discountAmount));
  }, [billTotals.total_amount, itemsGrandTotal, itemsSubtotal, orderData?.total_amount, totalParam, discountAmount]);

  // Function to get token
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || localStorage.getItem('token');
    }
    return null;
  };

  const buildCombinedOrder = (orders, tableNumberOverride = "") => {
    const validOrders = (orders || []).filter(Boolean);
    const tokens = validOrders.map((o) => o.order_token).filter(Boolean);
    const tableNumber =
      tableNumberOverride ||
      validOrders.find((o) => o.table_number)?.table_number ||
      selectedTable ||
      "";

    // Merge items by (name, price) so the bill looks clean.
    const merged = new Map();
    validOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const name = it.name || it.item_name || it.menu_item_name || "";
        const price = Number(it.price ?? it.price_per_unit ?? 0);
        const qty = Number(it.quantity ?? 0);
        if (!name || !Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return;
        const k = `${name}__${price.toFixed(2)}`;
        const prev = merged.get(k);
        if (prev) {
          prev.quantity += qty;
        } else {
          merged.set(k, {
            item_name: name,
            quantity: qty,
            price_per_unit: price,
            unit_name: it.unit_name || "pcs",
            unit_symbol: it.unit_symbol || "pcs",
          });
        }
      });
    });

    const combinedItems = Array.from(merged.values()).sort((a, b) =>
      String(a.item_name).localeCompare(String(b.item_name))
    );

    return {
      order_token: tokens.join(", "),
      order_tokens: tokens,
      table_number: tableNumber,
      customer_name: validOrders.find((o) => o.customer_name)?.customer_name || "",
      customer_phone: validOrders.find((o) => o.customer_phone)?.customer_phone || "",
      customer_notes: validOrders.map((o) => o.customer_notes || o.notes).filter(Boolean).join("; "),
      total_amount: validOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
      items: combinedItems,
      orders_count: validOrders.length,
    };
  };

  useEffect(() => {
    if (!orderData) return;
    const fallbackName =
      orderData.customer_name ||
      (orderData.table_number || selectedTable
        ? `Table ${orderData.table_number || selectedTable}`
        : "Restaurant Customer");
    setCustomerName((prev) => (prev ? prev : fallbackName));
  }, [orderData, selectedTable]);

  useEffect(() => {
    if (!orderData) return;
    setCustomerPhone((prev) => (prev ? prev : orderData.customer_phone || ""));
    setCustomerNotes((prev) => (prev ? prev : orderData.customer_notes || ""));
  }, [orderData]);

  useEffect(() => {
    setCustomerName((prev) => (prev ? prev : customerParam));
    setCustomerPhone((prev) => (prev ? prev : phoneParam));
    setCustomerNotes((prev) => (prev ? prev : notesParam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerParam, phoneParam, notesParam]);

  // Fetch shop details
  useEffect(() => {
    const fetchShopDetails = async () => {
      try {
        const token = getToken();
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const fetchNextBillNumber = async () => {
          const res = await fetch(`${API_BASE}/api/invoices/next-number`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to generate bill number');
          const json = await res.json().catch(() => ({}));
          if (!json?.success || !json?.nextNumber) throw new Error('Failed to generate bill number');
          return String(json.nextNumber);
        };

        const response = await fetch(`${API_BASE}/api/invoices/shop-details`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setShopDetails({
            shop_name: data.shop_name || "Restaurant",
            shop_address: data.shop_address || "",
            shop_phone: data.shop_phone || "",
            shop_email: data.shop_email || "",
            shop_gst: data.shop_gst || "",
            upi_id: data.upi_id || data.upiId || "",
            logo_path: data.logo_path || "/shop-logo.png",
            settings: {
              default_tax: (data.settings?.default_tax !== undefined && data.settings?.default_tax !== null)
                ? Number(data.settings.default_tax)
                : 0
            }
          });

          try {
            const nextNumber = await fetchNextBillNumber();
            setInvoiceNumber(nextNumber);
          } catch {
            setInvoiceNumber("");
          }

          try {
            const userRes = await fetch(`${API_BASE}/api/settings`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const userJson = await userRes.json().catch(() => ({}));
            if (userRes.ok && userJson?.success && userJson?.data?.upiId) {
              setMerchantUpi(userJson.data.upiId);
            }
          } catch {
            // ignore UPI fetch errors
          }
        } else {
          throw new Error('Failed to load shop details');
        }
      } catch (err) {
        console.error('Error fetching shop details:', err);
        setError('Failed to load shop details. Please try again.');
        // Set default shop details for fallback
        setShopDetails({
          shop_name: "Restaurant",
          shop_address: "",
          shop_phone: "",
          shop_email: "",
          shop_gst: "",
          upi_id: "",
          logo_path: "/shop-logo.png",
          settings: { default_tax: 0 }
        });
        try {
          const token = getToken();
          if (token) {
            const res = await fetch(`${API_BASE}/api/invoices/next-number`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok && json?.success && json?.nextNumber) {
              setInvoiceNumber(String(json.nextNumber));
            } else {
              setInvoiceNumber("");
            }

            try {
              const userRes = await fetch(`${API_BASE}/api/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const userJson = await userRes.json().catch(() => ({}));
              if (userRes.ok && userJson?.success && userJson?.data?.upiId) {
                setMerchantUpi(userJson.data.upiId);
              }
            } catch {
              // ignore UPI fetch errors
            }
          } else {
            setInvoiceNumber("");
          }
        } catch {
          setInvoiceNumber("");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShopDetails();
  }, [router]);

  const generateUPIUrl = () => {
    const upiId = merchantUpi || shopDetails?.upi_id;
    if (!upiId) return "";
    const shopName = shopDetails?.shop_name || "Restaurant";
    const transactionId = `TXN${Date.now()}`;
    return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
      shopName
    )}&am=${Number(payableTotal || 0).toFixed(2)}&cu=INR&tid=${transactionId}&tn=Payment for invoice ${invoiceNumber || ""}`;
  };

  const isUpiConfigured = useMemo(() => {
    const upiId = String(merchantUpi || shopDetails?.upi_id || "").trim();
    return upiId.length > 0;
  }, [merchantUpi, shopDetails?.upi_id]);

  useEffect(() => {
    if (paymentMethod === "UPI" && !isUpiConfigured) {
      setPaymentMethod("Cash");
      setShowQRModal(false);
    }
  }, [isUpiConfigured, paymentMethod]);

  const generateQRCode = async () => {
    if (isGeneratingQR) return;
    if (payableTotal <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }
    if (!isUpiConfigured) {
      toast.error("UPI is not configured. Please set a UPI ID in Settings.");
      return;
    }

    setIsGeneratingQR(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setShowQRModal(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Error generating QR code. Please try again.");
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast.success("Payment Successful!", {
      description: `₹${Number(payableTotal || 0).toFixed(2)} received for Invoice #${invoiceNumber || ""}.`,
      duration: 3000,
    });
    setUpiPaid(true);
    setShowQRModal(false);
  };

  const handlePaymentMethodSelect = (method) => {
    if (method === "UPI" && !isUpiConfigured) {
      toast.error("UPI is not configured. Please set a UPI ID in Settings.");
      return;
    }
    setPaymentMethod(method);
    setUpiPaid(false);
    if (method === "UPI") {
      if (!showQRModal) generateQRCode();
    } else {
      setShowQRModal(false);
    }
  };

  // Fetch tables
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoadingTables(true);
        const token = getToken();
        if (!token) {
          setTables([]);
          setLoadingTables(false);
          return;
        }

        const response = await fetch(`${API_BASE}/api/restaurant/tables`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setTables(data.tables || []);
        } else {
          setTables([]);
        }
      } catch (err) {
        console.error('Error fetching tables:', err);
        setTables([]);
      } finally {
        setLoadingTables(false);
      }
    };

    if (shopDetails) {
      fetchTables();
    }
  }, [shopDetails]);

  // Fetch order data if token is provided
  useEffect(() => {
    if (tokenParam && shopDetails) {
      fetchOrderByToken(tokenParam);
    }
  }, [tokenParam, shopDetails]);

  const fetchOrderByToken = async (token) => {
    try {
      setLoading(true);
      const authToken = getToken();

      const response = await fetch(`${API_BASE}/api/restaurant/orders/token/${token}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        const order = data.order;
        if (order?.table_number) {
          setSelectedTable(order.table_number);
          await fetchTableOrders(order.table_number, {
            preferToken: token,
            preferOrderAt: order.created_at
          });
        } else {
          // Online order (no table): bill only this order
          setBillOrders(order ? [order] : []);
          setOrderData(order ? buildCombinedOrder([order]) : null);
        }
      } else {
        setOrderData(null);
        setBillOrders([]);
        if (tableParam) {
          setSelectedTable(tableParam);
        }
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      toast.error('Failed to load order data');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (tableNumber) => {
    setSelectedTable(tableNumber);
    setExistingBill(null);
    // Fetch orders for this table
    fetchTableOrders(tableNumber);
  };

  // If user opens Billing/Add directly with `?table=T-01`, auto-load that table once.
  useEffect(() => {
    if (!shopDetails) return;
    if (tokenParam) return;
    if (!tableParam) return;
    if (!selectedTable) return;
    if (tableParamAutoFetchedRef.current) return;
    tableParamAutoFetchedRef.current = true;

    fetchTableOrders(selectedTable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopDetails, tokenParam, tableParam, selectedTable]);

  const fetchTableOrders = async (tableNumber, { preferToken, preferOrderAt } = {}) => {
    try {
      const authToken = getToken();

      // Determine "session window" for this table:
      // - If user opens billing with an order token: include the orders in the same session as that token
      //   (between previous bill and next bill).
      // - If user selects a table normally: include only orders after the most recent bill.
      let sessionStartAt = null; // exclusive
      let sessionEndAt = null; // exclusive
      let latestBillForTable = null;
      let existingBillForSession = null;
      try {
        const billRes = await fetch(
          `${API_BASE}/api/restaurant/invoices?table=${encodeURIComponent(
            tableNumber
          )}&sortBy=newest&page=1&limit=50`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        if (billRes.ok) {
          const billJson = await billRes.json().catch(() => ({}));
          const bills = Array.isArray(billJson.invoices) ? billJson.invoices : [];

          const billsWithTime = bills
            .map((b) => ({ bill: b, t: new Date(b.created_at).getTime() }))
            .filter((x) => Number.isFinite(x.t))
            .sort((a, b) => a.t - b.t); // asc

          const preferAtMs = preferOrderAt ? new Date(preferOrderAt).getTime() : null;

          if (billsWithTime.length > 0) {
            latestBillForTable = billsWithTime[billsWithTime.length - 1].bill;
          }

          if (preferAtMs && Number.isFinite(preferAtMs)) {
            // Find the previous bill before the preferred order (session start) and the next bill after it (session end).
            for (let i = 0; i < billsWithTime.length; i++) {
              const { t, bill } = billsWithTime[i];
              if (t < preferAtMs) sessionStartAt = t;
              if (t > preferAtMs) {
                sessionEndAt = t;
                existingBillForSession = bill;
                break;
              }
            }
          } else {
            // Normal table selection: session starts after the latest bill
            if (billsWithTime.length > 0) sessionStartAt = billsWithTime[billsWithTime.length - 1].t;
          }
        }
      } catch {
        // non-blocking
      }

      const response = await fetch(
        `${API_BASE}/api/restaurant/orders?table=${tableNumber}&status=pending,preparing,ready,completed&date=today`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` }
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Client-side safety net: only include today's orders
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartMs = todayStart.getTime();

        const orders = (data.orders || [])
          .filter((o) => o && o.status !== "cancelled")
          .filter((o) => {
            const t = new Date(o.created_at).getTime();
            // Exclude orders from previous days
            if (!Number.isFinite(t) || t < todayStartMs) return false;
            // Session filtering:
            // - Start: orders must be newer than sessionStartAt (if exists)
            // - End: orders must be older than sessionEndAt (if exists) (token-based session)
            if (sessionStartAt && t <= sessionStartAt) return false;
            if (sessionEndAt && t >= sessionEndAt) return false;
            return true;
          })
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        if (existingBillForSession?.id) {
          setExistingBill(existingBillForSession);
          if (lastNotifiedBillIdRef.current !== existingBillForSession.id) {
            lastNotifiedBillIdRef.current = existingBillForSession.id;
            toast(`Bill already generated for this order/session (${existingBillForSession.invoice_number || "Bill"}).`, {
              action: {
                label: "View Bill",
                onClick: () =>
                  router.push(`/restaurant/billing/view/${existingBillForSession.id}`),
              },
            });
          }
        } else if (latestBillForTable?.id && orders.length === 0) {
          setExistingBill(latestBillForTable);
          if (lastNotifiedBillIdRef.current !== latestBillForTable.id) {
            lastNotifiedBillIdRef.current = latestBillForTable.id;
            toast(`Bill already generated for this table (${latestBillForTable.invoice_number || "Bill"}).`, {
              action: {
                label: "View Bill",
                onClick: () =>
                  router.push(`/restaurant/billing/view/${latestBillForTable.id}`),
              },
            });
          }
        } else {
          setExistingBill(null);
        }

        if (orders.length > 0) {
          // Ensure the token used to open this page is included and shown first in the token list.
          if (preferToken) {
            orders.sort((a, b) => {
              if (a.order_token === preferToken) return -1;
              if (b.order_token === preferToken) return 1;
              return new Date(a.created_at) - new Date(b.created_at);
            });
          }
          setBillOrders(orders);
          setOrderData(buildCombinedOrder(orders, tableNumber));
        } else {
          setBillOrders([]);
          setOrderData(null);
        }
      }
    } catch (err) {
      console.error('Error fetching table orders:', err);
    }
  };

  const handleGenerateBill = async () => {
    // Validation
    const nameVal = (customerName || "").trim();
    if (nameVal && (nameVal.length < 3 || nameVal.length > 50)) {
      toast.error("Customer Name must be between 3 and 50 characters.");
      return;
    }

    const phoneVal = (customerPhone || "").trim();
    if (phoneVal) {
      const phoneDigits = phoneVal.replace(/\D/g, "");
      if (phoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(phoneDigits) || /^(.)\1{9}$/.test(phoneDigits)) {
        toast.error("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210, not all repeating digits).");
        return;
      }
    }

    const notesVal = (customerNotes || "").trim();
    if (notesVal && (notesVal.length < 3 || notesVal.length > 200)) {
      toast.error("Notes must be between 3 and 200 characters.");
      return;
    }

    let baseTotal = 0;
    if (itemsSubtotal > 0) baseTotal = itemsGrandTotal;
    else if (Number.isFinite(billTotals.total_amount) && billTotals.total_amount > 0) baseTotal = billTotals.total_amount;
    else {
      const fallback = Number(orderData?.total_amount ?? totalParam ?? 0);
      baseTotal = Number.isFinite(fallback) ? fallback : 0;
    }
    const currentDiscountAmount = (baseTotal * (Number(discount) || 0)) / 100;
    if (isGeneratingBill) return;
    if (!orderData) return;

    // If we already detected an existing bill for this session/table, don't create duplicates.
    if (existingBill?.id) {
      router.push(`/restaurant/billing/view/${existingBill.id}`);
      return;
    }

    setIsGeneratingBill(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/restaurant/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoice_number: invoiceNumber || undefined,
          order_token: (orderData.order_tokens || [orderData.order_token]).filter(Boolean).join(", "),
          table_number: orderData.table_number || selectedTable,
          customer_name: (customerName || "").trim() || `Table ${orderData.table_number || selectedTable}`,
          customer_phone: (customerPhone || "").trim() || null,
          items: (orderData.items || []).map((item) => ({
            item_name: item.item_name || item.name || "",
            quantity: item.quantity,
            price_per_unit: item.price_per_unit || item.price || 0,
            unit_name: item.unit_name || "pcs",
            unit_symbol: item.unit_symbol || "pcs",
          })),
          tax_percentage: TAX_PCT,
          discount: discountAmount,
          payment_method: paymentMethod,
          payment_status: (paymentMethod === "Cash" || paymentMethod === "Card" || (paymentMethod === "UPI" && upiPaid)) ? "Paid" : "Unpaid",
          notes: (() => {
            const tokenNotes = (orderData.order_tokens && orderData.order_tokens.length > 1)
              ? `Orders: ${orderData.order_tokens.join(", ")}`
              : "";
            const userNotes = (customerNotes || "").trim();
            if (userNotes && tokenNotes) {
              return `${userNotes} | ${tokenNotes}`;
            }
            return userNotes || tokenNotes;
          })(),
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Bill generated successfully!');
        router.push(`/restaurant/billing/${data.invoice.id}`);
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || 'Failed to generate bill');
      }
    } catch (err) {
      console.error('Error generating bill:', err);
      toast.error('Failed to generate bill. Please try again.');
    } finally {
      setIsGeneratingBill(false);
    }
  };

  const filteredTables = tables
    .filter((table) => String(table.status || "").toLowerCase() === "occupied")
    .filter(
      (table) =>
        table.table_number?.toLowerCase().includes(searchTable.toLowerCase()) ||
        table.name?.toLowerCase().includes(searchTable.toLowerCase())
    )
    .sort((a, b) =>
      String(a.table_number || "").localeCompare(String(b.table_number || ""), undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );

  if (loading && !shopDetails) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <RestaurantLoader variant="container" message="Loading..." className="py-8" />
        </div>
      </div>
    );
  }

  if (error && !shopDetails) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-lg text-red-500 text-center">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white rounded-lg hover:shadow-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {showQRModal &&
        portalRoot &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Scan to Pay via UPI
                </h3>
                <div className="bg-white p-6 rounded-lg mb-4 flex items-center justify-center border-2 border-green-200">
                  <div className="text-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        generateUPIUrl()
                      )}`}
                      alt="UPI QR Code"
                      className="w-48 h-48 mx-auto mb-3"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        if (e.currentTarget.nextSibling)
                          e.currentTarget.nextSibling.style.display = "block";
                      }}
                    />
                    <div className="hidden w-48 h-48 bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <div className="text-center">
                        <div className="text-4xl mb-2">ðŸ“±</div>
                        <p className="text-sm text-gray-600">QR Code</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                      Scan to Pay via UPI
                    </p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      ₹{Number(payableTotal || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Invoice: {invoiceNumber}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Scan with any UPI app to pay ₹{Number(payableTotal || 0).toFixed(2)}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handlePaymentSuccess}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Payment Done
                    </button>
                    <button
                      onClick={() => setShowQRModal(false)}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-4">
                    <p>
                      UPI ID:{" "}
                      {merchantUpi || shopDetails?.upi_id || "Not Configured"}
                    </p>
                    <p>Invoice: {invoiceNumber}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          portalRoot
        )}

      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  Generate Bill
                </h1>
                <p className="text-gray-600 text-sm">
                  Create bill for table orders quickly
                </p>
              </div>
              <Link
                href="/restaurant/billing"
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
              >
                View All Bills
              </Link>
            </div>
          </div>

          {/* Quick Table Selector */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#5655eb] to-[#4338ca] flex items-center justify-center">
                <FaTable className="text-white text-lg" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Occupied Tables</h2>
                <p className="text-xs text-gray-500">Generate bill for active dining tables</p>
              </div>
            </div>

             {/* Search Tables */}
             <div className="mb-6">
               <div className="relative">
                 <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input
                   type="text"
                   placeholder="Search tables"
                   value={searchTable}
                   onChange={(e) => {
                     const val = e.target.value.replace(/\./g, '');
                     if (val === ' ' || (val.trim() === '' && val.length > 0)) {
                       setSearchTable('');
                     } else {
                       setSearchTable(val);
                     }
                   }}
                   className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb] transition-all"
                 />
               </div>
             </div>

            {/* Reserved Tables - Horizontal */}
            {loadingTables ? (
              <div className="flex items-center justify-center py-12">
                <FaSpinner className="animate-spin text-[#5655eb] text-2xl" />
              </div>
            ) : filteredTables.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 horizontal-scrollbar flex-nowrap whitespace-nowrap">
                {filteredTables.map((table) => (
                  <button
                    key={table.id || table.table_number}
                    onClick={() => handleTableSelect(table.table_number)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 transition-colors text-sm font-semibold ${selectedTable === table.table_number
                      ? "border-[#5655eb] bg-[#5655eb] text-white"
                      : "border-gray-200 bg-white text-gray-900 hover:border-[#5655eb]/50 hover:bg-gray-50"
                      }`}
                    title={table.capacity ? `${table.table_number} • ${table.capacity} seats` : table.table_number}
                  >
                    {table.table_number || table.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FaTable className="text-gray-300 text-5xl mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tables Found</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {searchTable
                    ? "Try a different search term"
                    : "No occupied tables found. Create an order for a table first to generate a bill."}
                </p>
                {!searchTable && (
                  <Link
                    href="/restaurant/tables"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                  >
                    <FaPlus />
                    Add Tables
                  </Link>
                )}
              </div>
            )}

            {/* Selected Table Info */}
            {selectedTable && (
              <div className="mt-6 p-4 bg-gradient-to-r from-[#5655eb]/10 to-[#4338ca]/10 rounded-lg border border-[#5655eb]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#5655eb] flex items-center justify-center">
                      <FaTable className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Table: {selectedTable}</div>
                      {orderData && (
                        <div className="text-sm text-gray-600 mt-0.5">
                          Order: {orderData.order_token || 'N/A'} • Total: ₹{orderData.total_amount?.toFixed(2) || '0.00'}
                        </div>
                      )}
                      {existingBill?.id && (
                        <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                          <span>
                            Bill already generated: {existingBill.invoice_number || `#${existingBill.id}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => router.push(`/restaurant/billing/view/${existingBill.id}`)}
                            className="underline underline-offset-2 hover:text-amber-900"
                          >
                            View
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {orderData && (
                    <FaCheckCircle className="text-green-500 text-xl" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order Token Input (Alternative) */}
          {!tokenParam && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#5655eb] to-[#4338ca] flex items-center justify-center">
                  <FaReceipt className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Or Enter Order Token</h2>
                  <p className="text-xs text-gray-500">Load order by token directly</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Enter order token (e.g., ORD-T-03-MKAR4140-8JT9)"
                  className="w-full sm:flex-1 min-w-0 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb] transition-all"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const token = e.target.value.trim();
                      if (token) {
                        fetchOrderByToken(token);
                      }
                    }
                  }}
                />
                <button
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="order token"]');
                    if (input && input.value.trim()) {
                      fetchOrderByToken(input.value.trim());
                    }
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white rounded-lg hover:shadow-lg transition-all font-medium whitespace-nowrap"
                >
                  Load Order
                </button>
              </div>
            </div>
          )}

          {/* Order Summary (removed) */}
          {false && orderData && (
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Order Token:</span>
                  <span className="font-semibold text-gray-900 text-right">
                    {orderData.orders_count > 1 ? (
                      <span className="inline-flex flex-wrap justify-end gap-1.5">
                        {(orderData.order_tokens || []).slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded-full text-gray-800"
                          >
                            {t}
                          </span>
                        ))}
                        {(orderData.order_tokens || []).length > 4 && (
                          <span className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded-full text-gray-600">
                            +{(orderData.order_tokens || []).length - 4} more
                          </span>
                        )}
                      </span>
                    ) : (
                      orderData.order_token
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Table:</span>
                  <span className="font-semibold text-gray-900">{orderData.table_number || selectedTable}</span>
                </div>
                {orderData.items && orderData.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-semibold text-gray-700 mb-3">
                      Items ({orderData.items.length}) {orderData.orders_count > 1 ? `• Orders: ${orderData.orders_count}` : ""}
                    </div>
                    <div className="space-y-2">
                      {orderData.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-700">
                            {item.item_name || item.name || item.menu_item_name} × {item.quantity}
                          </span>
                          <span className="font-medium text-gray-900">
                            ₹{((item.price_per_unit || item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-3 border-t-2 border-gray-200 flex justify-between font-bold text-lg">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-[#5655eb]">
                    ₹{Number.isFinite(billTotals.total_amount) ? billTotals.total_amount.toFixed(2) : (orderData.total_amount?.toFixed(2) || totalParam || "0.00")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Billing Generation Section */}
          {shopDetails && orderData && (
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#5655eb] to-[#4338ca] flex items-center justify-center">
                  <FaReceipt className="text-white text-lg" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Ready to Generate Bill</h2>
                  <p className="text-xs text-gray-500">Review details and generate bill</p>
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="bg-gradient-to-r from-[#5655eb]/5 to-[#4338ca]/5 rounded-lg p-4 mb-5 border border-[#5655eb]/20">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Order Token</div>
                    <div className="font-semibold text-gray-900">
                      {orderData.orders_count > 1 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(orderData.order_tokens || []).slice(0, 6).map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded-full text-gray-800"
                            >
                              {t}
                            </span>
                          ))}
                          {(orderData.order_tokens || []).length > 6 && (
                            <span className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded-full text-gray-600">
                              +{(orderData.order_tokens || []).length - 6} more
                            </span>
                          )}
                        </div>
                      ) : (
                        orderData.order_token
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Table Number</div>
                    <div className="font-semibold text-gray-900">{orderData.table_number || selectedTable}</div>
                  </div>
                   <div className="col-span-2">
                    <div className="text-sm text-gray-600 mb-1">Customer Name</div>
                    <input
                      value={customerName}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
                        if (cleaned === ' ' || (cleaned.trim() === '' && cleaned.length > 0)) {
                          setCustomerName('');
                        } else {
                          setCustomerName(cleaned);
                        }
                      }}
                      maxLength={50}
                      placeholder="Enter customer name..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600 mb-1">Customer Mobile (India)</div>
                    <input
                      value={customerPhone}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "");
                        setCustomerPhone(cleaned);
                      }}
                      placeholder="10-digit mobile number (e.g. 9876543210)"
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600 mb-1">Notes (Optional)</div>
                    <textarea
                      value={customerNotes}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[.]/g, "");
                        if (cleaned === ' ' || (cleaned.trim() === '' && cleaned.length > 0)) {
                          setCustomerNotes('');
                        } else {
                          setCustomerNotes(cleaned);
                        }
                      }}
                      maxLength={200}
                      placeholder="Special instructions or notes"
                      rows="2"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb] resize-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600 mb-1">Discount (%)</div>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      placeholder="Enter discount percentage..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#5655eb] focus:border-[#5655eb]"
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Bill Number</div>
                    <div className="font-semibold text-gray-900">{invoiceNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                    <div className="font-semibold text-[#5655eb] text-lg">
                      ₹{payableTotal.toFixed(2)}
                    </div>
                     {itemsSubtotal > 0 ? (
                      <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span>Items ({orderData?.items?.length || 0}):</span>
                          <span className="font-semibold text-gray-800">₹{itemsSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Tax ({TAX_PCT}%):</span>
                          <span className="font-semibold text-gray-800">₹{itemsTax.toFixed(2)}</span>
                        </div>
                        {discount > 0 ? (
                          <div className="flex items-center justify-between text-red-600">
                            <span>Discount ({discount}%):</span>
                            <span className="font-semibold">-₹{discountAmount.toFixed(2)}</span>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                          <span>Total:</span>
                          <span className="font-bold text-gray-900">₹{payableTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    ) : (
                      discount > 0 ? (
                        <div className="mt-1 text-xs text-gray-600 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span>Base Total:</span>
                            <span className="font-semibold text-gray-800">₹{(payableTotal + discountAmount).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-red-600">
                            <span>Discount ({discount}%):</span>
                            <span className="font-semibold">-₹{discountAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                            <span>Total:</span>
                            <span className="font-bold text-gray-900">₹{payableTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>

                {orderData.items && orderData.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Items ({orderData.items.length}) {orderData.orders_count > 1 ? `• Orders: ${orderData.orders_count}` : ""}
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {orderData.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm bg-white/50 p-2 rounded">
                          <span>{item.item_name || item.name || item.menu_item_name} × {item.quantity}</span>
                          <span className="font-medium">
                            ₹{((item.price_per_unit || item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="mb-5">
                <div className="text-sm font-semibold text-gray-900 mb-2">Payment Method</div>
                <div className="inline-flex flex-wrap gap-2">
                  {["Cash", "UPI", "Card"].map((m) => {
                    const active = paymentMethod === m;
                    const disabled = m === "UPI" && !isUpiConfigured;
                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={disabled}
                        onClick={() => handlePaymentMethodSelect(m)}
                        aria-pressed={active}
                        title={disabled ? "UPI not configured" : undefined}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${active
                          ? "border-[#5655eb] bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white shadow-sm"
                          : disabled
                            ? "border-gray-200 bg-white text-gray-400"
                            : "border-gray-200 bg-white text-gray-800 hover:border-[#5655eb]/50"
                          }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateBill}
                  disabled={!orderData || isGeneratingBill}
                  className="flex-1 px-3 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#5655eb] to-[#4338ca] text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base leading-tight"
                >
                  {isGeneratingBill ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                  {existingBill?.id ? (
                    <>
                      <span className="hidden sm:inline">View Bill</span>
                      <span className="sm:hidden">View</span>
                    </>
                  ) : isGeneratingBill ? (
                    <>
                      <span className="hidden sm:inline">Generating...</span>
                      <span className="sm:hidden">Generating</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Generate Bill Now</span>
                      <span className="sm:hidden">Generate</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setOrderData(null);
                    setBillOrders([]);
                    setSelectedTable("");
                    router.push('/restaurant/billing/add');
                  }}
                  className="flex-1 px-3 sm:px-6 py-2.5 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm sm:text-base leading-tight"
                >
                  <span className="hidden sm:inline">Clear & Start Over</span>
                  <span className="sm:hidden">Clear</span>
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {shopDetails && !orderData && !loadingTables && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#5655eb]/10 to-[#4338ca]/10 flex items-center justify-center">
                <FaTable className="text-[#5655eb] text-3xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Table or Enter Order Token</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Choose a table above or enter an order token to load order data and generate the bill
              </p>
              <p className="text-sm text-gray-500">
                💡 Tip: Use the floating billing button (bottom right corner) to quickly generate bills from any restaurant page
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
