const prisma = require('../lib/prisma');
const { createLog } = require('./logController');

const normalizeRole = (value) => String(value || '').trim().toLowerCase();
const isManagerLikeRole = (role) => {
    const r = normalizeRole(role);
    return (
        r === 'manager' ||
        r === 'admin' ||
        r === 'administrator' ||
        r === 'owner' ||
        r === 'shop_owner' ||
        r === 'restaurant_owner' ||
        r.endsWith('_owner')
    );
};

const isApproverRole = (role) => isManagerLikeRole(role);

const toInt = (v) => {
  const n = parseInt(v);
  return Number.isFinite(n) ? n : null;
};

const buildWhere = ({ req, shopId, search, status, projectId }) => {
  const where = { shopId: parseInt(shopId) };
  const role = req.user.role;
  const isAdmin = isManagerLikeRole(role);

  const filters = [];

  if (search) {
    filters.push({
      OR: [
        { title: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
        { category: { contains: String(search), mode: 'insensitive' } },
        { notes: { contains: String(search), mode: 'insensitive' } }
      ]
    });
  }

  if (status && String(status).trim()) filters.push({ status: String(status).trim() });

  const pId = toInt(projectId);
  if (pId) filters.push({ serviceProjectId: pId });

  // RBAC for non-admins
  if (!isAdmin) {
    const employeeId = req.user.employeeId;
    const userId = req.user.id;
    filters.push({
      OR: [
        { userId: userId },
        {
          serviceProject: {
            teamMembers: { array_contains: employeeId }
          }
        }
      ]
    });
  }

  if (filters.length > 0) {
    where.AND = filters;
  }

  return where;
};

exports.listExpenses = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { page = 1, limit = 20, search = '', status, projectId } = req.query || {};

    const take = parseInt(limit);
    const skip = (parseInt(page) - 1) * (Number.isFinite(take) ? take : 20);

    const where = buildWhere({ req, shopId, search, status, projectId });

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        // Show newest entries first (stable ordering)
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: take === -1 ? undefined : skip,
        take: take === -1 ? undefined : take,
        include: {
          user: { select: { id: true, name: true, username: true } },
          reviewedBy: { select: { id: true, name: true, username: true } },
          serviceProject: { select: { id: true, projectId: true, name: true } }
        }
      }),
      prisma.expense.count({ where })
    ]);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        total,
        pages: take === -1 ? 1 : Math.ceil(total / take),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Error listing service expenses:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExpense = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid expense id' });
    const isAdmin = isManagerLikeRole(req.user.role);

    const where = { id, shopId: parseInt(shopId) };
    if (!isAdmin) {
      const employeeId = req.user.employeeId;
      const userId = req.user.id;
      where.OR = [
        { userId: userId },
        {
          serviceProject: {
            teamMembers: { array_contains: employeeId }
          }
        }
      ];
    }

    const expense = await prisma.expense.findFirst({
      where,
      include: {
        user: { select: { id: true, name: true, username: true } },
        reviewedBy: { select: { id: true, name: true, username: true } },
        serviceProject: { select: { id: true, projectId: true, name: true } }
      }
    });

    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (error) {
    console.error('Error fetching service expense:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const userId = req.user.id;
    const {
      title,
      description,
      category,
      amount,
      expenseDate,
      paymentMode,
      notes,
      serviceProjectId
    } = req.body || {};

    if (!title || amount === undefined) {
      return res.status(400).json({ success: false, message: 'title and amount are required' });
    }

    const pId = toInt(serviceProjectId);
    if (pId) {
      const project = await prisma.serviceProject.findFirst({
        where: { id: pId, shopId }
      });
      if (!project) return res.status(400).json({ success: false, message: 'Invalid project' });
    }

    const created = await prisma.expense.create({
      data: {
        shopId,
        userId,
        title: String(title).trim(),
        description: description ? String(description) : null,
        category: category ? String(category) : null,
        amount: parseFloat(amount),
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        paymentMode: paymentMode ? String(paymentMode) : null,
        notes: notes ? String(notes) : null,
        status: 'Pending',
        approvalStep: 1,
        serviceProjectId: pId || null
      }
    });

    await createLog(
      req,
      req.user.id,
      req.user.shopId,
      'SERVICE_EXPENSE_CREATE',
      `Created expense "${created.title}" for amount ${created.amount}`,
      'Services',
      'Success'
    );

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating service expense:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid expense id' });

    const existing = await prisma.expense.findFirst({
      where: { id, shopId }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Expense not found' });

    const {
      title,
      description,
      category,
      amount,
      expenseDate,
      paymentMode,
      notes,
      serviceProjectId
    } = req.body || {};

    const pId = serviceProjectId === null || serviceProjectId === '' ? null : toInt(serviceProjectId);
    if (pId) {
      const project = await prisma.serviceProject.findFirst({
        where: { id: pId, shopId }
      });
      if (!project) return res.status(400).json({ success: false, message: 'Invalid project' });
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        description: description !== undefined ? (description ? String(description) : null) : undefined,
        category: category !== undefined ? (category ? String(category) : null) : undefined,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        expenseDate: expenseDate !== undefined ? (expenseDate ? new Date(expenseDate) : null) : undefined,
        paymentMode: paymentMode !== undefined ? (paymentMode ? String(paymentMode) : null) : undefined,
        notes: notes !== undefined ? (notes ? String(notes) : null) : undefined,
        serviceProjectId: serviceProjectId !== undefined ? pId : undefined
      }
    });

    await createLog(
      req,
      req.user.id,
      req.user.shopId,
      'SERVICE_EXPENSE_UPDATE',
      `Updated expense #${id}`,
      'Services',
      'Success'
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating service expense:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid expense id' });

    const deleted = await prisma.expense.deleteMany({
      where: { id, shopId }
    });
    if (deleted.count === 0) return res.status(404).json({ success: false, message: 'Expense not found' });

    await createLog(
      req,
      req.user.id,
      req.user.shopId,
      'SERVICE_EXPENSE_DELETE',
      `Deleted expense #${id}`,
      'Services',
      'Success'
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting service expense:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateStatus = async ({ req, res, nextStatus }) => {
  try {
    if (!isApproverRole(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const shopId = parseInt(req.user.shopId);
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid expense id' });

    const existing = await prisma.expense.findFirst({
      where: { id, shopId }
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Expense not found' });

    const { rejectionReason } = req.body || {};
    const step =
      nextStatus === 'Pending' ? 1 :
        nextStatus === 'Rejected' ? 1 :
          nextStatus === 'Approved' ? 2 :
            nextStatus === 'Reimbursed' ? 3 : existing.approvalStep;

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        status: nextStatus,
        approvalStep: step,
        rejectionReason: nextStatus === 'Rejected' ? (rejectionReason ? String(rejectionReason) : null) : null,
        reviewedById: req.user.id,
        reviewedAt: new Date()
      }
    });

    await createLog(
      req,
      req.user.id,
      req.user.shopId,
      `SERVICE_EXPENSE_${String(nextStatus).toUpperCase()}`,
      `Marked expense #${id} as ${nextStatus}`,
      'Services',
      'Success'
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating expense status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveExpense = (req, res) => updateStatus({ req, res, nextStatus: 'Approved' });
exports.rejectExpense = (req, res) => updateStatus({ req, res, nextStatus: 'Rejected' });
exports.reimburseExpense = (req, res) => updateStatus({ req, res, nextStatus: 'Reimbursed' });

exports.uploadReceipt = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid expense id' });

    const expense = await prisma.expense.findFirst({
      where: { id, shopId }
    });
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });

    if (!req.file) return res.status(400).json({ success: false, message: 'receipt file is required' });

    const receiptUrl = `/uploads/${req.file.filename}`;
    const updated = await prisma.expense.update({
      where: { id },
      data: {
        receiptUrl,
        receiptName: req.file.originalname || null,
        receiptMime: req.file.mimetype || null
      }
    });

    await createLog(
      req,
      req.user.id,
      req.user.shopId,
      'SERVICE_EXPENSE_RECEIPT_UPLOAD',
      `Uploaded receipt for expense #${id}`,
      'Services',
      'Success'
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error uploading expense receipt:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
