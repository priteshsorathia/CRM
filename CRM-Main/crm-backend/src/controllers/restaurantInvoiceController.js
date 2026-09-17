const prisma = require('../lib/prisma');
const { createLog } = require('./logController');

const reserveNextBillNumber = async (tx, shopId) => {
  const settings = await tx.shopSettings.upsert({
    where: { shopId },
    update: { invoice_counter: { increment: 1 } },
    create: {
      shopId,
      invoice_prefix: 'INV-',
      invoice_counter: 2,
      invoice_notes: '',
      default_tax: 0.0,
      stock_deduction: true
    }
  });

  const prefix = settings.invoice_prefix || 'INV-';
  const counterUsed = (settings.invoice_counter || 2) - 1;
  return `${prefix}${String(counterUsed).padStart(2, '0')}`;
};

const releaseTableIfPaid = async (tx, shopId, tableNumber, paymentStatus) => {
  const statusValue = String(paymentStatus || '').toLowerCase();
  if (statusValue !== 'paid') return;
  if (!tableNumber) return;

  const tableValue = String(tableNumber).trim();
  if (!tableValue) return;

  // Release occupied tables automatically when payment is marked as Paid.
  await tx.restaurantTable.updateMany({
    where: {
      shopId: parseInt(shopId, 10),
      table_number: tableValue,
      status: 'occupied'
    },
    data: { status: 'available' }
  });
};

// Mark linked orders as completed when invoice is fully paid.
const completeOrdersIfPaid = async (tx, shopId, orderToken, paymentStatus) => {
  const statusValue = String(paymentStatus || '').toLowerCase();
  if (statusValue !== 'paid') return;
  if (!orderToken) return;

  // order_token may hold multiple comma-separated tokens (merged orders)
  const tokens = String(orderToken)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) return;

  await tx.restaurantOrder.updateMany({
    where: {
      shopId: parseInt(shopId, 10),
      order_token: { in: tokens },
      status: { notIn: ['cancelled', 'completed'] }
    },
    data: { status: 'completed' }
  });
};

const validateCustomerInput = (customer_name, customer_phone, customer_notes) => {
  const nameVal = customer_name ? String(customer_name).trim() : '';
  if (nameVal && (nameVal.length < 3 || nameVal.length > 50)) {
    const err = new Error('Customer Name must be between 3 and 50 characters');
    err.statusCode = 400;
    throw err;
  }

  const phoneVal = customer_phone ? String(customer_phone).trim() : '';
  if (phoneVal) {
    const phoneDigits = phoneVal.replace(/\D/g, '');
    if (phoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(phoneDigits) || /^(.)\1{9}$/.test(phoneDigits)) {
      const err = new Error('Invalid Indian phone number. Must be exactly 10 digits and not all repeating.');
      err.statusCode = 400;
      throw err;
    }
  }

  const notesVal = customer_notes ? String(customer_notes).trim() : '';
  if (notesVal && (notesVal.length < 3 || notesVal.length > 200)) {
    const err = new Error('Customer Notes must be between 3 and 200 characters');
    err.statusCode = 400;
    throw err;
  }
};

const parseNumber = (value, fallback = 0) => {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseDateRange = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return null;
  const range = {};
  if (dateFrom) {
    const start = new Date(dateFrom);
    start.setHours(0, 0, 0, 0);
    range.gte = start;
  }
  if (dateTo) {
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }
  return range;
};

