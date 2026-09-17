const prisma = require('../lib/prisma');
const { createLog } = require('./logController');

const toInt = (value) => {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
};

const parseYmdLocal = (value, { endOfDay = false } = {}) => {
  const [y, m, d] = String(value || '').split('-').map((v) => Number.parseInt(v, 10));
  if (!y || !m || !d) return new Date(NaN);
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
};

const buildDateRange = ({ dateFrom, dateTo } = {}) => {
  const hasFrom = Boolean(dateFrom);
  const hasTo = Boolean(dateTo);
  if (!hasFrom && !hasTo) return null;

  const range = {};
  if (hasFrom) {
    const start = parseYmdLocal(dateFrom, { endOfDay: false });
    if (!Number.isNaN(start.getTime())) range.gte = start;
  }
  if (hasTo) {
    const end = parseYmdLocal(dateTo, { endOfDay: true });
    if (!Number.isNaN(end.getTime())) range.lte = end;
  }
  return Object.keys(range).length ? range : null;
};

const safeFloat = (value) => {
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
};

exports.listJournals = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    if (!shopId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { page = 1, limit = 20, dateFrom, dateTo } = req.query || {};
    const take = toInt(limit) === -1 ? 200 : Math.min(Math.max(toInt(limit) || 20, 1), 200);
    const skip = toInt(limit) === -1 ? 0 : (Math.max(toInt(page) || 1, 1) - 1) * take;

    const where = { shopId };
    const range = buildDateRange({ dateFrom, dateTo });
    if (range) where.entryDate = range;

    const [total, entries] = await prisma.$transaction([
      prisma.serviceJournalEntry.count({ where }),
      prisma.serviceJournalEntry.findMany({
        where,
        orderBy: [{ entryDate: 'desc' }, { id: 'desc' }],
        skip,
        take,
        include: {
          createdBy: { select: { id: true, name: true, username: true } },
          lines: { orderBy: { id: 'asc' } }
        }
      })
    ]);

    res.json({
      success: true,
      data: entries,
      pagination: {
        total,
        page: Math.max(toInt(page) || 1, 1),
        limit: toInt(limit) === -1 ? -1 : take
      }
    });
  } catch (error) {
    console.error('Error listing journals:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

exports.createJournal = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    const userId = toInt(req.user?.id);
    if (!shopId || !userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { entryDate, reference, narration, lines } = req.body || {};
    if (!entryDate || !narration) return res.status(400).json({ success: false, message: 'entryDate and narration are required' });
    if (!Array.isArray(lines) || lines.length < 2) return res.status(400).json({ success: false, message: 'At least 2 lines are required' });

    const normalized = lines
      .map((l) => ({
        ledger: String(l?.ledger || '').trim(),
        debit: safeFloat(l?.debit),
        credit: safeFloat(l?.credit),
        description: l?.description !== undefined ? (String(l.description || '').trim() || null) : (String(l?.desc || '').trim() || null)
      }))
      .filter((l) => l.ledger);

    if (normalized.length < 2) return res.status(400).json({ success: false, message: 'At least 2 ledger lines with ledger name are required' });

    const totalDebit = normalized.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = normalized.reduce((s, l) => s + (l.credit || 0), 0);
    if (!(totalDebit > 0 && Math.abs(totalDebit - totalCredit) < 0.0001)) {
      return res.status(400).json({ success: false, message: 'Debit and Credit totals must be equal and greater than 0' });
    }

    const created = await prisma.serviceJournalEntry.create({
      data: {
        shopId,
        createdById: userId,
        entryDate: new Date(entryDate),
        reference: reference ? String(reference).trim() : null,
        narration: String(narration).trim(),
        status: 'Posted',
        lines: {
          create: normalized.map((l) => ({
            ledger: l.ledger,
            debit: l.debit,
            credit: l.credit,
            description: l.description
          }))
        }
      },
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        lines: { orderBy: { id: 'asc' } }
      }
    });

    await createLog(
      req,
      req.user.id,
      req.user.shopId,
      'SERVICE_JOURNAL_CREATE',
      `Created journal entry with narration: "${created.narration}"`,
      'Services',
      'Success'
    );

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating journal:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

exports.getJournal = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    if (!shopId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'Invalid id' });

    const entry = await prisma.serviceJournalEntry.findFirst({
      where: { id, shopId },
      include: {
        createdBy: { select: { id: true, name: true, username: true } },
        lines: { orderBy: { id: 'asc' } }
      }
    });
    if (!entry) return res.status(404).json({ success: false, message: 'Not found' });

    res.json({ success: true, data: entry });
  } catch (error) {
    console.error('Error getting journal:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

const monthKey = (date) => {
  const dt = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

exports.getReport = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    if (!shopId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { key } = req.params;
    const { dateFrom, dateTo } = req.query || {};
    const range = buildDateRange({ dateFrom, dateTo });

    const reportKey = String(key || '').toLowerCase();

    if (reportKey === 'trial') {
      const where = { shopId };
      if (range) where.entryDate = range;

      const entries = await prisma.serviceJournalEntry.findMany({
        where,
        include: { lines: true },
        orderBy: [{ entryDate: 'desc' }, { id: 'desc' }],
        take: 200
      });

      const acc = new Map();
      for (const e of entries) {
        for (const l of e.lines || []) {
          const name = String(l.ledger || '').trim() || 'Unknown';
          const prev = acc.get(name) || { account: name, debit: 0, credit: 0 };
          prev.debit += safeFloat(l.debit);
          prev.credit += safeFloat(l.credit);
          acc.set(name, prev);
        }
      }

      const rows = Array.from(acc.values()).sort((a, b) => a.account.localeCompare(b.account));
      return res.json({ success: true, data: { rows } });
    }

    if (reportKey === 'pl') {
      const invWhere = { shopId };
      if (range) invWhere.issuedDate = range;
      invWhere.NOT = [{ status: { equals: 'Draft' } }];

      const invoices = await prisma.serviceInvoice.findMany({
        where: invWhere,
        select: { subtotal: true, amount: true, taxTotal: true }
      });
      const revenueTotal = (invoices || []).reduce((s, i) => s + safeFloat(i.subtotal || i.amount), 0);

      const expWhere = { shopId };
      if (range) expWhere.expenseDate = range;

      const expenses = await prisma.expense.findMany({
        where: expWhere,
        select: { amount: true, category: true, status: true }
      });

      const recognized = (expenses || []).filter((e) => {
        const st = String(e.status || '').toLowerCase();
        if (!st) return true;
        if (st === 'rejected') return false;
        return st === 'approved' || st === 'reimbursed' || st === 'paid' || st === 'success' || st === 'completed' || st === 'pending';
      });

      const byCat = new Map();
      for (const e of recognized) {
        const cat = String(e.category || 'General').trim() || 'General';
        byCat.set(cat, (byCat.get(cat) || 0) + safeFloat(e.amount));
      }
      const expenseRows = Array.from(byCat.entries())
        .map(([label, amount]) => ({ label, amount }))
        .sort((a, b) => b.amount - a.amount);

      const expenseTotal = expenseRows.reduce((s, r) => s + r.amount, 0);

      return res.json({
        success: true,
        data: {
          revenue: [{ label: 'Service Revenue', amount: revenueTotal }],
          expenses: expenseRows,
          totals: { revenue: revenueTotal, expenses: expenseTotal, net: revenueTotal - expenseTotal }
        }
      });
    }

    if (reportKey === 'client') {
      const invWhere = { shopId };
      if (range) invWhere.issuedDate = range;
      invWhere.NOT = [{ status: { equals: 'Draft' } }];

      const invoices = await prisma.serviceInvoice.findMany({
        where: invWhere,
        select: { clientName: true, amount: true, paid: true }
      });

      const map = new Map();
      for (const inv of invoices || []) {
        const name = String(inv.clientName || 'Unknown').trim() || 'Unknown';
        const prev = map.get(name) || { client: name, invoiced: 0, paid: 0, outstanding: 0 };
        prev.invoiced += safeFloat(inv.amount);
        prev.paid += safeFloat(inv.paid);
        map.set(name, prev);
      }
      const rows = Array.from(map.values()).map((r) => ({ ...r, outstanding: Math.max(0, r.invoiced - r.paid) }));
      rows.sort((a, b) => b.outstanding - a.outstanding);
      return res.json({ success: true, data: { rows } });
    }

    if (reportKey === 'expense') {
      const expWhere = { shopId };
      if (range) expWhere.expenseDate = range;

      const expenses = await prisma.expense.findMany({
        where: expWhere,
        select: { amount: true, category: true, status: true }
      });

      const map = new Map();
      for (const e of expenses || []) {
        const st = String(e.status || '').toLowerCase();
        if (st === 'rejected') continue;
        const cat = String(e.category || 'General').trim() || 'General';
        map.set(cat, (map.get(cat) || 0) + safeFloat(e.amount));
      }
      const rows = Array.from(map.entries())
        .map(([label, amount]) => ({ label, amount }))
        .sort((a, b) => b.amount - a.amount);
      return res.json({ success: true, data: { rows } });
    }

    if (reportKey === 'gst') {
      const invWhere = { shopId };
      if (range) invWhere.issuedDate = range;
      invWhere.NOT = [{ status: { equals: 'Draft' } }];

      const invoices = await prisma.serviceInvoice.findMany({
        where: invWhere,
        select: { issuedDate: true, subtotal: true, taxTotal: true, amount: true }
      });

      const monthMap = new Map();
      for (const inv of invoices || []) {
        const k = monthKey(inv.issuedDate);
        if (!k) continue;
        const prev = monthMap.get(k) || { month: k, taxable: 0, tax: 0, total: 0 };
        const taxable = safeFloat(inv.subtotal || inv.amount || 0);
        const tax = safeFloat(inv.taxTotal || 0);
        prev.taxable += taxable;
        prev.tax += tax;
        prev.total += tax;
        monthMap.set(k, prev);
      }

      const rows = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
      return res.json({ success: true, data: { rows } });
    }

    if (reportKey === 'bs') {
      const invWhere = { shopId };
      if (range) invWhere.issuedDate = range;
      invWhere.NOT = [{ status: { equals: 'Draft' } }];

      const invoices = await prisma.serviceInvoice.findMany({
        where: invWhere,
        select: { amount: true, paid: true }
      });

      const receivable = (invoices || []).reduce((s, i) => s + Math.max(0, safeFloat(i.amount) - safeFloat(i.paid)), 0);
      const cashIn = (invoices || []).reduce((s, i) => s + safeFloat(i.paid), 0);

      const expWhere = { shopId };
      if (range) expWhere.expenseDate = range;
      const expenses = await prisma.expense.findMany({ where: expWhere, select: { amount: true, status: true } });
      const pendingPayable = (expenses || []).reduce((s, e) => {
        const st = String(e.status || '').toLowerCase();
        if (st === 'approved') return s + safeFloat(e.amount);
        return s;
      }, 0);

      const assets = [
        { label: 'Cash (Collections)', amount: cashIn },
        { label: 'Accounts Receivable', amount: receivable }
      ];
      const liabilities = [{ label: 'Pending Payables (Approved)', amount: pendingPayable }];
      const equity = [{ label: 'Net Position', amount: Math.max(0, assets.reduce((s, a) => s + a.amount, 0) - liabilities.reduce((s, l) => s + l.amount, 0)) }];

      return res.json({ success: true, data: { assets, liabilities, equity } });
    }

    return res.status(400).json({ success: false, message: 'Invalid report key' });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    if (!shopId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { year } = req.query;
    const y = toInt(year);
    
    let invWhere = { shopId, NOT: [{ status: { equals: 'Draft' } }] };
    let expWhere = { shopId, NOT: [{ status: { equals: 'Rejected' } }] };

    if (y) {
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31, 23, 59, 59, 999);
      invWhere.issuedDate = { gte: start, lte: end };
      expWhere.expenseDate = { gte: start, lte: end };
    }

    const [invAgg, expAgg, invItemsAgg] = await prisma.$transaction([
      prisma.serviceInvoice.aggregate({
        where: invWhere,
        _sum: { subtotal: true, amount: true, paid: true }
      }),
      prisma.expense.aggregate({
        where: expWhere,
        _sum: { amount: true }
      }),
      prisma.inventoryItem.aggregate({
        where: { shopId },
        _sum: { selling_price: true }
      })
    ]);

    const revenue = safeFloat(invAgg?._sum?.subtotal ?? invAgg?._sum?.amount);
    const expenses = safeFloat(expAgg?._sum?.amount);
    const profit = revenue - expenses;
    const fiscalHealth = revenue > 0 ? Math.max(0, Math.min(100, ((profit / revenue) * 100))) : 0;
    const assetsValue = safeFloat(invItemsAgg?._sum?.selling_price);

    res.json({
      success: true,
      data: {
        assetsValue,
        revenue,
        expenses,
        profit,
        fiscalHealth
      }
    });
  } catch (error) {
    console.error('Error getting accounting overview:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};


exports.listSheets = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    if (!shopId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const sheets = await prisma.serviceAccountingSheet.findMany({
      where: { shopId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    res.json({ success: true, data: sheets });
  } catch (error) {
    console.error('Error listing sheets:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

exports.getSheet = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    if (!shopId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ success: false, message: 'Month and Year required' });

    const m = toInt(month);
    const y = toInt(year);

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const [revenueAgg, expenseAgg, invoices, expensesList, assetAgg, assetsList] = await prisma.$transaction([
      prisma.serviceInvoice.aggregate({
        where: {
          shopId,
          issuedDate: { gte: start, lte: end },
          NOT: [{ status: 'Draft' }]
        },
        _sum: { paid: true, amount: true }
      }),
      prisma.expense.aggregate({
        where: {
          shopId,
          expenseDate: { gte: start, lte: end },
          NOT: [{ status: 'Rejected' }]
        },
        _sum: { amount: true }
      }),
      prisma.serviceInvoice.findMany({
        where: {
          shopId,
          issuedDate: { gte: start, lte: end },
          NOT: [{ status: 'Draft' }]
        },
        include: { client: { select: { company: true } } },
        orderBy: { issuedDate: 'desc' }
      }),
      prisma.expense.findMany({
        where: {
          shopId,
          expenseDate: { gte: start, lte: end },
          NOT: [{ status: 'Rejected' }]
        },
        orderBy: { expenseDate: 'desc' }
      }),
      prisma.asset.aggregate({
        where: { shopId },
        _sum: { cost: true }
      }),
      prisma.asset.findMany({
        where: { shopId },
        orderBy: { purchaseDate: 'desc' }
      })
    ]);

    let sheet = await prisma.serviceAccountingSheet.findUnique({
      where: { shopId_month_year: { shopId, month: m, year: y } }
    });

    if (!sheet) {
      sheet = await prisma.serviceAccountingSheet.create({
        data: { shopId, month: m, year: y, adjustments: [] }
      });
    }

    const revenue = safeFloat(revenueAgg._sum.paid || revenueAgg._sum.amount);
    const expenses = safeFloat(expenseAgg._sum.amount);
    const totalAssets = safeFloat(assetAgg._sum.cost);

    res.json({
      success: true,
      data: {
        ...sheet,
        summary: {
          revenue,
          expenses,
          baseProfit: revenue - expenses,
          totalAssets
        },
        details: {
          invoices,
          expenses: expensesList,
          assets: assetsList
        }
      }
    });
  } catch (error) {
    console.error('Error getting sheet:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

exports.updateSheetAdjustments = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    if (!shopId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    const { adjustments } = req.body;

    const updated = await prisma.serviceAccountingSheet.update({
      where: { id: toInt(id), shopId },
      data: { adjustments: adjustments || [] }
    });

    await createLog(
      req,
      req.user.id,
      req.user.shopId,
      'SERVICE_SHEET_ADJUSTMENT_UPDATE',
      `Updated manual adjustments for accounting sheet #${id} (${updated.month}/${updated.year})`,
      'Services',
      'Success'
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating adjustments:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

exports.listFiscalPeriods = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    if (!shopId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const periods = await prisma.serviceFiscalPeriod.findMany({
      where: { shopId },
      orderBy: { startYear: 'desc' }
    });

    res.json({ success: true, data: periods });
  } catch (error) {
    console.error('Error listing fiscal periods:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};


exports.createFiscalPeriod = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    if (!shopId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { name, startMonth, startYear, endMonth, endYear } = req.body;
    
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Period name is required' });
    if (!startMonth || !startYear || !endMonth || !endYear) {
      return res.status(400).json({ success: false, message: 'All date fields (Start/End Month & Year) are required' });
    }

    // Logical validation: end date should be after start date
    const start = new Date(toInt(startYear), toInt(startMonth) - 1, 1);
    const end = new Date(toInt(endYear), toInt(endMonth) - 1, 1);
    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date' });
    }

    const period = await prisma.serviceFiscalPeriod.create({
      data: {
        shopId,
        name: name.trim(),
        startMonth: toInt(startMonth),
        startYear: toInt(startYear),
        endMonth: toInt(endMonth),
        endYear: toInt(endYear)
      }
    });
    await createLog(
      req,
      req.user.id,
      req.user.shopId,
      'SERVICE_FISCAL_PERIOD_CREATE',
      `Created fiscal period: ${name} (${startMonth}/${startYear} - ${endMonth}/${endYear})`,
      'Services',
      'Success'
    );

    res.json({ success: true, data: period });
  } catch (error) {
    console.error('Error creating fiscal period:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

exports.deleteFiscalPeriod = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    if (!shopId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;

    await prisma.serviceFiscalPeriod.delete({
      where: { id: toInt(id), shopId }
    });

    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('Error deleting fiscal period:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

exports.updateFiscalPeriod = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    if (!shopId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { id } = req.params;
    const { name, startMonth, startYear, endMonth, endYear } = req.body;

    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Period name is required' });
    if (!startMonth || !startYear || !endMonth || !endYear) {
      return res.status(400).json({ success: false, message: 'All date fields are required' });
    }

    const start = new Date(toInt(startYear), toInt(startMonth) - 1, 1);
    const end = new Date(toInt(endYear), toInt(endMonth) - 1, 1);
    if (end < start) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date' });
    }

    const updated = await prisma.serviceFiscalPeriod.update({
      where: { id: toInt(id), shopId },
      data: {
        name: name.trim(),
        startMonth: toInt(startMonth),
        startYear: toInt(startYear),
        endMonth: toInt(endMonth),
        endYear: toInt(endYear)
      }
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating fiscal period:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

exports.deleteYear = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    if (!shopId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { year } = req.params;
    const y = toInt(year);

    await prisma.serviceAccountingSheet.deleteMany({
      where: { shopId, year: y }
    });

    await createLog(
      req,
      req.user.id,
      req.user.shopId,
      'SERVICE_ACCOUNTING_YEAR_DELETE',
      `Deleted all accounting records for year ${y}`,
      'Services',
      'Success'
    );

    res.json({ success: true, message: `Deleted all entries for ${y}` });
  } catch (error) {
    console.error('Error deleting year:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};
