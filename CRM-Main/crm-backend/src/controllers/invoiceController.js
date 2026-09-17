const prisma = require('../lib/prisma');
const { createLog } = require("./logController");
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Get shop details for invoice form
const getShopDetails = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        shopSettings: true,
      },
    });

    if (!shop) {
      return res.status(404).json({ error: "Shop not found" });
    }

    // Find the owner/admin's upiId as fallback if shop.upiId is not set
    let shopUpiId = shop.upiId;
    if (!shopUpiId) {
      const owner = await prisma.user.findFirst({
        where: {
          shopId: shopId,
          role: {
            in: ["shop_owner", "admin", "owner", "administrator", "restaurant_owner"]
          }
        },
        select: { upiId: true }
      });
      shopUpiId = owner?.upiId || "";
    }

    const shopDetails = {
      shop_name: shop.name,
      shop_address: shop.address,
      shop_phone: shop.phone,
      shop_email: shop.email,
      shop_gst: shop.gstNumber,
      logo_path: shop.logo,
      upi_id: shopUpiId || "",
      settings: shop.shopSettings || {
        default_tax: 0.0,
        invoice_prefix: "INV-",
        invoice_counter: 1,
        stock_deduction: true,
        invoice_notes: "",
        hide_non_taxable: false,
      },
    };

    shopDetails.hide_non_taxable = shop.shopSettings?.hide_non_taxable ?? false;

    res.json(shopDetails);
  } catch (error) {
    console.error("❌ Error fetching shop details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Toggle Tax Visibility Endpoint
const toggleTaxSettings = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    let settings = await prisma.shopSettings.findUnique({ where: { shopId } });

    if (!settings) {
      settings = await prisma.shopSettings.create({
        data: {
          shopId,
          invoice_prefix: "INV-",
          invoice_counter: 1,
          default_tax: 0.0,
          stock_deduction: true,
          hide_non_taxable: false,
        },
      });
    }

    const currentStatus = settings.hide_non_taxable ?? false;
    const newStatus = !currentStatus;

    await prisma.shopSettings.update({
      where: { shopId },
      data: { hide_non_taxable: newStatus },
    });

    res.json({ success: true, hide_non_taxable: newStatus });
  } catch (error) {
    console.error("Error toggling settings:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get Next Invoice Number
const getNextInvoiceNumber = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    let settings = await prisma.shopSettings.findUnique({ where: { shopId } });

    if (!settings) {
      settings = await prisma.shopSettings.create({
        data: {
          shopId,
          invoice_prefix: "INV-",
          invoice_counter: 1,
          default_tax: 0.0,
          stock_deduction: true,
        },
      });
    }

    const prefix = settings.invoice_prefix || "INV-";
    const counter = settings.invoice_counter || 1;
    const nextNumber = `${prefix}${String(counter).padStart(2, "0")}`;

    res.json({ success: true, nextNumber });
  } catch (error) {
    console.error("Error fetching next number:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to generate number" });
  }
};

const generateInvoiceNumber = async (req, res) => {
  return getNextInvoiceNumber(req, res);
};