const mapInvoice = (invoice) => ({
  id: invoice.id,
  invoice_number: invoice.invoice_number,
  order_token: invoice.order_token,
  table_number: invoice.table_number,
  customer_name: invoice.customer_name,
  customer_phone: invoice.customer_phone,
  customer_address: invoice.customer_address,
  customer_gst: invoice.customer_gst,
  subtotal: invoice.subtotal,
  tax_percentage: invoice.tax_percentage,
  tax_amount: invoice.tax_amount,
  discount: invoice.discount,
  total: invoice.total,
  rounded_total: invoice.rounded_total,
  round_off: invoice.round_off,
  payment_method: invoice.payment_method,
  payment_status: invoice.payment_status,
  amount_paid: invoice.amount_paid,
  balance_due: invoice.balance_due,
  notes: invoice.notes,
  created_at: invoice.created_at,
  updated_at: invoice.updated_at,
  items: (invoice.items || []).map((item) => ({
    id: item.id,
    item_name: item.item_name,
    item_code: item.item_code,
    unit_name: item.unit_name || 'pcs',
    unit_symbol: item.unit_symbol || 'pcs',
    quantity: item.quantity,
    price_per_unit: item.price_per_unit,
    item_total: item.item_total
  }))
});

const buildTotals = ({ items, tax_percentage, discount }) => {
  const subtotal = parseFloat(items.reduce(
    (sum, item) => sum + parseNumber(item.item_total),
    0
  ).toFixed(2));
  const taxAmount = parseFloat((subtotal * (parseNumber(tax_percentage) / 100)).toFixed(2));
  const discountValue = parseFloat(parseNumber(discount).toFixed(2));
  const total = parseFloat((subtotal + taxAmount - discountValue).toFixed(2));
  const rounded_total = Math.round(total);
  const round_off = parseFloat((rounded_total - total).toFixed(2));
  return {
    subtotal,
    tax_amount: taxAmount,
    total,
    rounded_total,
    round_off
  };
};

const syncCustomerToOrders = async (tx, shopId, orderToken, customerName, customerPhone) => {
  if (!orderToken) return;
  const tokens = String(orderToken)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) return;

  await tx.restaurantOrder.updateMany({
    where: {
      shopId: parseInt(shopId, 10),
      order_token: { in: tokens }
    },
    data: {
      customer_name: customerName ? String(customerName).trim() : null,
      customer_phone: customerPhone ? String(customerPhone).trim() : null
    }
  });
};


const normalizeItems = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const quantity = parseNumber(item.quantity, 0);
      const price = parseNumber(item.price_per_unit ?? item.price, 0);
      return {
        item_name: item.item_name || item.name || '',
        item_code: item.item_code || null,
        unit_name: item.unit_name || 'pcs',
        unit_symbol: item.unit_symbol || 'pcs',
        quantity,
        price_per_unit: price,
        item_total: quantity * price
      };
    })
    .filter((item) => item.item_name && item.quantity > 0);
};

