const prisma = require('../lib/prisma');
const { createLog } = require('./logController');
const crypto = require('crypto');

const ALLOWED_STATUSES = new Set(['available', 'occupied', 'reserved', 'unavailable']);

const generateToken = () => {
  return crypto.randomBytes(12).toString('hex');
};

const TABLE_NUMBER_REGEX = /^[a-zA-Z0-9\-_/]+$/;
const INJECTION_OR_HTML_REGEX = /(<[^>]*>|javascript:|onerror=|onload=|onmouseover=|--|\/\*|\*\/|'\s+(or|and)\s+\S+\s*=\s*\S+|'\s*=\s*')/i;

const isInvalidText = (val) => {
  if (!val) return false;
  return INJECTION_OR_HTML_REGEX.test(String(val));
};

const getTables = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const userId = req.user.id;
    const { status } = req.query;

    const where = { shopId: parseInt(shopId) };
    if (status && ALLOWED_STATUSES.has(status)) {
      where.status = status;
    }
    const tables = await prisma.restaurantTable.findMany({
      where,
      orderBy: { table_number: 'asc' }
    });

    // --- Today Data Filtering & User Validation ---
    // Fetch the most recent active order for each table to get customer info
    // Only show occupancy info for TODAY and for the PARTICULAR USER (if not admin)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const activeOrdersWhere = {
      shopId: parseInt(shopId),
      status: { in: ['pending', 'preparing', 'ready'] },
      table_number: { not: null },
      created_at: {
        gte: todayStart,
        lt: todayEnd
      }
    };

    // If not admin/owner/manager/staff, only show info for their own orders
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager' && userRole !== 'Sales') {
      activeOrdersWhere.taken_by_id = parseInt(userId, 10);
    }

    const activeOrders = await prisma.restaurantOrder.findMany({
      where: activeOrdersWhere,
      orderBy: { created_at: 'desc' },
      select: {
        table_number: true,
        customer_name: true,
        customer_phone: true,
        taken_by_id: true
      }
    });

    // Attach customer info if table is occupied
    const tablesWithInfo = tables.map(t => {
      const order = activeOrders.find(o => o.table_number === t.table_number);
      return {
        ...t,
        // Only show 'occupied' status and info if the current user owns the active session today
        currentCustomer: order ? {
          name: order.customer_name || '',
          phone: order.customer_phone || ''
        } : null,
        // If table is occupied by someone else, we show it as occupied but without details to the non-admin user
        isOccupiedByOthers: !order && t.status === 'occupied'
      };
    });

    res.json({ success: true, tables: tablesWithInfo });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tables' });
  }
};

const createTable = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { table_number, capacity, status, section, notes } = req.body;

    // Validation: Only admin/owner/manager/staff can create tables
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager' && userRole !== 'Sales') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    if (!table_number || !capacity) {
      return res.status(400).json({ success: false, error: 'Table Number and Capacity are required' });
    }

    if (!TABLE_NUMBER_REGEX.test(table_number)) {
      return res.status(400).json({ success: false, error: 'Table Number can only contain letters, numbers, hyphens, underscores, and slashes (no spaces, emojis, or special characters)' });
    }

    if (isInvalidText(table_number) || isInvalidText(section) || isInvalidText(notes)) {
      return res.status(400).json({ success: false, error: 'Special characters, HTML/script tags, or potential SQL/XSS injections are not allowed' });
    }

    const cap = parseInt(capacity, 10);
    if (isNaN(cap) || cap < 1 || cap > 50) {
      return res.status(400).json({ success: false, error: 'Capacity must be between 1 and 50' });
    }

    if (notes !== undefined && notes !== null) {
      const trimmedNotes = String(notes).trim();
      if (trimmedNotes.length > 0 && trimmedNotes.length < 3) {
        return res.status(400).json({ success: false, error: 'Notes must be at least 3 characters' });
      }
      if (trimmedNotes.length > 100) {
        return res.status(400).json({ success: false, error: 'Notes cannot exceed 100 characters' });
      }
    }

    const statusValue = status || 'available';
    if (!ALLOWED_STATUSES.has(statusValue)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const table = await prisma.restaurantTable.create({
      data: {
        table_number: String(table_number).trim(),
        capacity: parseInt(capacity, 10),
        status: statusValue,
        section: section ? String(section).trim() : null,
        notes: notes ? String(notes).trim() : null,
        qr_token: generateToken(),
        shopId: parseInt(shopId)
      }
    });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Create Table',
      `Created table ${table.table_number} • Capacity: ${table.capacity} • Status: ${table.status}`,
      'Restaurant Tables',
      'Success'
    );

    res.status(201).json({ success: true, table });
  } catch (error) {
    console.error('Create table error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Create Table',
      'Failed to create table',
      'Restaurant Tables',
      'Failed'
    );
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Table number already used' });
    }
    res.status(500).json({ success: false, error: 'Failed to create table' });
  }
};

