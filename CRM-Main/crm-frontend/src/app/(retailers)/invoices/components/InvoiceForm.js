"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
// ItemRow removed (used in InvoiceItems)
import QuickCalculation from "@/app/(retailers)/invoices/components/QuickCalculation";
import { CheckCircle, FolderOpen, SaveIcon, RefreshCw, Clock, FileText, X, Scan, Camera, Plus, ChevronDown } from "lucide-react";
import BarcodeCameraScanner from "@/components/BarcodeCameraScanner";
import BackButton from "@/components/BackButton";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useShop } from "@/context/ShopContext";
// Combobox removed (used in BillingInfo)
import ShopInformation from "@/app/(retailers)/invoices/components/ShopInformation";
import BillingInfo from "@/app/(retailers)/invoices/components/BillingInfo";
import InvoiceItems from "@/app/(retailers)/invoices/components/InvoiceItems";
import InvoiceAccordion from "@/app/(retailers)/invoices/components/InvoiceAccordion";
import Loader from "@/components/Loader";

export default function InvoiceForm({
  shopDetails,
  invoiceNumber,
  invoiceData,
  isEdit = false,
  isDraftEdit = false,
  draftId = null,
}) {
  const { currentShop } = useShop();
  const API_BASE = `${process.env.NEXT_PUBLIC_API_URL}`;

  const [merchantUpi, setMerchantUpi] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [previousInvoices, setPreviousInvoices] = useState([]);
  const [loadingPreviousInvoices, setLoadingPreviousInvoices] = useState(false);
  const [showPreviousInvoices, setShowPreviousInvoices] = useState(false);
  const [draftInvoices, setDraftInvoices] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState(draftId || null);
  const [isCurrentlyDraftEdit, setIsCurrentlyDraftEdit] = useState(isDraftEdit || false);

  useEffect(() => {
    setCurrentDraftId(draftId);
    setIsCurrentlyDraftEdit(isDraftEdit);
  }, [draftId, isDraftEdit]);

  // ✅ CONFIG STATE: Holds the dynamic settings
  const [config, setConfig] = useState({
    priceLabel: "Price per unit",
    enableBuyBack: false,
    makingChargesLabel: "Making Charges",
    enableBarcodeScanner: false, // ✅ Default to false as requested
  });

  const [items, setItems] = useState([
    {
      id: 1,
      item_id: "",
      item_name: "",
      unit_id: "",
      unit_name: "",
      unit_symbol: "",
      quantity: "",
      quantity_kg: "",
      quantity_g: "",
      price_per_unit: "",
      item_total: 0,
    },
  ]);

  const [formData, setFormData] = useState({
    invoice_number: invoiceNumber || "",
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    customer_gst: "",
    invoice_date: new Date().toISOString().split("T")[0],
    tax: 0,
    discount: 0,
    discount_type: "percentage",
    payment_method: "Cash",
    payment_status: "Paid",
    interest_rate: 0,
    emi_months: 3,
    amount_paid: 0,
    payment_type: "Full", // ✅ New state to track nature independently
    show_emi_details: true, // ✅ Toggle for "hide conflicting entry"
    exchange: "false",
    buyback: "false",
    making_charges: 0,
  });

  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [interestAmount, setInterestAmount] = useState(0);

  const [showQRModal, setShowQRModal] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [buybackOpen, setBuybackOpen] = useState(false);
  const [discountTypeOpen, setDiscountTypeOpen] = useState(false);
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false);
  
  // --- BARCODE SCANNING STATE ---
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [barcodeError, setBarcodeError] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const isProcessingScan = useRef(false);
  
  const router = useRouter();

  // Fetch draft invoices
  const fetchDraftInvoices = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      setLoadingDrafts(true);
      const response = await fetch(`${API_BASE}/api/draft-invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success && result.drafts) {
        setDraftInvoices(result.drafts);
      } else if (result.success && result.data) {
        // Handle different response structure
        setDraftInvoices(result.data);
      }
    } catch (error) {
      console.error("Error fetching draft invoices", error);
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  // --- 0. SET LOGO URL ON MOUNT ---
  useEffect(() => {
    const path = shopDetails?.logo_path || shopDetails?.logo;
    if (path) {
      if (path.startsWith("http")) {
        setLogoUrl(path);
      } else {
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        setLogoUrl(`${API_BASE}${cleanPath}?t=${Date.now()}`);
      }
    }
  }, [shopDetails]);

  // Handle ESC key press and body-scroll locking to close modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        setShowQRModal(false);
        setShowDraftModal(false);
        setShowCameraScanner(false);
      }
    };
    if (showQRModal || showDraftModal || showCameraScanner) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showQRModal, showDraftModal, showCameraScanner]);

  // --- 1. FETCH INITIAL DATA & SETTINGS ---
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        // A. Fetch Settings (Crucial for Label & Toggles)
        const settingsRes = await fetch(`${API_BASE}/api/settings/invoice`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const settingsData = await settingsRes.json();

        if (settingsData.success) {
          const s = settingsData.data;
          // ✅ Update Config based on API
          setConfig({
            priceLabel: s.price_column_label || "Price per unit",
            enableBuyBack: s.enable_buyback_exchange || false,
            makingChargesLabel: s.making_charges_label || "Making Charges",
            enableBarcodeScanner: s.enable_barcode_scanner || false, // ✅ Load from API
          });

          // Set default tax only if creating new
          if (!isEdit && !isDraftEdit) {
            setFormData((prev) => ({ ...prev, tax: s.default_tax || 0 }));
          }
        }

        // B. Fetch Next Invoice Number (Only for Create)
        if (!isEdit && !isDraftEdit) {
          const numRes = await fetch(`${API_BASE}/api/invoices/next-number`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const numData = await numRes.json();
          if (numData.success) {
            setFormData((prev) => ({
              ...prev,
              invoice_number: numData.nextNumber,
            }));
          }
        }

        // C. Fetch User (UPI)
        const userRes = await fetch(`${API_BASE}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();
        if (userData.success && userData.data.upiId) {
          setMerchantUpi(userData.data.upiId);
        }

        // D. Fetch Draft Invoices (Only for Create mode)
        if (!isEdit && !isDraftEdit) {
          fetchDraftInvoices();
        }
      } catch (error) {
        console.error("Failed to load initial data", error);
      }
    };

    fetchInitialData();
  }, [isEdit, isDraftEdit, fetchDraftInvoices]);

  // Fetch previous invoices for a customer
  const fetchPreviousInvoices = useCallback(async (customerName) => {
    if (!customerName || customerName.trim() === "") {
      setPreviousInvoices([]);
      return;
    }

    setLoadingPreviousInvoices(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_BASE}/api/invoices?customer_name=${encodeURIComponent(
          customerName
        )}&limit=10&sortBy=newest`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();
      if (result.success && result.invoices) {
        setPreviousInvoices(result.invoices);
        if (result.invoices.length > 0) {
          setShowPreviousInvoices(true);
        }
      }
    } catch (error) {
      console.error("Error fetching previous invoices", error);
    } finally {
      setLoadingPreviousInvoices(false);
    }
  }, []);

  // --- CUSTOMER SEARCH ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (customerQuery.length < 2) {
        setCustomerSuggestions([]);
        return;
      }

      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(
          `${API_BASE}/api/invoices/search-customers?query=${encodeURIComponent(
            customerQuery
          )}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const result = await response.json();
        if (result.success) {
          setCustomerSuggestions(result.data);
        }
      } catch (error) {
        console.error("Error searching customers", error);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [customerQuery]);

  // --- FETCH PREVIOUS INVOICES WHEN CUSTOMER NAME CHANGES ---
  useEffect(() => {
    if (
      !isEdit &&
      formData.customer_name &&
      formData.customer_name.trim() !== ""
    ) {
      const delayFn = setTimeout(() => {
        fetchPreviousInvoices(formData.customer_name);
      }, 500);
      return () => clearTimeout(delayFn);
    } else {
      setPreviousInvoices([]);
      setShowPreviousInvoices(false);
    }
  }, [formData.customer_name, isEdit, fetchPreviousInvoices]);

  const handleCustomerSelect = (customer) => {
    if (!customer) return;

    setFormData((prev) => ({
      ...prev,
      customer_name: customer.customer_name,
      customer_phone: customer.customer_phone || "",
      customer_address: customer.customer_address || "",
      customer_gst: customer.customer_gst || "",
    }));
    setCustomerQuery(customer.customer_name);

    // Fetch previous invoices for this customer
    if (customer.customer_name && !isEdit) {
      fetchPreviousInvoices(customer.customer_name);
    }
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (savingDraft || isSubmitting) return;
    if (!validateForm()) {
      toast.error("Please fix the validation errors before saving draft.");
      return;
    }

    const validItems = items.filter(
      (item) => item.item_name && item.quantity && item.price_per_unit
    );

    const customerNameToSave =
      formData.customer_name || getDisplayCustomerName();

    const draftPayload = {
      // include invoice number when saving/updating a draft
      invoice_number: formData.invoice_number || invoiceNumber || null,
      customer_name: customerNameToSave,
      customer_phone: formData.customer_phone || "",
      customer_address: formData.customer_address || "",
      customer_gst: formData.customer_gst || "",
      invoice_date: formData.invoice_date,
      tax: parseFloat(formData.tax) || 0,
      discount: parseFloat(formData.discount) || 0,
      discount_type: formData.discount_type || "percentage",
      discount_amount: parseFloat(discountAmount) || 0,
      making_charges: parseFloat(formData.making_charges) || 0,
      payment_method: formData.payment_method || "Cash",
      items: validItems.map((item) => ({
        item_id: item.item_id || null,
        item_name: item.item_name,
        unit_id: item.unit_id || null,
        unit_name: item.unit_name || "",
        unit_symbol: item.unit_symbol || "",
        quantity: parseFloat(item.quantity) || 0,
        price_per_unit: parseFloat(item.price_per_unit) || 0,
        item_total: parseFloat(item.item_total) || 0,
      })),
      subtotal: subtotal || 0,
      tax_amount: taxAmount || 0,
      total: total || 0,
      payment_status: formData.payment_status || "Paid",
      interest_percentage: parseFloat(formData.interest_rate) || 0,
      interest_amount: interestAmount || 0,
      emi_months: parseInt(formData.emi_months) || 0,
      amount_paid:
        formData.payment_method === "Advanced"
          ? parseFloat(formData.amount_paid) || 0
          : 0,
      exchange: formData.exchange === "true" || formData.exchange === true,
      buyback: formData.buyback === "true" || formData.buyback === true,
      notes: "Draft invoice for customer",
    };

    setSavingDraft(true);

    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");

      // If editing a draft, use PUT endpoint
      const url =
        isCurrentlyDraftEdit && currentDraftId
          ? `${API_BASE}/api/draft-invoices/update-draft/${currentDraftId}`
          : `${API_BASE}/api/draft-invoices/save-draft`;
      const method = isCurrentlyDraftEdit && currentDraftId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(draftPayload),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          isCurrentlyDraftEdit
            ? "Draft updated successfully!"
            : "Draft saved successfully! You can continue editing or load it later from drafts."
        );
        
        // Update local states so subsequent clicks update this draft
        if (result.success && result.data && result.data.id) {
          setCurrentDraftId(result.data.id);
          setIsCurrentlyDraftEdit(true);
        }

        // Refresh draft list if not editing
        if (!isCurrentlyDraftEdit) {
          fetchDraftInvoices();
        } else {
          // If editing draft, optionally redirect back to drafts page after a delay
          // User can continue editing if they want
        }
        // Keep the form data so user can continue editing
      } else {
        throw new Error(result.error || "Failed to save draft");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Error saving draft: " + error.message);
    } finally {
      setSavingDraft(false);
    }
  };

  // Load draft invoice to continue editing (used by draft list)
  const loadDraftInvoice = async (draftId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_BASE}/api/draft-invoices/get-draft-by/${draftId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();

      if (result.success && result.data) {
        const draft = result.data;

        setCurrentDraftId(draftId);
        setIsCurrentlyDraftEdit(true);

        // Load draft data into form
        setFormData((prev) => ({
          ...prev,
          invoice_number: draft.invoice_number || prev.invoice_number,
          invoice_date: draft.invoice_date
            ? new Date(draft.invoice_date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          customer_name: draft.customer_name || "",
          customer_phone: draft.customer_phone || "",
          customer_address: draft.customer_address || "",
          customer_gst: draft.customer_gst || "",
          tax: draft.tax || draft.tax_percentage || prev.tax,
          discount: draft.discount || 0,
          discount_type: draft.discount_type || "percentage",
          payment_method: draft.payment_method || "Cash",
          payment_status: draft.payment_status || "Paid",
          making_charges: draft.making_charges || 0,
          interest_rate: draft.interest_percentage || 0,
          emi_months: draft.emi_months || 0,
          amount_paid: draft.amount_paid || 0,
          exchange: draft.exchange ? "true" : "false",
          buyback: draft.buyback ? "true" : "false",
        }));

        // Load items from any known property
        const sourceItems =
          draft.items || draft.invoice_items || draft.draft_items || [];
        if (sourceItems.length > 0) {
          const formattedItems = sourceItems.map((item, index) => ({
            id: index + 1,
            item_id: item.item_id || "",
            item_name: item.item_name || "",
            unit_id: item.unit_id || "",
            unit_name: item.unit_name || "",
            unit_symbol: item.unit_symbol || "",
            quantity: item.quantity || "",
            quantity_kg: item.quantity_kg || item.quantity || "",
            quantity_g:
              item.quantity_g ||
              (item.quantity
                ? (parseFloat(item.quantity) * 1000).toString()
                : ""),
            price_per_unit: item.price_per_unit || "",
            item_total: item.item_total || 0,
          }));
          setItems(formattedItems);
        } else {
          setItems([
            {
              id: 1,
              item_id: "",
              item_name: "",
              unit_id: "",
              unit_name: "",
              unit_symbol: "",
              quantity: "",
              quantity_kg: "",
              quantity_g: "",
              price_per_unit: "",
              item_total: 0,
            },
          ]);
        }

        setShowDraftModal(false);
        toast.success("Draft invoice loaded! Continue editing.");
      }
    } catch (error) {
      console.error("Error loading draft invoice", error);
      toast.error("Failed to load draft invoice");
    }
  };

  // Load previous invoice data to continue
  const loadPreviousInvoice = async (invoiceId) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE}/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result.success && result.data) {
        const invoice = result.data;

        // Fetch new invoice number for the new invoice
        let newInvoiceNumber = formData.invoice_number;
        try {
          const numResponse = await fetch(
            `${API_BASE}/api/invoices/next-number`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const numData = await numResponse.json();
          if (numData.success && numData.nextNumber) {
            newInvoiceNumber = numData.nextNumber;
          }
        } catch (err) {
          console.warn("Failed to get new invoice number, keeping current");
        }

        // Load invoice data into form (with new invoice number and today's date)
        setFormData((prev) => ({
          ...prev,
          invoice_number: newInvoiceNumber,
          invoice_date: new Date().toISOString().split("T")[0], // Today's date
          customer_name: invoice.customer_name || prev.customer_name,
          customer_phone: invoice.customer_phone || prev.customer_phone,
          customer_address: invoice.customer_address || prev.customer_address,
          customer_gst: invoice.customer_gst || prev.customer_gst,
          tax: invoice.tax_percentage || invoice.tax || prev.tax,
          discount: invoice.discount || 0,
          discount_type: invoice.discount_type || "percentage",
          payment_method: invoice.payment_method || "Cash",
          payment_status: invoice.payment_status || "Paid",
          making_charges: invoice.making_charges || 0,
        }));

        // Load items from previous invoice
        if (invoice.items && invoice.items.length > 0) {
          const formattedItems = invoice.items.map((item, index) => ({
            id: index + 1,
            item_id: item.item_id || "",
            item_name: item.item_name || "",
            unit_id: item.unit_id || "",
            unit_name: item.unit_name || "",
            unit_symbol: item.unit_symbol || "",
            quantity: item.quantity || "",
            quantity_kg: item.quantity_kg || "",
            quantity_g: item.quantity_g || "",
            price_per_unit: item.price_per_unit || "",
            item_total: item.item_total || 0,
          }));
          setItems(formattedItems);
        } else if (invoice.invoice_items && invoice.invoice_items.length > 0) {
          // Handle different API response structure
          const formattedItems = invoice.invoice_items.map((item, index) => ({
            id: index + 1,
            item_id: item.item_id || "",
            item_name: item.item_name || "",
            unit_id: item.unit_id || "",
            unit_name: item.unit_name || "",
            unit_symbol: item.unit_symbol || "",
            quantity: item.quantity || "",
            quantity_kg: item.quantity_kg || "",
            quantity_g: item.quantity_g || "",
            price_per_unit: item.price_per_unit || "",
            item_total: item.item_total || 0,
          }));
          setItems(formattedItems);
        }

        setShowPreviousInvoices(false);
        toast.success(
          "Previous invoice loaded! You can now continue editing with a new invoice number."
        );
      }
    } catch (error) {
      console.error("Error loading previous invoice", error);
      toast.error("Failed to load previous invoice");
    }
  };

  const getDisplayCustomerName = () => {
    if (formData.customer_name && formData.customer_name.trim() !== "") {
      return formData.customer_name;
    }
    const shopName = shopDetails?.shop_name || "Shop";
    return `${shopName}'s Customer`;
  };

  // --- BARCODE HANDLER ---
  const handleBarcodeScan = useCallback(async (code) => {
    if (!code || isProcessingScan.current) return;
    
    try {
      isProcessingScan.current = true;
      console.log("Processing Barcode:", code);

      const token = localStorage.getItem("authToken");
      setBarcodeError(false);
      const response = await fetch(`${API_BASE}/api/products/barcode/${code}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();

      if (result.success) {
        const product = result.data;
        const isCombo = result.type === 'combo';
        
        console.log("Product Found by Barcode:", product);
        toast.success(`Found: ${product.item_name || product.name}`);

        // Prepare new item data
        const newItemData = {
          item_id: isCombo ? null : product.id,
          combo_id: isCombo ? product.id : null,
          item_name: product.item_name || product.name,
          unit_id: product.unit?.id || product.default_unit_id || 1, // Use 1 as fallback to prevent NaN
          unit_name: product.unit?.name || "Unit",
          unit_symbol: product.unit?.symbol || "unit",
          quantity: "1",
          price_per_unit: product.selling_price || product.price || 0,
          item_total: product.selling_price || product.price || 0,
        };

        setItems(prevItems => {
          // 1. Check if item already exists in the list to increment quantity
          const existingItemIndex = prevItems.findIndex(i => 
            (isCombo && i.combo_id === product.id) || (!isCombo && i.item_id === product.id)
          );

          if (existingItemIndex !== -1) {
            const updated = [...prevItems];
            const item = updated[existingItemIndex];
            const currentQty = parseFloat(item.quantity) || 0;
            const newQty = currentQty + 1;
            const price = parseFloat(item.price_per_unit) || 0;
            
            updated[existingItemIndex] = {
              ...item,
              quantity: newQty.toString(),
              item_total: newQty * price
            };
            
            toast.success(`Updated ${product.item_name || product.name} quantity to ${newQty}`);
            return updated;
          }

          // 2. Not in list: Find first empty row (one without an item_id)
          const emptyRowIndex = prevItems.findIndex(i => !i.item_id);
          
          if (emptyRowIndex !== -1) {
            const updated = [...prevItems];
            updated[emptyRowIndex] = { 
              ...updated[emptyRowIndex], 
              ...newItemData,
            };
            
            // If we filled the last row, add a new empty one
            if (emptyRowIndex === prevItems.length - 1) {
              return [...updated, {
                id: Date.now(),
                item_id: "",
                item_name: "",
                unit_id: "",
                unit_name: "",
                unit_symbol: "",
                quantity: "",
                price_per_unit: "",
                item_total: 0
              }];
            }
            return updated;
          } else {
            // No empty row, append to end
            return [...prevItems, { 
              id: Date.now(), 
              ...newItemData 
            }, {
              id: Date.now() + 1,
              item_id: "",
              item_name: "",
              unit_id: "",
              unit_name: "",
              unit_symbol: "",
              quantity: "",
              price_per_unit: "",
              item_total: 0
            }];
          }
        });
        
        // ✅ CRITICAL: Auto-close camera after success and reset the lock
        setShowCameraScanner(false);
      } else {
        setBarcodeError(true);
        toast.error("Barcode Not Found: " + code);
      }
    } catch (error) {
      console.error("Barcode lookup error:", error);
      toast.error("Failed to lookup barcode");
    } finally {
      setScannedBarcode("");
      // Release lock with small delay to prevent immediate re-triggers while closing
      setTimeout(() => {
        isProcessingScan.current = false;
      }, 500);
    }
  }, [API_BASE]);

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (scannedBarcode.trim()) {
      handleBarcodeScan(scannedBarcode.trim());
    }
  };

  // --- AUTO-PROCESS BARCODE ON TYPE/PASTE ---
  useEffect(() => {
    if (!scannedBarcode || scannedBarcode.trim() === "") return;

    // Debounce to allow typing, but also works for rapid scanning/pasting
    const timeoutId = setTimeout(() => {
      if (scannedBarcode.trim().length >= 3 && !isProcessingScan.current) {
        handleBarcodeScan(scannedBarcode.trim());
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [scannedBarcode, handleBarcodeScan]);

  // --- INITIALIZE EDIT ---
  useEffect(() => {
    if (isEdit && invoiceData) {
      const discountAmountValue = parseFloat(invoiceData.discount_amount) || 0;

      const shopName = shopDetails?.shop_name || "Shop";
      const defaultCustomerPattern = `${shopName}'s Customer`;
      let customerName = invoiceData.customer_name || "";

      if (customerName === defaultCustomerPattern) {
        customerName = "";
      }

      setCustomerQuery(customerName);

      const isEMI = invoiceData.payment_method === "EMI" || (invoiceData.emi_months && parseInt(invoiceData.emi_months) > 0);
      const isAdvanced = invoiceData.payment_method === "Advanced" || (parseFloat(invoiceData.amount_paid) > 0 && parseFloat(invoiceData.balance_due) > 0);
      const derivedPaymentType = isEMI ? "EMI" : (isAdvanced ? "Advanced" : "Full");

      setFormData({
        invoice_number: invoiceData.invoice_number || "",
        customer_name: customerName,
        customer_phone: invoiceData.customer_phone || "",
        customer_address: invoiceData.customer_address || "",
        customer_gst: invoiceData.customer_gst || "",
        invoice_date:
          invoiceData.invoice_date || new Date().toISOString().split("T")[0],
        tax: invoiceData.tax_percentage || invoiceData.tax || 0,
        discount: invoiceData.discount || 0,
        discount_type: invoiceData.discount_type || "percentage",
        payment_method: invoiceData.payment_method || "Cash",
        payment_status: invoiceData.payment_status || "Paid",
        interest_rate: invoiceData.interest_percentage || 0,
        emi_months: invoiceData.emi_months || 0,
        amount_paid: invoiceData.amount_paid || 0,
        exchange: invoiceData.exchange ? "true" : "false",
        buyback: invoiceData.buyback ? "true" : "false",
        making_charges: invoiceData.making_charges || 0,
        payment_type: derivedPaymentType,
      });

      const initialItems =
        invoiceData.items ||
        invoiceData.draft_items ||
        invoiceData.invoice_items ||
        [];
      setItems(initialItems.length > 0 ? initialItems : items);
      setSubtotal(parseFloat(invoiceData.subtotal) || 0);
      setTaxAmount(parseFloat(invoiceData.tax_amount) || 0);
      setTotal(parseFloat(invoiceData.total) || 0);
      setDiscountAmount(discountAmountValue);
      setInterestAmount(parseFloat(invoiceData.interest_amount) || 0);
    }
  }, [isEdit, isDraftEdit, invoiceData, shopDetails]);

  // --- ITEM HANDLERS ---
  useEffect(() => {
    recalculateTotals(items);
  }, [items]);

  const addItem = (initialData = null) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next.items;
      return next;
    });
    setItems((prevItems) => {
      // ✅ FIX: Prevent adding duplicate empty rows
      if (!initialData && prevItems.length > 0) {
        const lastItem = prevItems[prevItems.length - 1];
        if (!lastItem.item_id && !lastItem.item_name) {
          return prevItems;
        }
      }

      const newId =
        prevItems.length > 0 ? Math.max(...prevItems.map((item) => item.id)) + 1 : 1;
      return [
        ...prevItems,
        {
          id: newId,
          item_id: initialData?.item_id || "",
          item_name: initialData?.item_name || "",
          unit_id: initialData?.unit_id || "",
          unit_name: initialData?.unit_name || "",
          unit_symbol: initialData?.unit_symbol || "",
          quantity: initialData?.quantity || "",
          quantity_kg: initialData?.quantity_kg || initialData?.quantity || "",
          quantity_g: initialData?.quantity_g || (initialData?.quantity ? (parseFloat(initialData.quantity) * 1000).toString() : ""),
          price_per_unit: initialData?.price_per_unit || "",
          item_total: initialData?.item_total || 0,
        },
      ];
    });
  };

  const removeItem = (id) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next.items;
      return next;
    });
    setItems((prevItems) => {
      if (prevItems.length > 1) {
        return prevItems.filter((item) => item.id !== id);
      } else {
        return [
          {
            id: prevItems[0].id,
            item_id: "",
            item_name: "",
            unit_id: "",
            unit_name: "",
            unit_symbol: "",
            quantity: "",
            quantity_kg: "",
            quantity_g: "",
            price_per_unit: "",
            item_total: 0,
          },
        ];
      }
    });
  };

  const updateItem = (id, data) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next.items;
      return next;
    });
    // DEBUG: Trace item updates
    console.log(`🔄 InvoiceForm updateItem id=${id}`, data);

    setItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item.id === id ? { ...item, ...data } : item
      );

      // Check if we need to add a new row
      const currentItem = updatedItems.find((item) => item.id === id);
      const isLastRow = id === updatedItems[updatedItems.length - 1].id;
      const hasValidData =
        currentItem &&
        currentItem.item_name &&
        currentItem.quantity &&
        currentItem.price_per_unit;

      if (isLastRow && hasValidData) {
        setTimeout(() => {
          addItem();
        }, 0);
      }

      return updatedItems;
    });
  };

  // --- TOTAL CALCULATION ---
  const recalculateTotals = useCallback(
    (itemsArray) => {
      console.log("🧮 recalculateTotals items:", itemsArray);
      const newSubtotal = itemsArray.reduce((sum, item) => {
        const itemTotal = parseFloat(item.item_total) || 0;
        return sum + itemTotal;
      }, 0);
      console.log("💰 New Subtotal:", newSubtotal);

      const taxRate = parseFloat(formData.tax) || 0;
      const newTaxAmount = (newSubtotal * taxRate) / 100;

      let newDiscountAmount = 0;
      const discountValue = parseFloat(formData.discount) || 0;

      if (formData.discount_type === "percentage") {
        newDiscountAmount = (newSubtotal * discountValue) / 100;
      } else {
        newDiscountAmount = discountValue;
      }

      const maxDiscount = newSubtotal + newTaxAmount;
      if (newDiscountAmount > maxDiscount) {
        newDiscountAmount = maxDiscount;
      }

      const principalAmount = Math.max(
        0,
        newSubtotal + newTaxAmount - newDiscountAmount
      );

      let calculatedInterest = 0;
      if (formData.payment_type === "EMI") {
        const rate = parseFloat(formData.interest_rate) || 0;
        const months = parseInt(formData.emi_months) || 1;
        calculatedInterest = (principalAmount * rate * months) / 100;
      }

      const makingCharges = parseFloat(formData.making_charges) || 0;
      const newTotal = principalAmount + calculatedInterest + makingCharges;

      setSubtotal(newSubtotal);
      setTaxAmount(newTaxAmount);
      setDiscountAmount(newDiscountAmount);
      setInterestAmount(calculatedInterest);
      setTotal(newTotal);
    },
    [
      formData.tax,
      formData.discount,
      formData.discount_type,
      formData.payment_method,
      formData.payment_type,
      formData.interest_rate,
      formData.emi_months,
      formData.making_charges,
    ]
  );

  useEffect(() => {
    recalculateTotals(items);
  }, [
    formData.tax,
    formData.discount,
    formData.discount_type,
    formData.payment_method,
    formData.payment_type,
    formData.interest_rate,
    formData.emi_months,
    formData.making_charges,
    recalculateTotals,
    items,
  ]);

  const handleApplyCalculation = useCallback(
    (calculatedWeight) => {
      if (items.length === 0) {
        toast.error("Please add at least one item to the invoice first");
        return;
      }
      const lastItemIndex = items.length - 1;
      const lastItem = items[lastItemIndex];
      if (!lastItem.item_id || !lastItem.item_name) {
        toast.error("Please select an item in the last row first");
        return;
      }
      const updatedLastItem = {
        ...lastItem,
        quantity: calculatedWeight.toString(),
        quantity_kg: calculatedWeight.toString(),
        quantity_g: (calculatedWeight * 1000).toString(),
      };
      if (lastItem.price_per_unit) {
        const price = parseFloat(lastItem.price_per_unit) || 0;
        updatedLastItem.item_total = calculatedWeight * price;
      }
      const updatedItems = [...items];
      updatedItems[lastItemIndex] = updatedLastItem;
      setItems(updatedItems);
      toast.success(
        `${calculatedWeight.toFixed(3)} kg applied to "${lastItem.item_name}"`
      );
    },
    [items]
  );

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;

    setErrors((prev) => {
      if (prev[name]) {
        const nextErrors = { ...prev };
        delete nextErrors[name];
        return nextErrors;
      }
      return prev;
    });

    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      if (name === "payment_method") {
        const unpaidMethods = ["Advanced", "EMI"];
        if (unpaidMethods.includes(value)) {
          newData.payment_status = "Unpaid";
          newData.payment_type = value; // Sync nature with "Special" methods
        } else {
          // If nature is already Advanced or EMI, keep it. 
          // Otherwise default to Full/Paid for normal methods.
          if (newData.payment_type !== "Advanced" && newData.payment_type !== "EMI") {
            newData.payment_status = "Paid";
            newData.payment_type = "Full";
          }
        }
      }

      // 🔄 AUTO-SELECT CASH FOR ADVANCE
      if (name === "payment_option" && value === "Advanced") {
        newData.payment_method = "Cash"; // Default to Cash, but user can change it
        newData.payment_type = "Advanced";
        newData.payment_status = "Unpaid";
      }
      if (name === "payment_option" && value === "EMI") {
        newData.payment_method = "EMI";
        newData.payment_type = "EMI";
        newData.payment_status = "Unpaid";
      }
      if (name === "payment_option" && value === "Full") {
        newData.payment_method = "Cash";
        newData.payment_type = "Full";
        newData.payment_status = "Paid";
      }

      return newData;
    });
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Validate Invoice Number
    if (!formData.invoice_number || !formData.invoice_number.trim()) {
      newErrors.invoice_number = "Invoice Number is required.";
    }

    // Validate Customer Name
    if (formData.customer_name && formData.customer_name.length > 100) {
      newErrors.customer_name = "Customer name cannot exceed 100 characters";
    }

    // Validate Phone if provided
    const phone = formData.customer_phone ? formData.customer_phone.replace(/\D/g, "") : "";
    if (phone && phone.length !== 10) {
      newErrors.customer_phone = "Enter a valid 10-digit phone number";
    }

    // Validate Customer GST
    if (formData.customer_gst && formData.customer_gst.trim()) {
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.customer_gst.trim().toUpperCase())) {
        newErrors.customer_gst = "Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)";
      }
    }

    // Validate Tax
    if (formData.tax !== undefined && formData.tax !== "") {
      const taxVal = parseFloat(formData.tax);
      if (isNaN(taxVal) || taxVal < 0 || taxVal > 100) {
        newErrors.tax = "Tax percentage must be between 0 and 100";
      }
    }

    // Validate Discount
    if (formData.discount !== undefined && formData.discount !== "") {
      const discVal = parseFloat(formData.discount);
      if (isNaN(discVal) || discVal < 0) {
        newErrors.discount = "Discount must be a positive number";
      } else if (formData.discount_type === "percentage" && discVal > 100) {
        newErrors.discount = "Discount percentage cannot exceed 100";
      } else if (formData.discount_type === "flat" && discVal > subtotal + taxAmount) {
        newErrors.discount = "Discount cannot exceed subtotal + tax";
      }
    }

    // Validate Making Charges
    if (formData.making_charges !== undefined && formData.making_charges !== "") {
      const mcVal = parseFloat(formData.making_charges);
      if (isNaN(mcVal) || mcVal < 0) {
        newErrors.making_charges = "Making charges must be a positive number";
      }
    }

    // Validate EMI details if payment_type is EMI
    if (formData.payment_type === "EMI") {
      const rateVal = parseFloat(formData.interest_rate);
      if (isNaN(rateVal) || rateVal < 0 || rateVal > 100) {
        newErrors.interest_rate = "Interest rate must be between 0% and 100%";
      }
      const monthsVal = parseInt(formData.emi_months);
      if (isNaN(monthsVal) || monthsVal <= 0 || monthsVal > 60) {
        newErrors.emi_months = "EMI months must be between 1 and 60";
      }
    }

    // Validate Advanced Amount
    if (formData.payment_type === "Advanced") {
      const amtPaid = parseFloat(formData.amount_paid);
      if (isNaN(amtPaid) || amtPaid < 0) {
        newErrors.amount_paid = "Amount paid must be a positive number";
      } else if (amtPaid > total) {
        newErrors.amount_paid = "Amount paid cannot exceed the invoice total";
      }
    }

    // Validate Items
    const hasItems = items.some(
      (item) => item.item_name && item.quantity && item.price_per_unit
    );
    if (!hasItems) {
      newErrors.items = "Please add at least one item to the invoice";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [
    formData.invoice_number,
    formData.customer_name,
    formData.customer_phone,
    formData.customer_gst,
    formData.tax,
    formData.discount,
    formData.discount_type,
    formData.making_charges,
    formData.payment_type,
    formData.interest_rate,
    formData.emi_months,
    formData.amount_paid,
    items,
    subtotal,
    taxAmount,
    total,
  ]);

  const generateUPIUrl = () => {
    const upiId = merchantUpi || shopDetails.upi_id;
    const shopName = shopDetails.shop_name || "Your Shop";
    const transactionId = `TXN${Date.now()}`;
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
      shopName
    )}&am=${total.toFixed(
      2
    )}&cu=INR&tid=${transactionId}&tn=Payment for invoice ${formData.invoice_number
      }`;
    return upiUrl;
  };

  const generateQRCode = async () => {
    if (total <= 0) {
      toast.error("Please add items and calculate total amount first");
      return;
    }
    setIsGeneratingQR(true);
    try {
      const upiUrl = generateUPIUrl();
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
      description: `₹${total.toFixed(2)} received for Invoice #${formData.invoice_number
        }.`,
      duration: 3000,
    });
    setFormData((prev) => ({ ...prev, payment_status: "Paid" }));
    setShowQRModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || savingDraft) return;
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    const validItems = items.filter(
      (item) => item.item_name && item.quantity && item.price_per_unit
    );

    // Phone Number Validation (optional, must be exactly 10 digits if provided)
    const phone = formData.customer_phone ? formData.customer_phone.replace(/\D/g, "") : "";
    const normalizedPhone = phone || "";

    const customerNameToSave =
      formData.customer_name || getDisplayCustomerName();

    const invoicePayload = {
      ...formData,
      customer_phone: normalizedPhone,
      customer_name: customerNameToSave,
      items: validItems.map((item) => ({
        item_id: item.item_id || null,
        item_name: item.item_name,
        unit_id: item.unit_id,
        unit_name: item.unit_name || "",
        unit_symbol: item.unit_symbol || "",
        quantity: item.quantity || 0,
        price_per_unit: item.price_per_unit || 0,
        item_total: item.item_total || 0,
      })),
      subtotal: subtotal || 0,
      tax: parseFloat(formData.tax) || 0,
      tax_amount: taxAmount || 0,
      discount: parseFloat(formData.discount) || 0,
      discount_amount: discountAmount || 0,
      making_charges: parseFloat(formData.making_charges) || 0,
      total: total || 0,
      interest_percentage: parseFloat(formData.interest_rate) || 0,
      interest_amount: interestAmount || 0,
      emi_months: parseInt(formData.emi_months) || 0,
      amount_paid:
        formData.payment_method === "Advanced" || formData.payment_type === "Advanced" ? parseFloat(formData.amount_paid) || 0 : 0,
      exchange: formData.exchange === "true" || formData.exchange === true,
      buyback: formData.buyback === "true" || formData.buyback === true,
      shopId: currentShop.id,
    };

    setIsSubmitting(true);

    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const url = isEdit
        ? `${API_BASE}/api/invoices/${invoiceData.id}`
        : `${API_BASE}/api/invoices`;
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invoicePayload),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          isEdit
            ? "Invoice updated successfully!"
            : "Invoice created successfully!"
        );
        if (formData.payment_status === "Unpaid") {
          router.push("/clients");
        } else {
          router.push(`/invoices/${result.data.id}?print=true`);
        }
      } else {
        throw new Error(result.error || "Failed to save invoice");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Error saving invoice: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {showQRModal &&
        typeof window !== "undefined" &&
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
                        <div className="text-4xl mb-2">📱</div>
                        <p className="text-sm text-gray-600">QR Code</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">
                      Scan to Pay via UPI
                    </p>
                    <p className="text-lg font-bold text-green-600 mt-1">
                      ₹{total.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Invoice: {formData.invoice_number}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Scan with any UPI app to pay ₹{total.toFixed(2)}
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
                    <p>Invoice: {formData.invoice_number}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-lg sm:text-x md:text-2xl font-bold text-gray-800">
            {isCurrentlyDraftEdit
              ? "Edit Draft"
              : isEdit
                ? "Edit Invoice"
                : "Create Invoice"}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-hide">
          {!isEdit && !isCurrentlyDraftEdit && draftInvoices.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDraftModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Drafts ({draftInvoices.length})</span>
            </button>
          )}
          <div>
            <BackButton fallbackUrl="/invoices" forceFallback={true} />
          </div>
        </div>
      </div>

      <form 
        onSubmit={handleSubmit} 
        onKeyDown={(e) => {
          // Prevent Enter key from auto-submitting the form (Critical for Barcode Scanning)
          if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            e.preventDefault();
          }
        }}
        className="space-y-4 sm:space-y-6"
      >

        <InvoiceAccordion
          id="shop-info"
          title="Shop Information"
          defaultOpen={false}
        >
          <ShopInformation
            shopDetails={shopDetails}
            logoUrl={logoUrl}
            merchantUpi={merchantUpi}
          />
        </InvoiceAccordion>

        {/* Barcode Scanner Section - Conditionally rendered based on settings */}
        {config.enableBarcodeScanner && (
          <div className={`bg-white rounded-lg shadow-sm border-2 ${barcodeError ? 'border-red-500 bg-red-50/10' : 'border-blue-100'} p-4 sm:p-5 overflow-hidden relative transition-colors duration-300 mb-6`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg text-white shadow-lg animate-pulse">
                    <Scan size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">Smart Barcode Scanner</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Scan, type or paste to add instantly</p>
                  </div>
              </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <input 
                      type="text"
                      value={scannedBarcode}
                      onChange={(e) => {
                          setScannedBarcode(e.target.value);
                          setBarcodeError(false);
                      }}
                      autoFocus
                      autoComplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (scannedBarcode.trim()) {
                            handleBarcodeScan(scannedBarcode.trim());
                          }
                        }
                      }}
                      placeholder="Enter or scan barcode"
                      className="w-full pl-9 pr-10 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
                    />
                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    
                    {/* Manual Add Button for Mobile */}
                    {scannedBarcode.trim() && (
                      <button 
                        type="button"
                        onClick={() => handleBarcodeScan(scannedBarcode.trim())}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-all active:scale-95 animate-in zoom-in-50"
                        title="Add Item"
                      >
                        <Plus size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => setShowCameraScanner(!showCameraScanner)}
                    className={`p-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-xs ${
                      showCameraScanner ? 'bg-red-600 text-white shadow-red-200' : 'bg-gray-900 text-white hover:bg-black shadow-gray-200'
                    } shadow-lg active:scale-95`}
                  >
                    <Camera size={18} />
                    <span className="hidden sm:inline">{showCameraScanner ? 'Stop Camera' : 'Camera Scan'}</span>
                  </button>
              </div>
            </div>

            {/* Camera Scanner Modal-in-place */}
            {showCameraScanner && (
              <div className="mt-4">
                <BarcodeCameraScanner
                  onScanSuccess={(code) => {
                    handleBarcodeScan(code);
                  }}
                  onScanError={(err) => {
                    // Optional debugging
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Invoice Details Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
            Invoice Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleInputChange}
                className={`w-full px-2 sm:px-3 py-1 sm:py-2 border rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base ${
                  errors.invoice_number ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
              />
              {errors.invoice_number && (
                <p className="text-red-500 text-xs mt-1">{errors.invoice_number}</p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Invoice Date*
              </label>
              <input
                type="date"
                name="invoice_date"
                value={formData.invoice_date}
                onChange={handleInputChange}
                max={new Date().toISOString().split("T")[0]}
                required
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
              />
            </div>

            {/* ✅ CONDITIONAL RENDERING: Exchange & BuyBack based on Settings */}
            {config.enableBuyBack && (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Exchange
                  </label>
                  <div className="relative">
                    <select
                      name="exchange"
                      value={formData.exchange}
                      onChange={handleInputChange}
                      onFocus={() => setExchangeOpen(true)}
                      onBlur={() => setExchangeOpen(false)}
                      className="w-full pl-2 pr-8 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base appearance-none cursor-pointer"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${exchangeOpen ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    BuyBack
                  </label>
                  <div className="relative">
                    <select
                      name="buyback"
                      value={formData.buyback}
                      onChange={handleInputChange}
                      onFocus={() => setBuybackOpen(true)}
                      onBlur={() => setBuybackOpen(false)}
                      className="w-full pl-2 pr-8 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base appearance-none cursor-pointer"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${buybackOpen ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Billing Information Section */}
        {/* Billing Information Section */}
        <BillingInfo
          formData={formData}
          errors={errors}
          handleInputChange={handleInputChange}
          handleCustomerSelect={handleCustomerSelect}
          customerQuery={customerQuery}
          setCustomerQuery={setCustomerQuery}
          customerSuggestions={customerSuggestions}
          previousInvoices={previousInvoices}
          showPreviousInvoices={showPreviousInvoices}
          setShowPreviousInvoices={setShowPreviousInvoices}
          loadPreviousInvoice={loadPreviousInvoice}
          loadingPreviousInvoices={loadingPreviousInvoices}
          isEdit={isEdit}
          getDisplayCustomerName={getDisplayCustomerName}
        />

        {/* Items Section */}
        {/* Items Section */}
        <InvoiceItems
          items={items}
          errors={errors}
          addItem={addItem}
          removeItem={removeItem}
          updateItem={updateItem}
          config={config}
        />

        {/* Quick Calculation */}
        {!isEdit && (
          <InvoiceAccordion
            id="quick-weight-calc"
            title="Quick Weight Calculation"
            defaultOpen={false}
          >
            <QuickCalculation onApplyCalculation={handleApplyCalculation} />
          </InvoiceAccordion>
        )}

        {/* Totals Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
            Totals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Subtotal (₹)
              </label>
              <input
                type="number"
                value={subtotal.toFixed(2)}
                readOnly
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md bg-gray-100 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Tax (%)
              </label>
              <input
                type="number"
                name="tax"
                value={formData.tax}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                max="100"
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
              />
              {errors.tax && (
                <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                  {errors.tax}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Discount Type
              </label>
              <div className="relative">
                <select
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleInputChange}
                  onFocus={() => setDiscountTypeOpen(true)}
                  onBlur={() => setDiscountTypeOpen(false)}
                  className="w-full pl-2 pr-8 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base appearance-none cursor-pointer"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${discountTypeOpen ? "rotate-180" : ""}`} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                {formData.discount_type === "percentage"
                  ? "Discount (%)"
                  : "Discount (₹)"}
              </label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                max={
                  formData.discount_type === "percentage" ? "100" : undefined
                }
                placeholder={
                  formData.discount_type === "percentage"
                    ? "Enter %"
                    : "Enter ₹"
                }
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
              />
              {errors.discount && (
                <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                  {errors.discount}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                {config.makingChargesLabel} (₹)
              </label>
              <input
                type="number"
                name="making_charges"
                value={formData.making_charges}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="Enter amount"
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
              />
              {errors.making_charges && (
                <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                  {errors.making_charges}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Total (₹)
              </label>
              <input
                type="number"
                value={total.toFixed(2)}
                readOnly
                className="w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-md bg-gray-100 text-sm sm:text-base font-semibold text-green-600"
              />
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Payment Method
              </label>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    onFocus={() => setPaymentMethodOpen(true)}
                    onBlur={() => setPaymentMethodOpen(false)}
                    className="w-full pl-2 pr-8 py-1 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base appearance-none cursor-pointer"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400">
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${paymentMethodOpen ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* Advanced and EMI Radio Buttons */}
                <div className="mt-2 space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                    Payment Options
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="payment_option"
                        value="Full"
                        checked={formData.payment_type === "Full"}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            payment_type: "Full",
                            payment_method: "Cash",
                            payment_status: "Paid",
                          }));
                        }}
                        className="form-radio text-green-600 h-4 w-4"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Full Payment
                      </span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="payment_option"
                        value="Advanced"
                        checked={formData.payment_type === "Advanced"}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            payment_type: "Advanced",
                            payment_method: "Cash", // ✅ Auto-select Cash when choosing Advanced
                            payment_status: "Unpaid",
                          }));
                        }}
                        className="form-radio text-blue-600 h-4 w-4"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Advanced
                      </span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="payment_option"
                        value="EMI"
                        checked={formData.payment_type === "EMI"}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            payment_type: "EMI",
                            payment_method: "EMI",
                            payment_status: "Unpaid",
                          }));
                        }}
                        className="form-radio text-purple-600 h-4 w-4"
                      />
                      <span className="ml-2 text-sm text-gray-700">EMI</span>
                    </label>
                  </div>
                </div>

                {/* Advanced Amount Input */}
                {formData.payment_type === "Advanced" && (
                  <div className="bg-blue-50 p-3 rounded border border-blue-200 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-blue-800 mb-1">
                      Advanced Amount Received (₹)
                    </label>
                    <input
                      type="number"
                      name="amount_paid"
                      value={formData.amount_paid}
                      onChange={handleInputChange}
                      placeholder="Enter amount paid"
                      className="w-full px-2 py-1 border border-blue-400 rounded focus:ring-blue-500"
                    />
                    {errors.amount_paid && (
                      <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                        {errors.amount_paid}
                      </p>
                    )}
                    <p className="text-xs text-blue-600 mt-1">
                      Balance Due: ₹
                      {(
                        total - (parseFloat(formData.amount_paid) || 0)
                      ).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* EMI Options with Radio Buttons for Months */}
                {formData.payment_type === "EMI" && formData.show_emi_details && (
                  <div className="bg-purple-50 p-3 rounded border border-purple-200 space-y-3 animate-in fade-in slide-in-from-top-2 relative">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, show_emi_details: false }))}
                      className="absolute top-2 right-2 text-purple-400 hover:text-purple-600 p-1"
                      title="Hide EMI Details"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {/* 1. Interest Rate Input */}
                    <div>
                      <label className="block text-xs font-bold text-purple-800 mb-1">
                        Rate of Interest (%)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          name="interest_rate"
                          value={formData.interest_rate}
                          onChange={handleInputChange}
                          step="0.01"
                          placeholder="0%"
                          className="w-24 px-2 py-1 border border-purple-400 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm font-bold text-purple-700">
                          %
                        </span>
                        <span className="text-xs text-purple-600 ml-auto">
                          Interest: ₹{interestAmount.toFixed(2)}
                        </span>
                      </div>
                      {errors.interest_rate && (
                        <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                          {errors.interest_rate}
                        </p>
                      )}
                    </div>

                    {/* 2. EMI Duration Radio Buttons */}
                    <div>
                      <label className="block text-xs font-bold text-purple-800 mb-1">
                        Duration (Months)
                      </label>
                      <div className="flex gap-2">
                        {[3, 6, 9, 12].map((month) => (
                          <label
                            key={month}
                            className={`cursor-pointer px-3 py-1 rounded text-xs border transition-all ${parseInt(formData.emi_months) === month
                              ? "bg-purple-600 text-white border-purple-600"
                              : "bg-white text-purple-700 border-purple-300 hover:bg-purple-100"
                              }`}
                          >
                            <input
                              type="radio"
                              name="emi_months"
                              value={month}
                              checked={parseInt(formData.emi_months) === month}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  emi_months: parseInt(e.target.value),
                                }))
                              }
                              className="hidden"
                            />
                            {month} M
                          </label>
                        ))}
                      </div>
                      {errors.emi_months && (
                        <p className="text-[10px] text-red-500 font-bold ml-1 mt-1">
                          {errors.emi_months}
                        </p>
                      )}
                    </div>

                    {/* 3. Monthly Installment Preview */}
                    {formData.emi_months > 0 && total > 0 && (
                      <div className="pt-2 border-t border-purple-200">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-purple-900">
                            Monthly Installment:
                          </span>
                          <span className="text-sm font-bold text-purple-700">
                            ₹{(total / formData.emi_months).toFixed(2)} / month
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Conflict/Hidden EMI Banner */}
                {formData.payment_type === "EMI" && !formData.show_emi_details && (
                  <div className="bg-yellow-50 p-2 rounded border border-yellow-200 flex justify-between items-center">
                    <span className="text-xs text-yellow-800 font-medium italic">EMI Details are hidden (e.g. paying in Cash)</span>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, show_emi_details: true }))}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Show Details
                    </button>
                  </div>
                )}

                {formData.payment_method === "UPI" && (
                  <button
                    type="button"
                    onClick={generateQRCode}
                    disabled={isGeneratingQR || total <= 0}
                    className={`px-4 py-1 sm:py-2 rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${isGeneratingQR || total <= 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    {isGeneratingQR ? "Generating..." : "Generate QR"}
                  </button>
                )}
              </div>
            </div>

            {/* Payment Status Radio Buttons */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
                Payment Status
              </label>
              <div className="flex items-center space-x-4 mt-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="payment_status"
                    value="Paid"
                    checked={formData.payment_status === "Paid"}
                    onChange={handleInputChange}
                    className="form-radio text-green-600 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">Paid</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="payment_status"
                    value="Unpaid"
                    checked={formData.payment_status === "Unpaid"}
                    onChange={handleInputChange}
                    className="form-radio text-red-600 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Unpaid / Partial
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-2 text-right space-y-1">
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">
              Applied Discount:{" "}
              <span className="text-red-600">₹{discountAmount.toFixed(2)}</span>
            </label>

            {/* Display Interest in Totals */}
            {formData.payment_type === "EMI" && (
              <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                Added Interest ({formData.interest_rate}%):{" "}
                <span className="text-blue-600">
                  + ₹{interestAmount.toFixed(2)}
                </span>
              </label>
            )}
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-100">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3">
            {(!isEdit || isCurrentlyDraftEdit) && (
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft || isSubmitting}
                className={`flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 ${savingDraft || isSubmitting
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border-transparent"
                  : "bg-white text-gray-700 hover:bg-gray-50 focus:outline-none"
                  }`}
              >
                {savingDraft ? (
                  <Loader variant="inline-compact" message={isCurrentlyDraftEdit ? "Updating..." : "Saving..."} />
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4" />
                    <span>{isCurrentlyDraftEdit ? "Update Draft" : "Save Draft"}</span>
                  </>
                )}
              </button>
            )}
            {!isDraftEdit && (
              <button
                type="submit"
                disabled={isSubmitting || savingDraft}
                className={`flex-1 sm:flex-none px-4 py-2 border border-transparent rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${isSubmitting || savingDraft
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-blue-100"
                  }`}
              >
                {isSubmitting ? (
                  <Loader variant="inline-compact" message="Wait.." />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>{isEdit ? "Update" : "Create"}</span>
                  </>
                )}
              </button>
            )}
            <div className="col-span-2 sm:col-span-1 mt-1 sm:mt-0">
               <BackButton className="w-full" fallbackUrl="/invoices" forceFallback={true} />
            </div>
          </div>
        </div>
      </form>

      {/* Draft Invoices Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">
                  Draft Invoices
                </h2>
              </div>
              <button
                onClick={() => setShowDraftModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {loadingDrafts ? (
                <Loader variant="container" message="Loading drafts..." className="py-10" />
              ) : draftInvoices.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No draft invoices found</p>
                  <p className="text-sm mt-1">
                    Save an invoice as draft to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {draftInvoices.map((draft) => (
                    <div
                      key={draft.id}
                      className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText size={18} className="text-purple-500" />
                          <div>
                            <span className="text-sm font-semibold text-gray-900">
                              Draft #{draft.id}
                            </span>
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                              Draft
                            </span>
                          </div>
                        </div>
                        <div className="ml-7 space-y-1">
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">Customer:</span>{" "}
                            {draft.customer_name || "N/A"}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              <Clock size={12} className="inline mr-1" />
                              {new Date(
                                draft.invoice_date ||
                                draft.createdAt ||
                                draft.created_at
                              ).toLocaleDateString()}
                            </span>
                            <span>
                              <span className="font-medium">Total:</span> ₹
                              {parseFloat(draft.total || 0).toFixed(2)}
                            </span>
                            {draft.items && (
                              <span>
                                <span className="font-medium">Items:</span>{" "}
                                {draft.items.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => loadDraftInvoice(draft.id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDraftModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