const createInvoice = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const {
      invoice_number,
      customer_name,
      customer_phone,
      customer_address,
      customer_gst,
      invoice_date,
      tax,
      discount,
      discount_type,
      discount_amount,
      making_charges,
      payment_method,
      items,
      subtotal,
      tax_amount,
      total,
      shopId: bodyShopId,
      payment_status,
      // EMI Data
      interest_percentage,
      interest_amount,
      emi_months,
      // Advanced Data
      amount_paid,
      payment_type,
      // ✅ NEW FIELDS
      exchange,
      buyback,
    } = req.body;

    if (parseInt(bodyShopId) !== shopId) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    if (!invoice_number || !invoice_number.trim()) {
      return res.status(400).json({ success: false, error: "Invoice Number is required." });
    }

    const duplicateInvoice = await prisma.invoice.findFirst({
      where: {
        shopId,
        invoice_number: {
          equals: invoice_number.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (duplicateInvoice) {
      return res.status(400).json({ success: false, error: `Invoice number '${invoice_number}' already exists.` });
    }

    const rounded_total = Math.round(total);
    const round_off = rounded_total - total;

    // --- PHONE VALIDATION (optional, must be exactly 10 digits if provided) ---
    let normalizedPhone = null;
    if (customer_phone) {
      const digits = customer_phone.toString().replace(/\D/g, "");
      if (digits.length !== 10) {
        return res.status(400).json({ success: false, error: "Enter a valid 10-digit phone number" });
      }
      normalizedPhone = digits;
    }

    // --- PAYMENT STATUS LOGIC ---
    let status = payment_status || "Paid";
    let calculatedAmountPaid = 0;
    let balanceDue = 0;

    const pType = payment_type || (payment_method === "EMI" ? "EMI" : (payment_method === "Advanced" ? "Advanced" : (status === "Paid" ? "Full" : "Unpaid")));

    if (pType === "Advanced" || payment_method === "Advanced") {
      // For Advanced: Use the manual input
      calculatedAmountPaid = parseFloat(amount_paid) || 0;
      balanceDue = parseFloat(total) - calculatedAmountPaid;
      // Auto-set status based on whether full amount is paid
      status = balanceDue <= 0 ? "Paid" : "Unpaid";
    } else if (pType === "EMI" || payment_method === "EMI") {
      // For EMI: No initial payment, full amount is due
      calculatedAmountPaid = 0;
      balanceDue = parseFloat(total);
      status = "Unpaid";
    } else if (pType === "Full" || status === "Paid") {
      // Full Payment
      calculatedAmountPaid = parseFloat(total);
      balanceDue = 0;
      status = "Paid";
    } else {
      // Unpaid (no part payment allowed)
      calculatedAmountPaid = 0;
      balanceDue = parseFloat(total);
      status = "Unpaid";
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoice_number,
          invoice_date: new Date(invoice_date),
          customer_name,
          customer_phone: normalizedPhone,
          customer_address: customer_address || null,
          customer_gst: customer_gst || null,
          subtotal: parseFloat(subtotal),
          tax_percentage: parseFloat(tax),
          tax_amount: parseFloat(tax_amount),
          discount: parseFloat(discount),
          discount_type: discount_type || "percentage",
          discount_amount: parseFloat(discount_amount) || 0,
          total: parseFloat(total),
          rounded_total: rounded_total,
          round_off: round_off,
          payment_method,
          payment_status: status,
          amount_paid: calculatedAmountPaid,
          balance_due: balanceDue,

          // EMI & Interest Data
          interest_percentage: parseFloat(interest_percentage) || 0,
          interest_amount: parseFloat(interest_amount) || 0,
          emi_months: parseInt(emi_months) || 0,

          // ✅ SAVE NEW FIELDS (Default to false if undefined)
          exchange: exchange === true || exchange === "true",
          buyback: buyback === true || buyback === "true",

          shopId,
          userId: req.user.id,
          invoice_items: {
            create: items.map((item) => {
              return {
                item_id: item.item_id ? parseInt(item.item_id) : null,
                combo_id: item.combo_id ? parseInt(item.combo_id) : null,
                item_name: item.item_name,
                unit_id: parseInt(item.unit_id) || 1,
                unit_name: item.unit_name || "",
                unit_symbol: item.unit_symbol || "",
                quantity: parseFloat(item.quantity),
                price_per_unit: parseFloat(item.price_per_unit),
                item_total: parseFloat(item.item_total),
                shopId,
              };
            }),
          },
        },
        include: { invoice_items: true },
      });

      // 2. record initial payment record if any amount paid
      if (calculatedAmountPaid > 0) {
        await tx.invoicePayment.create({
          data: {
            invoiceId: invoice.id,
            amount: calculatedAmountPaid,
            payment_method: payment_method || "Cash",
            note: payment_method === "Advanced" ? "Initial Advanced Payment" : (status === "Paid" ? "Full Payment" : "Initial Payment"),
            payment_date: new Date(),
          },
        });
      }

      // 3. Stock Deduction
      const settings = await tx.shopSettings.findUnique({ where: { shopId } });
      const shouldDeductStock = settings?.stock_deduction ?? true;

      if (shouldDeductStock) {
        for (const item of items) {
          if (item.item_id) {
            await tx.stockEntry.create({
              data: {
                itemId: parseInt(item.item_id),
                quantity: parseFloat(item.quantity),
                unitId: parseInt(item.unit_id) || 1,
                stockType: "out",
                pricePerUnit: parseFloat(item.price_per_unit),
                totalValue: parseFloat(item.item_total),
                notes: `Sold via invoice ${invoice_number}`,
                shopId,
              },
            });
          } else if (item.combo_id) {
            // Deduct stock for each item IN the combo
            const combo = await tx.comboProduct.findUnique({
              where: { id: parseInt(item.combo_id) },
              include: { items: { include: { inventoryItem: true } } }
            });

            if (combo && combo.items) {
              for (const ci of combo.items) {
                await tx.stockEntry.create({
                  data: {
                    itemId: ci.inventoryItemId,
                    quantity: parseFloat(item.quantity) * ci.quantity,
                    unitId: ci.inventoryItem.default_unit_id || 1,
                    stockType: "out",
                    notes: `Sold via combo '${combo.name}' in invoice ${invoice_number}`,
                    shopId,
                  },
                });
              }
            }
          }
        }
      }

      // 4. Update Invoice Counter
      await tx.shopSettings.upsert({
        where: { shopId },
        update: { invoice_counter: { increment: 1 } },
        create: {
          shopId,
          invoice_counter: 2,
          invoice_prefix: "INV-",
          default_tax: 0.0,
          stock_deduction: true,
        },
      });

      return invoice;
    });

    if (req.user) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        "INVOICE_CREATE",
        `Created invoice ${result.invoice_number} (${status})`,
        "Invoice",
        "Success"
      );
    }

    res
      .status(201)
      .json({ success: true, message: "Invoice created", data: result });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Summary of Unpaid Customers