const updateTable = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { id } = req.params;
    const { table_number, capacity, status, section, notes } = req.body;

    // Validation: Only admin/owner/manager/staff can update tables
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager' && userRole !== 'Sales') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    if (status !== undefined && !ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    if (capacity !== undefined) {
      const cap = parseInt(capacity, 10);
      if (isNaN(cap) || cap < 1 || cap > 50) {
        return res.status(400).json({ success: false, error: 'Capacity must be between 1 and 50' });
      }
    }

    if (table_number !== undefined && !TABLE_NUMBER_REGEX.test(table_number)) {
      return res.status(400).json({ success: false, error: 'Table Number can only contain letters, numbers, hyphens, underscores, and slashes (no spaces, emojis, or special characters)' });
    }

    if (isInvalidText(table_number) || isInvalidText(section) || isInvalidText(notes)) {
      return res.status(400).json({ success: false, error: 'Special characters, HTML/script tags, or potential SQL/XSS injections are not allowed' });
    }

    if (notes !== undefined && notes !== null) {
      const trimmedNotes = String(notes).trim();
      if (trimmedNotes.length > 0 && trimmedNotes.length < 3) {
        return res.status(400).json({ success: false, error: 'Notes must be at least 3 characters' });
      }
      if (trimmedNotes.length > 100) {
        return res.status(400).json({ success: false, error: 'Notes cannot exceed 100 characters' });
      }
    }

    const table = await prisma.restaurantTable.updateMany({
      where: { id: parseInt(id), shopId: parseInt(shopId) },
      data: {
        table_number: table_number ? String(table_number).trim() : undefined,
        capacity: capacity !== undefined ? parseInt(capacity, 10) : undefined,
        status: status !== undefined ? status : undefined,
        section: section !== undefined ? (section ? String(section).trim() : null) : undefined,
        notes: notes !== undefined ? (notes ? String(notes).trim() : null) : undefined
      }
    });

    if (table.count === 0) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }

    await createLog(
      req,
      req.user.id,
      shopId,
      'Update Table',
      `Updated table ${id}`,
      'Restaurant Tables',
      'Success'
    );

    res.json({ success: true, message: 'Table updated successfully' });
  } catch (error) {
    console.error('Update table error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Update Table',
      `Failed to update table ${req.params?.id || ''}`.trim(),
      'Restaurant Tables',
      'Failed'
    );
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Table number already used' });
    }
    res.status(500).json({ success: false, error: 'Failed to update table' });
  }
};

const regenerateTableToken = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { id } = req.params;

    // Validation
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager' && userRole !== 'Sales') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const newToken = generateToken();
    const table = await prisma.restaurantTable.updateMany({
      where: { id: parseInt(id), shopId: parseInt(shopId) },
      data: { qr_token: newToken }
    });

    if (table.count === 0) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }

    res.json({ success: true, message: 'QR Token regenerated successfully', qr_token: newToken });
  } catch (error) {
    console.error('Regenerate token error:', error);
    res.status(500).json({ success: false, error: 'Failed to regenerate token' });
  }
};

const deleteTable = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { id } = req.params;

    // Validation
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager' && userRole !== 'Sales') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const deleted = await prisma.restaurantTable.deleteMany({
      where: { id: parseInt(id), shopId: parseInt(shopId) }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ success: false, error: 'Table not found' });
    }

    await createLog(
      req,
      req.user.id,
      shopId,
      'Delete Table',
      `Deleted table ${id}`,
      'Restaurant Tables',
      'Success'
    );

    res.json({ success: true, message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Delete table error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Delete Table',
      `Failed to delete table ${req.params?.id || ''}`.trim(),
      'Restaurant Tables',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to delete table' });
  }
};

module.exports = {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  regenerateTableToken
};