const getRestaurantInvoices = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId, 10);
    const userRole = req.user.role;
    const userId = req.user.id;
    const {
      search = '',
      table,
      dateFrom,
      dateTo,
      sortBy = 'newest',
      page = 1,
      limit = 50
    } = req.query;

    const where = { shopId, isDeleted: false };

    // If not admin/owner/manager, only show invoices related to orders taken by the user
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      // We filter invoices that have an order_token belonging to the user
      where.order_token = {
        not: null
      };
      // Note: Since we can't easily join on comma-separated tokens in a single where, 
      // we'll filter by those invoices that *link* to an order taken by this user.
      // This is a bit complex with current schema, so we'll check the order relationship.
    }

    // Exact table filter (used by billing to avoid mixing old table sessions)
    if (table) {
      where.table_number = String(table).trim();
    }

    // --- Today Data Filtering ---
    // Default to today if no date range is provided
    let dateRange = parseDateRange(dateFrom, dateTo);
    if (!dateRange && !dateFrom && !dateTo) {
      const today = new Date();
      dateRange = parseDateRange(today, today);
    }

    if (dateRange) {
      where.created_at = dateRange;
    }

    if (search) {
      const searchValue = String(search).trim();
      if (searchValue) {
        where.OR = [
          { invoice_number: { contains: searchValue, mode: 'insensitive' } },
          { customer_name: { contains: searchValue, mode: 'insensitive' } },
          { table_number: { contains: searchValue, mode: 'insensitive' } },
          { order_token: { contains: searchValue, mode: 'insensitive' } }
        ];
      }
    }

    let orderBy = { created_at: 'desc' };
    if (sortBy === 'oldest') orderBy = { created_at: 'asc' };
    if (sortBy === 'amount_high') orderBy = { total: 'desc' };
    if (sortBy === 'amount_low') orderBy = { total: 'asc' };

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 50;
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch invoices
    const [rawItems, totalCount] = await prisma.$transaction([
      prisma.restaurantInvoice.findMany({
        where,
        include: { items: true },
        orderBy,
        skip,
        take: limitNumber
      }),
      prisma.restaurantInvoice.count({ where })
    ]);

    let finalItems = rawItems;

    // --- Post-fetch Validation for Users ---
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      // Filter out invoices where the associated order was NOT taken by the current user
      // We need to fetch the orders for these tokens to verify
      const tokens = rawItems.map(i => String(i.order_token || '').split(',').map(t => t.trim())).flat().filter(Boolean);
      if (tokens.length > 0) {
        const orders = await prisma.restaurantOrder.findMany({
          where: { shopId, order_token: { in: tokens } },
          select: { order_token: true, taken_by_id: true }
        });

        finalItems = rawItems.filter(inv => {
          const invTokens = String(inv.order_token || '').split(',').map(t => t.trim());
          // An invoice is visible if AT LEAST ONE of its linked orders was taken by this user
          return orders.some(o => invTokens.includes(o.order_token) && o.taken_by_id === parseInt(userId, 10));
        });
      } else {
        // If no tokens, we can't verify ownership, so we hide it for safety if not admin
        finalItems = [];
      }
    }

    res.json({
      success: true,
      invoices: finalItems.map(mapInvoice),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        totalCount: userRole === 'shop_owner' || userRole === 'admin' ? totalCount : finalItems.length,
        totalPages: Math.ceil((userRole === 'shop_owner' || userRole === 'admin' ? totalCount : finalItems.length) / limitNumber)
      }
    });
  } catch (error) {
    console.error('Get restaurant invoices error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
};

const getRestaurantInvoiceById = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId, 10);
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const invoice = await prisma.restaurantInvoice.findFirst({
      where: { id: parseInt(id, 10), shopId },
      include: { items: true }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Validation: Check ownership via orders (skipped for owner/admin/manager)
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      const tokens = String(invoice.order_token || '').split(',').map(t => t.trim()).filter(Boolean);
      const orders = await prisma.restaurantOrder.findMany({
        where: { shopId, order_token: { in: tokens } },
        select: { taken_by_id: true }
      });
      const isOwner = orders.some(o => o.taken_by_id === parseInt(userId, 10));
      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Access denied to this invoice' });
      }
    }

    res.json({ success: true, invoice: mapInvoice(invoice) });
  } catch (error) {
    console.error('Get restaurant invoice error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
  }
};

