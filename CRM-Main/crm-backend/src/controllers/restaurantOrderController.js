const prisma = require('../lib/prisma');
const { createLog } = require('./logController');

const makeFallbackOrderToken = ({ table_number, platform }) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const scope = table_number ? String(table_number).trim() : platform ? String(platform).trim() : 'X';
  return `ORD-${scope}-${timestamp}-${random}`;
};

const reserveNextOrderToken = async (tx, shopId, { table_number, platform }) => {
  try {
    const settings = await tx.shopSettings.upsert({
      where: { shopId: parseInt(shopId, 10) },
      update: { order_counter: { increment: 1 } },
      create: {
        shopId: parseInt(shopId, 10),
        order_prefix: 'ORD-',
        order_counter: 2,
        invoice_prefix: 'INV-',
        invoice_counter: 1,
        invoice_notes: '',
        default_tax: 0.0,
        stock_deduction: true
      }
    });

    const prefix = settings.order_prefix || 'ORD-';
    const counterUsed = (settings.order_counter || 2) - 1;
    return `${prefix}${String(counterUsed).padStart(2, '0')}`;
  } catch (error) {
    // Backward-compatible: if Prisma/DB hasn't been migrated for order fields yet.
    const msg = String(error?.message || '');
    if (msg.includes('Unknown arg') || msg.includes('order_counter') || msg.includes('order_prefix')) {
      return makeFallbackOrderToken({ table_number, platform });
    }
    return makeFallbackOrderToken({ table_number, platform });
  }
};

const ALLOWED_STATUSES = new Set([
  'pending',
  'preparing',
  'ready',
  'served',
  'completed',
  'cancelled'
]);