const getUnpaidCustomers = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const { excludeNonTaxable, month } = req.query;

    const where = {
      shopId,
      payment_status: "Unpaid",
    };

    if (excludeNonTaxable === "true") {
      where.tax_percentage = { gt: 0 };
    }

    if (month) {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(year, parseInt(monthNum) - 1, 1);
      const endDate = new Date(year, parseInt(monthNum), 0);
      endDate.setHours(23, 59, 59, 999);
      where.invoice_date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const invoices = await prisma.invoice.findMany({
      where: where,
      select: {
        id: true,
        customer_name: true,
        customer_phone: true,
        total: true,
        amount_paid: true,
        balance_due: true,
      },
    });

    const clientMap = new Map();

    invoices.forEach((inv) => {
      const key = `${inv.customer_name}-${inv.customer_phone || "no-phone"}`;

      if (!clientMap.has(key)) {
        clientMap.set(key, {
          customer_name: inv.customer_name,
          customer_phone: inv.customer_phone,
          total_invoices: 0,
          total_due: 0,
          latest_invoice_id: inv.id,
        });
      }

      const client = clientMap.get(key);
      client.total_invoices += 1;
      client.total_due += inv.balance_due || 0;
    });

    const clients = Array.from(clientMap.values());

    res.json({ success: true, clients });
  } catch (error) {
    console.error("Error fetching unpaid customers:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get Users for Dropdown Filter
const getInvoiceUsers = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const users = await prisma.user.findMany({
      where: { shopId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch staff list" });
  }
};

// Generate Monthly Report (CSV)
const generateMonthlyReport = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const { month } = req.query; // Format: YYYY-MM

    if (!month) {
      return res
        .status(400)
        .json({ error: "Month parameter is required (YYYY-MM)" });
    }

    const [year, monthNum] = month.split("-");
    const startDate = new Date(year, parseInt(monthNum) - 1, 1);
    const endDate = new Date(year, parseInt(monthNum), 0);
    endDate.setHours(23, 59, 59, 999);

    const invoices = await prisma.invoice.findMany({
      where: {
        shopId,
        invoice_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { invoice_date: "desc" },
    });

    if (invoices.length === 0) {
      return res.status(404).send("No invoices found for this month.");
    }

    const header =
      "Invoice No,Date,Customer Name,Phone,GSTIN,Subtotal,Tax,Discount,Total,Status,Created By\n";
    const rows = invoices
      .map((inv) => {
        const date = inv.invoice_date
          ? inv.invoice_date.toISOString().split("T")[0]
          : "";
        const safeName = `"${inv.customer_name.replace(/"/g, '""')}"`;

        return [
          inv.invoice_number,
          date,
          safeName,
          inv.customer_phone || "",
          inv.customer_gst || "",
          inv.subtotal,
          inv.tax_amount,
          inv.discount,
          inv.total,
          inv.payment_status,
          inv.user?.name || "Unknown",
        ].join(",");
      })
      .join("\n");

    const csvContent = header + rows;

    if (req.user) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        "REPORT_DOWNLOAD",
        `Downloaded Invoice Report for ${month}`,
        "Invoice",
        "Success"
      );
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice_report_${month}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
};

const getInvoices = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);

    const {
      page = 1,
      limit = 50,
      search = "",
      sortBy = "newest",
      status,
      customer_name,
      excludeNonTaxable,
      userId,
      dateFrom,
      dateTo,
    } = req.query;

    // --- BACKEND VALIDATION FOR INVOICES LISTING ---
    // 1. Validate pagination parameters
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({ error: "Invalid page parameter" });
    }
    if (isNaN(parsedLimit) || (parsedLimit < 1 && parsedLimit !== -1)) {
      return res.status(400).json({ error: "Invalid limit parameter" });
    }

    // 2. Validate sortBy parameter
    const allowedSortOptions = ["newest", "oldest", "name_asc", "name_desc", "amount_high", "amount_low"];
    if (!allowedSortOptions.includes(sortBy)) {
      return res.status(400).json({ error: "Invalid sort parameter" });
    }

    // 3. Validate userId (Staff) parameter
    if (userId) {
      const parsedUserId = parseInt(userId);
      if (isNaN(parsedUserId)) {
        return res.status(400).json({ error: "Invalid staff identifier" });
      }
    }

    // 4. Validate search query
    const trimmedSearch = String(search || "").trim();
    if (trimmedSearch.length > 0) {
      if (trimmedSearch.length > 100) {
        return res.status(400).json({ error: "Search query is too long" });
      }

      // Check for XSS/HTML injection or Script tags
      const xssPattern = /<[^>]*>|javascript:/i;
      if (xssPattern.test(trimmedSearch)) {
        return res.status(400).json({ error: "Invalid characters or HTML/script tags detected in search query" });
      }

      // Check for SQL / NoSQL Injection attempts
      const sqlPattern = /\b(union|select|insert|update|delete|drop|alter|where|from|or|and|having|group by)\b/i;
      const nosqlPattern = /[\$\{\}]/;
      if (sqlPattern.test(trimmedSearch) || nosqlPattern.test(trimmedSearch)) {
        return res.status(400).json({ error: "Security validation failed for search query" });
      }

      // Edge Cases: Special characters only
      const specialCharsOnly = /^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
      if (specialCharsOnly.test(trimmedSearch)) {
        return res.status(400).json({ error: "Search query cannot contain only special characters" });
      }
    }

    // 5. Validate dates
    let validatedDateFrom = null;
    let validatedDateTo = null;

    if (dateFrom) {
      const parsedDateFrom = new Date(dateFrom);
      if (isNaN(parsedDateFrom.getTime())) {
        return res.status(400).json({ error: "Invalid Date From format" });
      }
      const now = new Date();
      if (parsedDateFrom > now) {
        return res.status(400).json({ error: "Date From cannot be a future date" });
      }
      validatedDateFrom = parsedDateFrom;
    }

    if (dateTo) {
      const parsedDateTo = new Date(dateTo);
      if (isNaN(parsedDateTo.getTime())) {
        return res.status(400).json({ error: "Invalid Date To format" });
      }
      const now = new Date();
      if (parsedDateTo > now) {
        return res.status(400).json({ error: "Date To cannot be a future date" });
      }
      validatedDateTo = parsedDateTo;
    }

    if (validatedDateFrom && validatedDateTo) {
      if (validatedDateFrom > validatedDateTo) {
        return res.status(400).json({ error: "Date From cannot be after Date To" });
      }
    }

    if (status && status !== "Unpaid") {
      return res.status(400).json({ error: "Invalid payment status value" });
    }
    if (excludeNonTaxable && excludeNonTaxable !== "true" && excludeNonTaxable !== "false") {
      return res.status(400).json({ error: "Invalid excludeNonTaxable parameter" });
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const where = {
      shopId,
      OR: [
        { invoice_number: { contains: trimmedSearch, mode: "insensitive" } },
        { customer_name: { contains: trimmedSearch, mode: "insensitive" } },
        { customer_phone: { contains: trimmedSearch, mode: "insensitive" } },
      ],
    };

    if (excludeNonTaxable === "true") {
      where.tax_percentage = { gt: 0 };
    }

    if (status === "Unpaid") {
      where.payment_status = "Unpaid";
    }

    if (customer_name) {
      where.customer_name = customer_name;
    }

    if (userId) {
      where.userId = parseInt(userId);
    }

    if (validatedDateFrom || validatedDateTo) {
      where.invoice_date = {};
      if (validatedDateFrom) {
        where.invoice_date.gte = validatedDateFrom;
      }
      if (validatedDateTo) {
        const endDate = new Date(validatedDateTo);
        endDate.setHours(23, 59, 59, 999);
        where.invoice_date.lte = endDate;
      }
    }

    let orderBy = {};
    switch (sortBy) {
      case "newest":
        orderBy = { created_at: "desc" };
        break;
      case "oldest":
        orderBy = { created_at: "asc" };
        break;
      case "name_asc":
        orderBy = { customer_name: "asc" };
        break;
      case "name_desc":
        orderBy = { customer_name: "desc" };
        break;
      case "amount_high":
        orderBy = { total: "desc" };
        break;
      case "amount_low":
        orderBy = { total: "asc" };
        break;
      default:
        orderBy = { created_at: "desc" };
    }

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy,
        skip: parseInt(limit) === -1 ? undefined : skip,
        take: parseInt(limit) === -1 ? undefined : parseInt(limit),
        select: {
          id: true,
          invoice_number: true,
          invoice_date: true,
          customer_name: true,
          customer_phone: true,
          total: true,
          amount_paid: true,
          balance_due: true,
          payment_status: true,
          tax_percentage: true,
          created_at: true,
          // ✅ FETCH NEEDED FIELDS FOR EMI & HISTORY & NEW FIELDS
          interest_percentage: true,
          interest_amount: true,
          payment_method: true,
          emi_months: true,
          exchange: true, // ✅ FETCH EXCHANGE
          buyback: true, // ✅ FETCH BUYBACK
          user: { select: { name: true } },
          payments: {
            orderBy: { payment_date: "desc" },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      invoices,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get Invoice By ID
const getInvoiceById = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const invoiceId = parseInt(req.params.id);

    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: "Invalid Invoice ID" });
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, shopId },
      include: {
        invoice_items: { include: { unit: true, inventory_item: true } },
        shop: true,
        payments: { orderBy: { payment_date: "desc" } },
      },
    });

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json(invoice);
  } catch (e) {
    console.error("Error fetching invoice:", e);
    res.status(500).json({ error: e.message });
  }
};