const createRestaurantInvoice = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }
    const shopId = parseInt(req.user.shopId, 10);
    const {
      order_token,
      table_number,
      customer_name,
      customer_phone,
      customer_address,
      customer_gst,
      tax_percentage,
      discount,
      payment_method,
      payment_status,
      notes,
      items
    } = req.body;

    validateCustomerInput(customer_name, customer_phone, notes);

    const normalizedItems = normalizeItems(items);
    if (normalizedItems.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one item is required' });
    }

    // Fetch ShopSettings for default_tax
    const settings = await prisma.shopSettings.findUnique({
      where: { shopId }
    });
    const defaultTaxPct = settings && !isNaN(parseFloat(settings.default_tax)) 
      ? parseFloat(settings.default_tax) 
      : 0.0;

    let taxPct = defaultTaxPct;
    if (tax_percentage !== undefined && tax_percentage !== null) {
      const parsedTax = parseFloat(tax_percentage);
      if (!isNaN(parsedTax)) {
        taxPct = parsedTax;
      }
    }

    const totals = buildTotals({
      items: normalizedItems,
      tax_percentage: taxPct,
      discount: discount ?? 0
    });

    const reqAmountPaid = req.body.amount_paid !== undefined ? parseFloat(req.body.amount_paid) : null;
    let statusValue = payment_status || 'Unpaid';
    const totalAmount = totals.rounded_total;
    let amountPaid = statusValue.toLowerCase() === 'paid' ? totalAmount : 0;

    if (reqAmountPaid !== null) {
      amountPaid = reqAmountPaid;
    }

    if (amountPaid >= totalAmount) {
      statusValue = 'Paid';
    } else if (amountPaid > 0) {
      statusValue = 'Partial';
    } else {
      statusValue = 'Unpaid';
    }

    const balanceDue = Math.max(0, totalAmount - amountPaid);

    const invoice = await prisma.$transaction(async (tx) => {
      const invoice_number = await reserveNextBillNumber(tx, shopId);

      let finalTableNumber = table_number ? String(table_number).trim() : null;
      if (!finalTableNumber && order_token) {
        const tokens = String(order_token).split(',').map(t => t.trim()).filter(Boolean);
        if (tokens.length > 0) {
          const order = await tx.restaurantOrder.findFirst({
            where: { shopId, order_token: { in: tokens } }
          });
          if (order) {
            if (order.table_number) {
              finalTableNumber = order.table_number;
            } else if (order.platform && String(order.platform).toLowerCase().includes('take')) {
              finalTableNumber = 'Take away';
            }
          }
        }
      }

      const created = await tx.restaurantInvoice.create({
        data: {
          invoice_number,
          order_token: order_token ? String(order_token).trim() : null,
          table_number: finalTableNumber,
          customer_name: customer_name
            ? String(customer_name).trim()
            : finalTableNumber
              ? finalTableNumber.startsWith('Table') || finalTableNumber === 'Take away'
                ? finalTableNumber
                : `Table ${finalTableNumber}`
              : 'Restaurant Customer',
          customer_phone: customer_phone ? String(customer_phone).trim() : null,
          customer_address: customer_address ? String(customer_address).trim() : null,
          customer_gst: customer_gst ? String(customer_gst).trim() : null,
          subtotal: totals.subtotal,
          tax_percentage: taxPct,
          tax_amount: totals.tax_amount,
          discount: parseNumber(discount, 0),
          total: totals.total,
          rounded_total: totals.rounded_total,
          round_off: totals.round_off,
          payment_method: payment_method || 'Cash',
          payment_status: statusValue,
          amount_paid: amountPaid,
          balance_due: balanceDue,
          notes: notes ? String(notes).trim() : null,
          shopId,
          items: {
            create: normalizedItems.map((item) => ({
              item_name: item.item_name,
              item_code: item.item_code,
              unit_name: item.unit_name,
              unit_symbol: item.unit_symbol,
              quantity: item.quantity,
              price_per_unit: item.price_per_unit,
              item_total: item.item_total
            }))
          }
        },
        include: { items: true }
      });

      await releaseTableIfPaid(tx, shopId, created.table_number, created.payment_status);
      await completeOrdersIfPaid(tx, shopId, created.order_token, created.payment_status);
      await syncCustomerToOrders(tx, shopId, created.order_token, created.customer_name, created.customer_phone);

      return created;
    });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Create Bill',
      `Created bill ${invoice.invoice_number} • ${invoice.table_number ? `Table ${invoice.table_number}` : 'Customer'} • Total: ₹${invoice.rounded_total}`,
      'Restaurant Billing',
      'Success'
    );

    res.status(201).json({ success: true, invoice: mapInvoice(invoice) });
  } catch (error) {
    console.error('Create restaurant invoice error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Invoice number already exists' });
    }
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Create Bill',
      'Failed to create bill' + (error.message ? `: ${error.message}` : ''),
      'Restaurant Billing',
      'Failed'
    );
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message || 'Failed to create invoice' });
  }
};