const extractTokenFromCreateOrderLog = (description) => {
  if (!description) return null;
  const text = String(description);
  const m = text.match(/Created order\s+([^\s(]+)/i);
  return m?.[1] ? String(m[1]).trim() : null;
};

const enrichTakenByFromLogs = async ({ shopId, orders, createdAtRange }) => {
  const needs = (orders || []).filter(
    (o) => !o?.taken_by_id && !o?.taken_by_name
  );
  if (needs.length === 0) return orders;

  const minCreated = needs.reduce((min, o) => {
    const t = o?.created_at ? new Date(o.created_at).getTime() : NaN;
    return Number.isFinite(t) ? Math.min(min, t) : min;
  }, Number.POSITIVE_INFINITY);
  const maxCreated = needs.reduce((max, o) => {
    const t = o?.created_at ? new Date(o.created_at).getTime() : NaN;
    return Number.isFinite(t) ? Math.max(max, t) : max;
  }, 0);

  const whereCreatedAt =
    createdAtRange ||
    (Number.isFinite(minCreated) && maxCreated > 0
      ? {
        gte: new Date(minCreated - 60 * 60 * 1000),
        lte: new Date(maxCreated + 60 * 60 * 1000)
      }
      : undefined);

  try {
    const logs = await prisma.activityLog.findMany({
      where: {
        shopId: parseInt(shopId, 10),
        module: 'Restaurant Orders',
        action: 'Create Order',
        status: 'Success',
        ...(whereCreatedAt ? { createdAt: whereCreatedAt } : {})
      },
      include: { user: { select: { id: true, name: true, username: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5000
    });

    const byToken = new Map();
    for (const log of logs) {
      const token = extractTokenFromCreateOrderLog(log.description);
      if (!token) continue;
      if (byToken.has(token)) continue;
      const name =
        log.user?.name || log.user?.username || log.user?.email || null;
      byToken.set(token, {
        id: log.user?.id || null,
        name: name ? String(name).trim() : null
      });
    }

    return orders.map((o) => {
      if (o?.taken_by_id || o?.taken_by_name) return o;
      const hit = byToken.get(o?.order_token);
      if (!hit) return o;
      return {
        ...o,
        taken_by_id: hit.id || o.taken_by_id,
        taken_by_name: hit.name || o.taken_by_name
      };
    });
  } catch {
    return orders;
  }
};

const mapOrder = (order) => ({
  id: order.id,
  order_token: order.order_token,
  table_number: order.table_number,
  platform: order.platform,
  taken_by_id: order.taken_by_id,
  taken_by_name: order.taken_by_name,
  status: order.status,
  total_amount: order.total_amount,
  customer_name: order.customer_name,
  customer_phone: order.customer_phone,
  customer_notes: order.customer_notes,
  is_self_order: order.is_self_order || false,
  created_at: order.created_at,
  updated_at: order.updated_at,
  items_count: order.items ? order.items.length : 0,
  items: (order.items || []).map((item) => ({
    id: item.id,
    menu_item_id: item.menu_item_id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    notes: item.notes || ''
  }))
});

const parseStatusFilter = (statusValue) => {
  if (!statusValue) return null;
  const statuses = String(statusValue)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => ALLOWED_STATUSES.has(s));
  return statuses.length > 0 ? statuses : null;
};

const buildDateRange = (dateValue) => {
  if (!dateValue) return null;
  const value = String(dateValue).toLowerCase();
  const now = new Date();

  if (value === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  const toRange = (date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  };

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return toRange(parsed);
};

const getOrders = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { status, search, table, date } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    const where = {
      shopId: parseInt(shopId, 10)
    };

    // All restaurant staff (owners, admins, managers, and staff) should see all orders for their shop.
    // So we do not restrict by taken_by_id.

    const statusFilter = parseStatusFilter(status);
    if (statusFilter) {
      where.status = { in: statusFilter };
    }

    if (table) {
      where.table_number = String(table).trim();
    }

    if (search) {
      const searchValue = String(search).trim();
      if (searchValue) {
        where.OR = [
          { order_token: { contains: searchValue, mode: 'insensitive' } },
          { table_number: { contains: searchValue, mode: 'insensitive' } },
          { platform: { contains: searchValue, mode: 'insensitive' } }
        ];
      }
    }

    // --- Today Data Filtering ---
    // If no date is specified, do not default to today (return all orders)
    const dateRange = date ? buildDateRange(date) : null;
    if (dateRange) {
      where.created_at = {
        gte: dateRange.start,
        lt: dateRange.end
      };
    }

    const orders = await prisma.restaurantOrder.findMany({
      where,
      include: { items: true },
      orderBy: { created_at: 'desc' }
    });

    const mapped = orders.map(mapOrder);
    const enriched = await enrichTakenByFromLogs({
      shopId,
      orders: mapped,
      createdAtRange: dateRange
        ? { gte: dateRange.start, lte: dateRange.end }
        : undefined
    });

    // Enrich with payment info from invoices
    const tokens = enriched.map(o => o.order_token).filter(Boolean);
    let finalOrders = enriched;
    if (tokens.length > 0) {
      try {
        const invoices = await prisma.restaurantInvoice.findMany({
          where: {
            shopId: parseInt(shopId, 10),
            isDeleted: false,
            OR: tokens.length <= 50 ? tokens.map(t => ({ order_token: { contains: t } })) : undefined
          },
          select: { order_token: true, payment_method: true, payment_status: true }
        });

        if (invoices.length > 0) {
          finalOrders = enriched.map(o => {
            const inv = invoices.find(i => {
              const invTokens = String(i.order_token || '').split(',').map(t => t.trim());
              return invTokens.includes(o.order_token);
            });
            if (inv) {
              return { ...o, payment_method: inv.payment_method, payment_status: inv.payment_status };
            }
            return o;
          });
        }
      } catch (err) {
        console.error('Error enriching orders with payment info:', err);
      }
    }

    res.json({ success: true, orders: finalOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const where = { id: parseInt(id, 10), shopId: parseInt(shopId, 10) };
    
    // Access is allowed for all restaurant staff of this shop.

    const order = await prisma.restaurantOrder.findFirst({
      where,
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found or access denied' });
    }

    const mapped = mapOrder(order);

    // Fetch associated invoice to show payment details if available
    const invoice = await prisma.restaurantInvoice.findFirst({
      where: {
        shopId: parseInt(shopId, 10),
        OR: [
          { order_token: order.order_token },
          { order_token: { contains: `, ${order.order_token}` } },
          { order_token: { contains: `${order.order_token},` } }
        ]
      },
      select: {
        payment_method: true,
        payment_status: true
      }
    });

    if (invoice) {
      mapped.payment_method = invoice.payment_method;
      mapped.payment_status = invoice.payment_status;
    }

    const enrichedList = await enrichTakenByFromLogs({
      shopId,
      orders: [mapped],
      createdAtRange: mapped.created_at
        ? {
          gte: new Date(new Date(mapped.created_at).getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(new Date(mapped.created_at).getTime() + 24 * 60 * 60 * 1000)
        }
        : undefined
    });
    res.json({ success: true, order: enrichedList[0] || mapped });
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
};

const getOrderByToken = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { token } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    const where = {
      shopId: parseInt(shopId, 10),
      order_token: String(token).trim()
    };

    // Access is allowed for all restaurant staff of this shop.

    const order = await prisma.restaurantOrder.findFirst({
      where,
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found or access denied' });
    }

    const mapped = mapOrder(order);

    // Fetch associated invoice to show payment details if available
    const invoice = await prisma.restaurantInvoice.findFirst({
      where: {
        shopId: parseInt(shopId, 10),
        OR: [
          { order_token: order.order_token },
          { order_token: { contains: `, ${order.order_token}` } },
          { order_token: { contains: `${order.order_token},` } }
        ]
      },
      select: {
        payment_method: true,
        payment_status: true
      }
    });

    if (invoice) {
      mapped.payment_method = invoice.payment_method;
      mapped.payment_status = invoice.payment_status;
    }

    const enrichedList = await enrichTakenByFromLogs({
      shopId,
      orders: [mapped],
      createdAtRange: mapped.created_at
        ? {
          gte: new Date(new Date(mapped.created_at).getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(new Date(mapped.created_at).getTime() + 24 * 60 * 60 * 1000)
        }
        : undefined
    });
    res.json({ success: true, order: enrichedList[0] || mapped });
  } catch (error) {
    console.error('Get order by token error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
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

const normalizeItems = (items = []) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      menu_item_id: item.menu_item_id ? parseInt(item.menu_item_id, 10) : null,
      name: item.name ? String(item.name).trim() : '',
      quantity: parseInt(item.quantity, 10),
      price: parseFloat(item.price),
      notes: item.notes ? String(item.notes).trim() : null
    }))
    .filter(
      (item) =>
        item.name &&
        !Number.isNaN(item.quantity) &&
        item.quantity > 0 &&
        !Number.isNaN(item.price)
    );
};

const createOrder = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const takenById = req.user?.id ? parseInt(req.user.id, 10) : null;
    const takenByName = req.user?.name || req.user?.username || req.user?.email || null;
    const {
      table_number,
      platform,
      order_token,
      items,
      customer_name,
      customer_phone,
      customer_notes,
      status,
      total_amount
    } = req.body;
 
    validateCustomerInput(customer_name, customer_phone, customer_notes);

    if (!table_number && !platform) {
      return res
        .status(400)
        .json({ success: false, error: 'table_number or platform is required' });
    }

    const normalizedItems = normalizeItems(items);
    if (normalizedItems.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one valid item is required' });
    }

    const statusValue = status || 'pending';
    if (!ALLOWED_STATUSES.has(statusValue)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const amount = parseFloat(total_amount);
    if (Number.isNaN(amount)) {
      return res.status(400).json({ success: false, error: 'total_amount is required' });
    }

    // --- Duplicate submission guard ---
    // If the same user placed an order for the same table/platform with the same total within 10 seconds, reject it.
    const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
    const duplicateOrder = await prisma.restaurantOrder.findFirst({
      where: {
        shopId: parseInt(shopId, 10),
        ...(table_number ? { table_number: String(table_number).trim() } : {}),
        ...(platform ? { platform: String(platform).trim() } : {}),
        total_amount: amount,
        ...(takenById ? { taken_by_id: takenById } : {}),
        created_at: { gte: tenSecondsAgo }
      },
      include: { items: true },
      orderBy: { created_at: 'desc' }
    });

    if (duplicateOrder) {
      // Return existing order silently — frontend will navigate to receipt page as normal
      return res.json({ success: true, order: mapOrder(duplicateOrder), duplicate: true });
    }
    // --- End duplicate guard ---

    const order = await prisma.$transaction(async (tx) => {
      const tableValue = table_number ? String(table_number).trim() : null;
      const platformValue = platform ? String(platform).trim() : null;

      // 1. If it's a table order, verify table is 'available' and set it to 'occupied'
      if (tableValue) {
        const table = await tx.restaurantTable.findFirst({
          where: {
            shopId: parseInt(shopId, 10),
            table_number: tableValue
          }
        });

        if (!table) {
          throw new Error(`Table ${tableValue} not found`);
        }

        const tableStatus = String(table.status || '').toLowerCase();
        // Allow adding more orders on an already occupied table (common dine-in flow).
        if (!['available', 'reserved', 'occupied'].includes(tableStatus)) {
          // Custom error to be caught below
          const err = new Error(
            `Table ${tableValue} is not available for ordering (Current status: ${table.status})`
          );
          err.statusCode = 400;
          throw err;
        }

        await tx.restaurantTable.updateMany({
          where: { shopId: parseInt(shopId, 10), table_number: tableValue },
          data: { status: 'occupied' }
        });
      }

      const tokenValue = order_token
        ? String(order_token).trim()
        : await reserveNextOrderToken(tx, shopId, {
          table_number: tableValue,
          platform: platformValue
        });

      const baseData = {
        table_number: tableValue,
        platform: platformValue,
        order_token: tokenValue,
        taken_by_id: Number.isFinite(takenById) ? takenById : null,
        taken_by_name: takenByName ? String(takenByName).trim() : null,
        status: statusValue,
        total_amount: amount,
        customer_notes: customer_notes ? String(customer_notes).trim() : null,
        shopId: parseInt(shopId, 10),
        items: {
          create: normalizedItems.map((item) => ({
            menu_item_id: item.menu_item_id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes
          }))
        }
      };

      const withCustomer = {
        ...baseData,
        customer_name: customer_name ? String(customer_name).trim() : null,
        customer_phone: customer_phone ? String(customer_phone).trim() : null
      };

      // Backward compatible: handle older DB/Prisma without optional fields.
      const tryCreate = async (data) =>
        tx.restaurantOrder.create({ data, include: { items: true } });

      try {
        return await tryCreate(withCustomer);
      } catch (error) {
        const msg = String(error?.message || '');
        if (!msg.includes('Unknown arg')) throw error;

        // 1) Drop taken_by fields (older restaurant_orders table)
        const withoutTakenBy = { ...withCustomer };
        delete withoutTakenBy.taken_by_id;
        delete withoutTakenBy.taken_by_name;

        try {
          return await tryCreate(withoutTakenBy);
        } catch (error2) {
          const msg2 = String(error2?.message || '');
          if (!msg2.includes('Unknown arg')) throw error2;

          // 2) Drop customer fields too (very old schema)
          const withoutCustomer = { ...withoutTakenBy };
          delete withoutCustomer.customer_name;
          delete withoutCustomer.customer_phone;

          return await tryCreate(withoutCustomer);
        }
      }
    });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Create Order',
      `Created order ${order.order_token} (${order.table_number || order.platform || 'Online'}) • Items: ${order.items?.length || 0} • Total: ₹${order.total_amount}`,
      'Restaurant Orders',
      'Success'
    );

    res.status(201).json({ success: true, order: mapOrder(order) });
  } catch (error) {
    console.error('Create order error:', error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }

    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Order token already exists' });
    }
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Create Order',
      'Failed to create order: ' + error.message,
      'Restaurant Orders',
      'Failed'
    );
    res.status(500).json({ success: false, error: error.message || 'Failed to create order' });
  }
};

const updateOrder = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { id } = req.params;
    const {
      table_number,
      platform,
      status,
      customer_name,
      customer_phone,
      customer_notes,
      total_amount,
      items
    } = req.body;

    if (status !== undefined && !ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const updates = {
      table_number:
        table_number !== undefined ? (table_number ? String(table_number).trim() : null) : undefined,
      platform: platform !== undefined ? (platform ? String(platform).trim() : null) : undefined,
      status: status !== undefined ? status : undefined,
      customer_name:
        customer_name !== undefined ? (customer_name ? String(customer_name).trim() : null) : undefined,
      customer_phone:
        customer_phone !== undefined ? (customer_phone ? String(customer_phone).trim() : null) : undefined,
      customer_notes:
        customer_notes !== undefined ? (customer_notes ? String(customer_notes).trim() : null) : undefined,
      total_amount: total_amount !== undefined ? parseFloat(total_amount) : undefined
    };

    const normalizedItems = items !== undefined ? normalizeItems(items) : null;

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.restaurantOrder.findFirst({
        where: { id: parseInt(id, 10), shopId: parseInt(shopId, 10) },
        include: { items: true }
      });

      if (!order) return null;

      if (order.status === 'cancelled') {
        const err = new Error('Cannot edit a cancelled order');
        err.statusCode = 400;
        throw err;
      }

      const invoice = await tx.restaurantInvoice.findFirst({
        where: {
          shopId: parseInt(shopId, 10),
          isDeleted: false,
          OR: [
            { order_token: order.order_token },
            { order_token: { contains: `, ${order.order_token}` } },
            { order_token: { contains: `${order.order_token},` } }
          ]
        }
      });

      if (invoice) {
        const err = new Error('Cannot edit an order once a bill has been generated');
        err.statusCode = 400;
        throw err;
      }

      const mergedName = customer_name !== undefined ? customer_name : order.customer_name;
      const mergedPhone = customer_phone !== undefined ? customer_phone : order.customer_phone;
      const mergedNotes = customer_notes !== undefined ? customer_notes : order.customer_notes;
      validateCustomerInput(mergedName, mergedPhone, mergedNotes);

      let updated;
      try {
        updated = await tx.restaurantOrder.update({
          where: { id: order.id },
          data: updates,
          include: { items: true }
        });
      } catch (error) {
        const msg = String(error?.message || '');
        if (msg.includes('Unknown arg') && (msg.includes('customer_name') || msg.includes('customer_phone'))) {
          const { customer_name: _cn, customer_phone: _cp, ...safeUpdates } = updates;
          updated = await tx.restaurantOrder.update({
            where: { id: order.id },
            data: safeUpdates,
            include: { items: true }
          });
        } else {
          throw error;
        }
      }

      if (normalizedItems) {
        await tx.restaurantOrderItem.deleteMany({ where: { orderId: order.id } });
        await tx.restaurantOrderItem.createMany({
          data: normalizedItems.map((item) => ({
            orderId: order.id,
            menu_item_id: item.menu_item_id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes
          }))
        });
        const refreshed = await tx.restaurantOrder.findFirst({
          where: { id: order.id },
          include: { items: true }
        });
        return refreshed;
      }

      return updated;
    });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    await createLog(
      req,
      req.user.id,
      shopId,
      'Update Order',
      `Updated order ${result.order_token} (${result.table_number || result.platform || 'Online'})`,
      'Restaurant Orders',
      'Success'
    );

    res.json({ success: true, order: mapOrder(result) });
  } catch (error) {
    console.error('Update order error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Update Order',
      `Failed to update order ${req.params?.id || ''}`.trim() + (error.message ? `: ${error.message}` : ''),
      'Restaurant Orders',
      'Failed'
    );
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message || 'Failed to update order' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const parsedId = parseInt(id, 10);
    const parsedShopId = parseInt(shopId, 10);

    const order = await prisma.restaurantOrder.findFirst({
      where: { id: parsedId, shopId: parsedShopId },
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (status === 'cancelled') {
      const invoice = await prisma.restaurantInvoice.findFirst({
        where: {
          shopId: parsedShopId,
          isDeleted: false,
          OR: [
            { order_token: order.order_token },
            { order_token: { contains: `, ${order.order_token}` } },
            { order_token: { contains: `${order.order_token},` } }
          ]
        }
      });

      if (invoice && String(invoice.payment_status).toLowerCase() === 'paid') {
        return res.status(400).json({ success: false, error: 'Cannot cancel order after the bill is paid' });
      }
    }

    await prisma.restaurantOrder.update({
      where: { id: order.id },
      data: { status }
    });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Update Order Status',
      `Order ${order.order_token}: ${order.status} → ${status}`,
      'Restaurant Orders',
      'Success'
    );

    // Free table on cancellation only (payment flow controls releasing the table when paid).
    if (status === 'cancelled' && order.table_number) {
      const activeCount = await prisma.restaurantOrder.count({
        where: {
          shopId: parsedShopId,
          table_number: order.table_number,
          status: { in: ['pending', 'preparing', 'ready'] }
        }
      });

      if (activeCount === 0) {
        await prisma.restaurantTable.updateMany({
          where: { shopId: parsedShopId, table_number: order.table_number },
          data: { status: 'available' }
        });
      }
    }

    res.json({ success: true, message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Update order status error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Update Order Status',
      `Failed to update order status ${req.params?.id || ''}`.trim(),
      'Restaurant Orders',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    const parsedShopId = parseInt(shopId, 10);

    const order = await prisma.restaurantOrder.findFirst({
      where: { id: parsedId, shopId: parsedShopId }
    });

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    await prisma.restaurantOrder.delete({
      where: { id: order.id }
    });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Delete Order',
      `Deleted order ${order.order_token} (${order.table_number || order.platform || 'Online'})`,
      'Restaurant Orders',
      'Success'
    );

    // NOTE: We do not auto-free tables on delete here.
    // Tables should be released by the billing flow when payment is marked as Paid.

    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Delete Order',
      `Failed to delete order ${req.params?.id || ''}`.trim(),
      'Restaurant Orders',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to delete order' });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  getOrderByToken,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder
};