// Update Invoice
const updateInvoice = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const invoiceId = parseInt(req.params.id);
    const {
      invoice_number,
      customer_name,
      customer_phone,
      customer_address,
      customer_gst,
      invoice_date,
      tax,
      discount,
      discount_type,
      discount_amount,
      making_charges,
      payment_method,
      items,
      subtotal,
      tax_amount,
      total,
      shopId: bodyShopId,
      // EMI & Advanced
      interest_percentage,
      interest_amount,
      emi_months,
      amount_paid, // Allow update of amount paid
      payment_type,
      payment_status,
      // ✅ NEW FIELDS
      exchange,
      buyback,
    } = req.body;

    if (parseInt(bodyShopId) !== shopId) {
      return res
        .status(403)
        .json({ success: false, error: "Access denied to this shop" });
    }

    if (!invoice_number || !invoice_number.trim()) {
      return res.status(400).json({ success: false, error: "Invoice Number is required." });
    }

    const duplicateInvoice = await prisma.invoice.findFirst({
      where: {
        shopId,
        id: { not: invoiceId },
        invoice_number: {
          equals: invoice_number.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (duplicateInvoice) {
      return res.status(400).json({ success: false, error: `Invoice number '${invoice_number}' already exists.` });
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, shopId },
      include: { invoice_items: true },
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const rounded_total = Math.round(total);
    const round_off = rounded_total - total;

    // --- PHONE VALIDATION (optional, must be exactly 10 digits if provided) ---
    let normalizedPhone = null;
    if (customer_phone) {
      const digits = customer_phone.toString().replace(/\D/g, "");
      if (digits.length !== 10) {
        return res.status(400).json({ success: false, error: "Enter a valid 10-digit phone number" });
      }
      normalizedPhone = digits;
    }

    // Recalculate based on payment type
    let status = payment_status || existingInvoice.payment_status;
    let newAmountPaid = 0;
    let newBalanceDue = 0;

    const pType = payment_type || (payment_method === "EMI" ? "EMI" : (payment_method === "Advanced" ? "Advanced" : (status === "Paid" ? "Full" : "Unpaid")));

    if (pType === "Advanced" || payment_method === "Advanced") {
      newAmountPaid = parseFloat(amount_paid) || 0;
      newBalanceDue = parseFloat(total) - newAmountPaid;
      status = newBalanceDue <= 0 ? "Paid" : "Unpaid";
    } else if (pType === "EMI" || payment_method === "EMI") {
      newAmountPaid = 0;
      newBalanceDue = parseFloat(total);
      status = "Unpaid";
    } else if (pType === "Full" || status === "Paid") {
      newAmountPaid = parseFloat(total);
      newBalanceDue = 0;
      status = "Paid";
    } else {
      newAmountPaid = 0;
      newBalanceDue = parseFloat(total);
      status = "Unpaid";
    }

    const result = await prisma.$transaction(async (tx) => {
      const settings = await tx.shopSettings.findUnique({ where: { shopId } });
      const shouldDeductStock = settings?.stock_deduction ?? true;

      if (shouldDeductStock) {
        await tx.stockEntry.deleteMany({
          where: {
            shopId,
            notes: `Sold via invoice ${existingInvoice.invoice_number}`,
          },
        });
      }

      await tx.invoiceItem.deleteMany({ where: { invoice_id: invoiceId } });

      const invoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          invoice_number: invoice_number.trim(),
          invoice_date: new Date(invoice_date),
          customer_name,
          customer_phone: normalizedPhone,
          customer_address: customer_address || null,
          customer_gst: customer_gst || null,
          subtotal: parseFloat(subtotal),
          tax_percentage: parseFloat(tax),
          tax_amount: parseFloat(tax_amount),
          discount: parseFloat(discount),
          discount_type: discount_type || "percentage",
          discount_amount: parseFloat(discount_amount) || 0,
          making_charges: parseFloat(making_charges) || 0,
          total: parseFloat(total),
          rounded_total: rounded_total,
          round_off: round_off,
          payment_method,
          payment_status: status,

          // Update Advanced Payments info if needed
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,

          // Update Interest & EMI Data
          interest_percentage: parseFloat(interest_percentage) || 0,
          interest_amount: parseFloat(interest_amount) || 0,
          emi_months: parseInt(emi_months) || 0,

          // ✅ UPDATE NEW FIELDS
          exchange: exchange === true || exchange === "true",
          buyback: buyback === true || buyback === "true",

          userId: req.user.id,
          invoice_items: {
            create: items.map((item) => {
              return {
                item_id: item.item_id ? parseInt(item.item_id) : null,
                combo_id: item.combo_id ? parseInt(item.combo_id) : null,
                item_name: item.item_name,
                unit_id: parseInt(item.unit_id) || 1,
                unit_name: item.unit_name || "",
                unit_symbol: item.unit_symbol || "",
                quantity: parseFloat(item.quantity),
                price_per_unit: parseFloat(item.price_per_unit),
                item_total: parseFloat(item.item_total),
                shopId,
              };
            }),
          },
        },
        include: { invoice_items: true },
      });

      if (shouldDeductStock) {
        for (const item of items) {
          if (item.item_id) {
            await tx.stockEntry.create({
              data: {
                itemId: parseInt(item.item_id),
                quantity: parseFloat(item.quantity),
                unitId: parseInt(item.unit_id) || 1,
                stockType: "out",
                pricePerUnit: parseFloat(item.price_per_unit),
                totalValue: parseFloat(item.item_total),
                notes: `Sold via invoice ${invoice.invoice_number}`,
                shopId,
              },
            });
          } else if (item.combo_id) {
            // Deduct stock for each item IN the combo
            const combo = await tx.comboProduct.findUnique({
              where: { id: parseInt(item.combo_id) },
              include: { items: { include: { inventoryItem: true } } }
            });

            if (combo && combo.items) {
              for (const ci of combo.items) {
                await tx.stockEntry.create({
                  data: {
                    itemId: ci.inventoryItemId,
                    quantity: parseFloat(item.quantity) * ci.quantity,
                    unitId: ci.inventoryItem.default_unit_id || 1,
                    stockType: "out",
                    notes: `Sold via combo '${combo.name}' in invoice ${invoice.invoice_number}`,
                    shopId,
                  },
                });
              }
            }
          }
        }
      }

      return invoice;
    });

    if (req.user) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        "INVOICE_UPDATE",
        `Updated invoice ${result.invoice_number}`,
        "Invoice",
        "Success"
      );
    }

    res.json({
      success: true,
      message: "Invoice updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to update invoice: " + error.message,
      });
  }
};