const updateRestaurantInvoice = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }
    const shopId = parseInt(req.user.shopId, 10);
    const { id } = req.params;
    const {
      table_number,
      customer_name,
      customer_phone,
      customer_address,
      customer_gst,
      tax_percentage,
      discount,
      payment_method,
      payment_status,
      amount_paid,
      notes,
      items
    } = req.body;

    const normalizedItems = items !== undefined ? normalizeItems(items) : null;
    if (normalizedItems && normalizedItems.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one item is required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.restaurantInvoice.findFirst({
        where: { id: parseInt(id, 10), shopId },
        include: { items: true }
      });

      if (!invoice) return null;

      const mergedName = customer_name !== undefined ? customer_name : invoice.customer_name;
      const mergedPhone = customer_phone !== undefined ? customer_phone : invoice.customer_phone;
      const mergedNotes = notes !== undefined ? notes : invoice.notes;
      validateCustomerInput(mergedName, mergedPhone, mergedNotes);

      const updatedData = {
        table_number: table_number !== undefined ? String(table_number).trim() : undefined,
        customer_name: customer_name !== undefined ? String(customer_name).trim() : undefined,
        customer_phone: customer_phone !== undefined ? (customer_phone ? String(customer_phone).trim() : null) : undefined,
        customer_address: customer_address !== undefined ? (customer_address ? String(customer_address).trim() : null) : undefined,
        customer_gst: customer_gst !== undefined ? (customer_gst ? String(customer_gst).trim() : null) : undefined,
        tax_percentage: tax_percentage !== undefined ? parseNumber(tax_percentage, 0) : undefined,
        discount: discount !== undefined ? parseNumber(discount, 0) : undefined,
        payment_method: payment_method !== undefined ? payment_method : undefined,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : undefined
      };

      let totals = null;
      if (normalizedItems) {
        totals = buildTotals({
          items: normalizedItems,
          tax_percentage: tax_percentage ?? invoice.tax_percentage,
          discount: discount ?? invoice.discount
        });

        updatedData.subtotal = totals.subtotal;
        updatedData.tax_amount = totals.tax_amount;
        updatedData.total = totals.total;
        updatedData.rounded_total = totals.rounded_total;
        updatedData.round_off = totals.round_off;
      }

      const reqAmountPaid = amount_paid !== undefined ? parseFloat(amount_paid) : null;
      let finalStatus = payment_status !== undefined ? payment_status : invoice.payment_status;
      let finalTotal = totals?.rounded_total ?? invoice.rounded_total;
      let finalAmountPaid = reqAmountPaid !== null ? reqAmountPaid : invoice.amount_paid;

      if (payment_status !== undefined) {
        if (payment_status.toLowerCase() === 'paid') {
          finalAmountPaid = finalTotal;
        } else if (payment_status.toLowerCase() === 'unpaid' && reqAmountPaid === null) {
          finalAmountPaid = 0;
        }
      }

      if (finalAmountPaid >= finalTotal) {
        finalStatus = 'Paid';
      } else if (finalAmountPaid > 0) {
        finalStatus = 'Partial';
      } else {
        finalStatus = 'Unpaid';
      }

      updatedData.payment_status = finalStatus;
      updatedData.amount_paid = finalAmountPaid;
      updatedData.balance_due = Math.max(0, finalTotal - finalAmountPaid);

      const updated = await tx.restaurantInvoice.update({
        where: { id: invoice.id },
        data: updatedData,
        include: { items: true }
      });

      if (normalizedItems) {
        await tx.restaurantInvoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
        await tx.restaurantInvoiceItem.createMany({
          data: normalizedItems.map((item) => ({
            invoiceId: invoice.id,
            item_name: item.item_name,
            item_code: item.item_code,
            unit_name: item.unit_name,
            unit_symbol: item.unit_symbol,
            quantity: item.quantity,
            price_per_unit: item.price_per_unit,
            item_total: item.item_total
          }))
        });
      }

      const refreshed = await tx.restaurantInvoice.findFirst({
        where: { id: invoice.id },
        include: { items: true }
      });

      await releaseTableIfPaid(
        tx,
        shopId,
        refreshed?.table_number,
        refreshed?.payment_status
      );
      await completeOrdersIfPaid(
        tx,
        shopId,
        refreshed?.order_token,
        refreshed?.payment_status
      );
      await syncCustomerToOrders(
        tx,
        shopId,
        refreshed?.order_token,
        refreshed?.customer_name,
        refreshed?.customer_phone
      );

      return refreshed;
    });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    await createLog(
      req,
      req.user.id,
      shopId,
      'Update Bill',
      `Updated bill ${result.invoice_number}`,
      'Restaurant Billing',
      'Success'
    );

    res.json({ success: true, invoice: mapInvoice(result) });
  } catch (error) {
    console.error('Update restaurant invoice error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Update Bill',
      `Failed to update bill ${req.params?.id || ''}`.trim() + (error.message ? `: ${error.message}` : ''),
      'Restaurant Billing',
      'Failed'
    );
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message || 'Failed to update invoice' });
  }
};

const deleteRestaurantInvoice = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }
    const shopId = parseInt(req.user.shopId, 10);
    const { id } = req.params;
    const deleted = await prisma.restaurantInvoice.updateMany({
      where: { id: parseInt(id, 10), shopId },
      data: { isDeleted: true }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    await createLog(
      req,
      req.user.id,
      shopId,
      'Delete Bill',
      `Deleted bill ${id}`,
      'Restaurant Billing',
      'Success'
    );

    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete restaurant invoice error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Delete Bill',
      `Failed to delete bill ${req.params?.id || ''}`.trim(),
      'Restaurant Billing',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to delete invoice' });
  }
};

const getDeletedInvoices = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }
    const shopId = parseInt(req.user.shopId, 10);
    const invoices = await prisma.restaurantInvoice.findMany({
      where: { shopId, isDeleted: true },
      include: { items: true },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, invoices: invoices.map(mapInvoice) });
  } catch (error) {
    console.error('Get deleted invoices error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deleted invoices' });
  }
};

const restoreInvoice = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }
    const shopId = parseInt(req.user.shopId, 10);
    const { id } = req.params;
    const restored = await prisma.restaurantInvoice.updateMany({
      where: { id: parseInt(id, 10), shopId, isDeleted: true },
      data: { isDeleted: false }
    });

    if (restored.count === 0) {
      return res.status(404).json({ success: false, error: 'Deleted invoice not found' });
    }

    await createLog(
      req,
      req.user.id,
      shopId,
      'Restore Bill',
      `Restored bill ${id}`,
      'Restaurant Billing',
      'Success'
    );

    res.json({ success: true, message: 'Invoice restored successfully' });
  } catch (error) {
    console.error('Restore invoice error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Restore Bill',
      `Failed to restore bill ${req.params?.id || ''}`.trim(),
      'Restaurant Billing',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to restore invoice' });
  }
};

const permanentlyDeleteInvoice = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }
    const shopId = parseInt(req.user.shopId, 10);
    const { id } = req.params;
    const deleted = await prisma.restaurantInvoice.deleteMany({
      where: { id: parseInt(id, 10), shopId, isDeleted: true }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ success: false, error: 'Deleted invoice not found' });
    }

    await createLog(
      req,
      req.user.id,
      shopId,
      'Permanently Delete Bill',
      `Permanently deleted bill ${id}`,
      'Restaurant Billing',
      'Success'
    );

    res.json({ success: true, message: 'Invoice permanently deleted' });
  } catch (error) {
    console.error('Permanent delete invoice error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Permanently Delete Bill',
      `Failed to permanently delete bill ${req.params?.id || ''}`.trim(),
      'Restaurant Billing',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to permanently delete invoice' });
  }
};

module.exports = {
  getRestaurantInvoices,
  getRestaurantInvoiceById,
  createRestaurantInvoice,
  updateRestaurantInvoice,
  deleteRestaurantInvoice,
  getDeletedInvoices,
  restoreInvoice,
  permanentlyDeleteInvoice
};