// Delete Invoice
const deleteInvoice = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const invoiceId = parseInt(req.params.id);

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, shopId },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    await prisma.stockEntry.deleteMany({
      where: { shopId, notes: `Sold via invoice ${invoice.invoice_number}` },
    });
    await prisma.invoiceItem.deleteMany({
      where: { invoice_id: invoiceId, shopId },
    });
    await prisma.invoice.delete({ where: { id: invoiceId } });

    if (req.user) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        "INVOICE_DELETE",
        `Deleted invoice ${invoice.invoice_number}`,
        "Invoice",
        "Success"
      );
    }

    res.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ success: false, error: "Failed to delete invoice" });
  }
};

// Get Invoices by User ID
const getInvoicesByUserId = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const role = req.user.role;
    const { userId } = req.params;
    const { page = 1, limit = 10, search = "", sortBy = "newest" } = req.query;

    const isAdmin = role === "admin" || role === "shop_owner";
    const targetUserId = parseInt(userId);

    if (!isAdmin && targetUserId !== req.user.id) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { shopId: parseInt(shopId), userId: targetUserId };

    if (search) {
      where.OR = [
        { invoice_number: { contains: search, mode: "insensitive" } },
        { customer_name: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy = {};
    switch (sortBy) {
      case "oldest":
        orderBy = { invoice_date: "asc" };
        break;
      case "amount_high":
        orderBy = { total: "desc" };
        break;
      default:
        orderBy = { invoice_date: "desc" };
    }

    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          invoice_number: true,
          invoice_date: true,
          customer_name: true,
          total: true,
          tax_percentage: true,
          created_at: true,
          user: { select: { id: true, name: true, username: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    const revenueResult = await prisma.invoice.aggregate({
      where,
      _sum: { total: true },
    });
    const totalRevenue = revenueResult._sum.total || 0;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true },
    });

    res.json({
      success: true,
      data: {
        user,
        invoices,
        totalRevenue,
        pagination: {
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          currentPage: parseInt(page),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching invoices by user ID:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// Search Customers
const searchCustomers = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const { query } = req.query;

    if (!query || query.length < 2)
      return res.json({ success: true, data: [] });

    const customers = await prisma.invoice.findMany({
      where: {
        shopId,
        customer_name: { contains: query, mode: "insensitive" },
      },
      orderBy: { created_at: "desc" },
      distinct: ["customer_name"],
      take: 10,
      select: {
        customer_name: true,
        customer_phone: true,
        customer_address: true,
        customer_gst: true,
      },
    });

    res.json({ success: true, data: customers });
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

// Generate Invoice PDF
const generateInvoicePDF = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const invoiceId = parseInt(req.params.id);
    const { format = "a4" } = req.query; // 'a4' or 'thermal'

    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: "Invalid Invoice ID" });
    }

    // Fetch invoice with all related data
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, shopId },
      include: {
        invoice_items: {
          include: {
            unit: true,
            inventory_item: true,
          },
        },
        shop: true,
        payments: { orderBy: { payment_date: "desc" } },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Fetch shop settings for config
    const settings = await prisma.shopSettings.findUnique({
      where: { shopId },
    });

    const priceLabel = settings?.price_column_label || "Price";
    const enableBuyBack = settings?.enable_buyback_exchange || false;

    // Calculate totals
    const totalDiscount = parseFloat(invoice.discount) || 0;
    const rounded_total =
      parseFloat(invoice.rounded_total) ||
      Math.round(parseFloat(invoice.total));
    const round_off =
      parseFloat(invoice.round_off) ||
      rounded_total - parseFloat(invoice.total);

    // Get shop logo full URL if available
    let shopLogoUrl = null;
    const shopLogoPath = invoice.shop?.logo;
    if (shopLogoPath) {
      try {
        // If logo path is already a full URL, use it as is
        if (
          shopLogoPath.startsWith("http://") ||
          shopLogoPath.startsWith("https://")
        ) {
          shopLogoUrl = shopLogoPath;
        } else {
          // Construct full path for reading from disk
          // Assuming uploads are in the 'uploads' directory relative to the project root
          const uploadsDir = path.join(process.cwd(), 'uploads');
          const fileName = path.basename(shopLogoPath);
          const fullPath = path.join(uploadsDir, fileName);

          if (fs.existsSync(fullPath)) {
            const imageBuffer = fs.readFileSync(fullPath);
            const base64Image = imageBuffer.toString('base64');
            const ext = path.extname(fullPath).substring(1) || 'png';
            shopLogoUrl = `data:image/${ext};base64,${base64Image}`;
          } else {
            // Fallback to URL if file not found locally
            const protocol = req.headers['x-forwarded-proto'] || req.protocol || "http";
            const host = req.get('host') || process.env.BACKEND_URL || "localhost:8001";
            const baseUrl = `${protocol}://${host}`;
            const logoPath = shopLogoPath.startsWith("/") ? shopLogoPath : `/${shopLogoPath}`;
            shopLogoUrl = `${baseUrl}${logoPath}`;
          }
        }
      } catch (error) {
        console.error("Error processing shop logo:", error);
      }
    }

    // Generate PDF using PDFKit
    const doc = new PDFDocument({
      size: format === "thermal" ? [226, 800] : "A4", // 80mm approx 226pt
      margin: format === "thermal" ? 15 : 40,
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    // Header - Shop Details
    if (invoice.shop?.logo) {
      try {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const fileName = path.basename(invoice.shop.logo);
        const logoPath = path.join(uploadsDir, fileName);
        
        if (fs.existsSync(logoPath)) {
          const ext = path.extname(logoPath).toLowerCase();
          if (['.png', '.jpg', '.jpeg'].includes(ext)) {
            doc.image(logoPath, { height: 40 });
            doc.moveDown(0.5);
          }
        }
      } catch (imgError) {
        console.error("Error adding logo to PDF:", imgError);
      }
    }

    const pageWidth = doc.page.width;
    const margin = doc.page.margins.left;
    const contentWidth = pageWidth - margin - doc.page.margins.right;

    doc.font('Helvetica-Bold').fontSize(20).text(invoice.shop?.name || "CRM", { align: format === 'thermal' ? 'center' : 'left' });
    doc.font('Helvetica').fontSize(10).text(invoice.shop?.address || "", { align: format === 'thermal' ? 'center' : 'left' });
    doc.text(`Phone: ${invoice.shop?.phone || ""} | GST: ${invoice.shop?.gstNumber || ""}`, { align: format === 'thermal' ? 'center' : 'left' });
    doc.moveDown();

    doc.moveTo(margin, doc.y).lineTo(pageWidth - doc.page.margins.right, doc.y).stroke();
    doc.moveDown();

    // Invoice Info
    doc.font('Helvetica-Bold').fontSize(16).text("INVOICE", { align: 'center' });
    doc.font('Helvetica').fontSize(10);
    const topY = doc.y;
    doc.font('Helvetica-Bold').text(`Invoice #: ${invoice.invoice_number}`, { align: 'left' });
    doc.font('Helvetica').text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString("en-GB")}`, { align: 'left' });
    
    if (format !== 'thermal') {
        doc.y = topY;
        doc.font('Helvetica-Bold').text("Bill To:", { align: 'right' });
        doc.font('Helvetica').text(invoice.customer_name, { align: 'right' });
        doc.text(invoice.customer_phone || "", { align: 'right' });
        doc.text(invoice.address || "", { align: 'right' });
    } else {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text(`Bill To: ${invoice.customer_name}`);
        if (invoice.customer_phone) doc.font('Helvetica').text(`Phone: ${invoice.customer_phone}`);
    }
    doc.moveDown();

    // Items Table
    const tableTop = doc.y + 10;
    const col1 = margin;
    const col2 = margin + (format === 'thermal' ? 20 : 30);
    const col5 = pageWidth - doc.page.margins.right;
    const col4 = col5 - (format === 'thermal' ? 70 : 100); // Increased from 80/60
    const col3 = col4 - (format === 'thermal' ? 40 : 60);  // Increased from 50/40

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text("#", col1, tableTop);
    doc.text("Item Description", col2, tableTop);
    doc.text("Qty", col3, tableTop);
    doc.text(priceLabel, col4, tableTop);
    doc.text("Total", col5 - 80, tableTop, { align: 'right', width: 80 }); // Increased width from 50

    doc.moveTo(margin, tableTop + 15).lineTo(pageWidth - doc.page.margins.right, tableTop + 15).stroke();
    
    let currentY = tableTop + 25;
    invoice.invoice_items.forEach((item, index) => {
      if (currentY > doc.page.height - 100) {
        doc.addPage();
        currentY = margin;
      }
      doc.font('Helvetica').text(index + 1, col1, currentY);
      doc.text(item.item_name, col2, currentY, { width: col3 - col2 - 5 });
      doc.text(item.quantity, col3, currentY);
      doc.text(`Rs.${parseFloat(item.price_per_unit).toFixed(2)}`, col4, currentY, { width: col5 - col4 - 85 });
      doc.text(`Rs.${parseFloat(item.item_total).toFixed(2)}`, col5 - 80, currentY, { align: 'right', width: 80 });
      
      const textHeight = doc.heightOfString(item.item_name, { width: col3 - col2 - 5 });
      currentY += Math.max(20, textHeight + 5);
    });

    doc.moveTo(margin, currentY).lineTo(pageWidth - doc.page.margins.right, currentY).stroke();
    currentY += 15;

    // Totals
    const totalsLabelX = col3;
    const totalsValueX = col5 - 80;
    
    doc.font('Helvetica').text("Subtotal:", totalsLabelX, currentY);
    doc.text(`Rs.${parseFloat(invoice.subtotal).toFixed(2)}`, totalsValueX, currentY, { align: 'right', width: 80 });
    currentY += 15;

    if (parseFloat(invoice.discount_amount) > 0) {
      const discountLabel = invoice.discount_type === "percentage"
        ? `Discount (${parseFloat(invoice.discount)}%):`
        : "Discount:";
      doc.text(discountLabel, totalsLabelX, currentY);
      doc.text(`-Rs.${parseFloat(invoice.discount_amount).toFixed(2)}`, totalsValueX, currentY, { align: 'right', width: 80 });
      currentY += 15;
    }

    if (parseFloat(invoice.tax_amount) > 0) {
      doc.text(`Tax (${parseFloat(invoice.tax_percentage)}%):`, totalsLabelX, currentY);
      doc.text(`Rs.${parseFloat(invoice.tax_amount).toFixed(2)}`, totalsValueX, currentY, { align: 'right', width: 80 });
      currentY += 15;
    }

    doc.font('Helvetica-Bold').fontSize(12).text("Net Total:", totalsLabelX, currentY);
    doc.text(`Rs.${parseFloat(rounded_total).toFixed(2)}`, totalsValueX, currentY, { align: 'right', width: 80 });
    
    doc.moveDown(2);
    doc.fontSize(10).text(settings?.message || "Thank you for your business!", { align: 'center', italic: true });

    doc.end();

    const pdfBuffer = await new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Log the action
    if (req.user) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        "INVOICE_PDF_DOWNLOAD",
        `Downloaded PDF for invoice ${invoice.invoice_number}`,
        "Invoice",
        "Success"
      );
    }

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF: " + error.message });
  }
};

// Helper function to generate invoice HTML
const generateInvoiceHTML = (
  invoice,
  priceLabel,
  enableBuyBack,
  format,
  totalDiscount,
  rounded_total,
  round_off,
  shopLogoUrl = null
) => {
  const isThermal = format === "thermal";
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

  const invoiceDate = invoice.invoice_date
    ? new Date(invoice.invoice_date).toLocaleDateString("en-GB")
    : "";
  const invoiceTime = invoice.created_at
    ? new Date(invoice.created_at).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : "";

  const shop = invoice.shop || {};
  const items = invoice.invoice_items || [];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: ${isThermal ? "monospace" : "Helvetica, Arial, sans-serif"};
      font-size: ${isThermal ? "11px" : "14px"};
      color: #000;
      background: white;
      padding: ${isThermal ? "5px" : "20px"};
    }
    .invoice {
      width: ${isThermal ? "72mm" : "100%"};
      max-width: ${isThermal ? "72mm" : "210mm"};
      margin: 0 auto;
      background: white;
    }
    .invoice-header {
      ${isThermal
      ? "text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px;"
      : "display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 20px;"
    }
    }
    .shop-info {
      ${isThermal ? "width: 100%; text-align: center;" : "flex: 2;"}
    }
    .invoice-info {
      ${isThermal
      ? "width: 100%; text-align: center; margin-top: 10px;"
      : "flex: 1; text-align: right;"
    }
    }
    .invoice-info h2 {
      ${isThermal ? "display: none;" : ""}
    }
    .invoice-items {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: ${isThermal ? "10px" : "13px"};
    }
    .invoice-items th {
      background-color: #f2f2f2;
      padding: ${isThermal ? "4px 0" : "12px"};
      text-align: left;
      ${isThermal ? "border-bottom: 1px solid #000;" : "border: 1px solid #ddd;"
    }
    }
    .invoice-items td {
      padding: ${isThermal ? "4px 0" : "12px"};
      ${isThermal
      ? "border-bottom: 1px dashed #eee;"
      : "border: 1px solid #ddd; border-bottom: 1px solid #eee;"
    }
    }
    .amount-th {
      text-align: right !important;
    }
    .invoice-totals {
      margin-top: 30px;
      width: 100%;
      max-width: ${isThermal ? "100%" : "300px"};
      margin-left: ${isThermal ? "0" : "auto"};
      font-size: ${isThermal ? "10px" : "14px"};
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: ${isThermal ? "5px 0" : "10px 0"};
      ${isThermal
      ? "border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px;"
      : "border-bottom: 1px solid #eee;"
    }
    }
    .grand-total {
      font-weight: bold;
      font-size: ${isThermal ? "1.1em" : "1.2em"};
      border-top: ${isThermal ? "2px dashed #000" : "2px solid #333"};
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
    .item-code {
      font-size: 0.8em;
      color: #666;
      ${isThermal ? "display: none;" : ""}
    }
    .customer-info {
      margin-bottom: 20px;
    }
    .payment-method {
      margin-top: 20px;
    }
    .invoice-footer {
      margin-top: 50px;
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .shop-logo {
      max-height: 64px;
      max-width: 200px;
      object-fit: contain;
      margin-bottom: 10px;
      display: block;
    }
    @media print {
      body { margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="invoice-header">
      <div class="shop-info">
        ${shopLogoUrl
      ? `
          <div style="margin-bottom: 10px;">
            <img src="${shopLogoUrl}" alt="${shop.name || "Shop Logo"
      }" class="shop-logo" />
          </div>
        `
      : shop.name
        ? `<h1 style="font-size: ${isThermal ? "14px" : "20px"
        }; font-weight: bold; margin-bottom: 10px;">${shop.name}</h1>`
        : ""
    }
        ${shop.address
      ? `<p style="white-space: pre-line; color: #666;">${shop.address}</p>`
      : ""
    }
        ${shop.phone ? `<p style="color: #666;">Phone: ${shop.phone}</p>` : ""}
        ${shop.email ? `<p style="color: #666;">Email: ${shop.email}</p>` : ""}
        ${shop.gstNumber
      ? `<p style="color: #666;">GST: ${shop.gstNumber}</p>`
      : ""
    }
      </div>
      <div class="invoice-info">
        <h2 style="font-size: ${isThermal ? "14px" : "20px"
    }; font-weight: bold; margin-bottom: 10px;">INVOICE</h2>
        <p><strong>Invoice #</strong> ${invoice.invoice_number}</p>
        <p><strong>Date:</strong> ${invoiceDate} ${invoiceTime ? invoiceTime : ""
    }</p>
        ${enableBuyBack
      ? `
          <div style="margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
            <p><strong>Exchange:</strong> ${invoice.exchange ? "Yes" : "No"}</p>
            <p><strong>BuyBack:</strong> ${invoice.buyback ? "Yes" : "No"}</p>
          </div>
        `
      : ""
    }
      </div>
    </div>

    <div class="invoice-body">
      <div class="customer-info">
        <h3 style="font-size: ${isThermal ? "12px" : "16px"
    }; font-weight: 600; margin-bottom: 10px;">Bill To:</h3>
        <p><strong>${invoice.customer_name}</strong></p>
        ${invoice.customer_phone
      ? `<p>Phone: ${invoice.customer_phone}</p>`
      : ""
    }
        ${invoice.customer_address
      ? `<p>Address: <span style="white-space: pre-line;">${invoice.customer_address}</span></p>`
      : ""
    }
        ${invoice.customer_gst ? `<p>GST No: ${invoice.customer_gst}</p>` : ""}
      </div>

      <table class="invoice-items">
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: ${isThermal ? "35%" : "40%"};">Item</th>
            <th style="width: 15%;">${priceLabel}</th>
            <th style="width: 15%;">Qty</th>
            <th class="amount-th" style="width: 15%;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${items
      .map((item, index) => {
        const unit =
          item.unit_symbol === "g" ? "kg" : item.unit_symbol || "";
        const itemCode = item.inventory_item?.item_code || "";
        return `
            <tr>
              <td>${index + 1}</td>
              <td>
                ${item.item_name || "Unknown Item"}
                ${itemCode && !isThermal
            ? `<div class="item-code">Item Code: ${itemCode}</div>`
            : ""
          }
              </td>
              <td>₹${safeNumber(item.price_per_unit)}/${item.unit_symbol || ""
          }</td>
              <td>${safeQuantity(item.quantity, item.unit_symbol)} ${unit}</td>
              <td class="amount-th">₹${safeNumber(item.item_total)}</td>
            </tr>
            `;
      })
      .join("")}
        </tbody>
      </table>

      <div class="invoice-totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>₹${safeNumber(invoice.subtotal)}</span>
        </div>
        ${invoice.tax_amount > 0
      ? `
          <div class="totals-row">
            <span>Tax:</span>
            <span>₹${safeNumber(invoice.tax_amount)} (${safeNumber(
        invoice.tax_percentage,
        0
      )}%)</span>
          </div>
        `
      : ""
    }
        ${invoice.discount > 0
      ? `
          <div class="totals-row">
            <span>Discount (Flat):</span>
            <span>-₹${safeNumber(invoice.discount)}</span>
          </div>
        `
      : ""
    }
        ${invoice.making_charges > 0
      ? `
          <div class="totals-row">
            <span>Making Charges:</span>
            <span>₹${safeNumber(invoice.making_charges)}</span>
          </div>
        `
      : ""
    }
        ${Math.abs(round_off) > 0.01
      ? `
          <div class="totals-row total">
            <span>Total:</span>
            <span>₹${safeNumber(invoice.total)}</span>
          </div>
          <div class="totals-row">
            <span>Round Off:</span>
            <span>${round_off > 0 ? "+" : ""}₹${Math.abs(round_off).toFixed(
        2
      )}</span>
          </div>
        `
      : ""
    }
        <div class="totals-row grand-total">
          <span>Net Total:</span>
          <span>₹${safeNumber(rounded_total)}</span>
        </div>
        ${totalDiscount > 0
      ? `
          <p style="text-align: right; font-weight: bold; color: green; margin-top: 5px; font-size: 0.9em;">
            You saved ₹${safeNumber(totalDiscount)}
          </p>
        `
      : ""
    }
      </div>

      <div class="payment-method">
        <p><strong>Payment Method:</strong> ${invoice.payment_method || ""}</p>
      </div>
    </div>

    <div class="invoice-footer">
      <p>This is a computer-generated invoice.<br>Thank you for your purchase! Have a Great Day!</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Add Payment Entry
const addPaymentEntry = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const invoiceId = parseInt(req.params.id);
    const { amount, note, method } = req.body;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, shopId },
    });

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const newAmountPaid = invoice.amount_paid + parseFloat(amount);
    const newBalanceDue = invoice.total - newAmountPaid;

    let newStatus = invoice.payment_status;
    if (newBalanceDue <= 0) newStatus = "Paid";
    else newStatus = "Unpaid";

    const result = await prisma.$transaction(async (tx) => {
      await tx.invoicePayment.create({
        data: {
          invoiceId,
          amount: parseFloat(amount),
          note: note || "",
          payment_method: method || "Cash",
        },
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          payment_status: newStatus,
        },
      });

      return updatedInvoice;
    });

    await createLog(
      req,
      req.user.id,
      shopId,
      "PAYMENT_ADD",
      `Added payment of ₹${amount} to ${invoice.invoice_number}`,
      "Invoice",
      "Success"
    );

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Error adding payment:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getShopDetails,
  generateInvoiceNumber,
  createInvoice,
  getUnpaidCustomers,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  getNextInvoiceNumber,
  getInvoicesByUserId,
  searchCustomers,
  toggleTaxSettings,
  getInvoiceUsers,
  generateMonthlyReport,
  generateInvoicePDF,
  addPaymentEntry,
};
