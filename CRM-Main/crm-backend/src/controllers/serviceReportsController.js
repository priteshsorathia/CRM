const prisma = require('../lib/prisma');

const toInt = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

const ymd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseYmdLocal = (value, { endOfDay = false } = {}) => {
  const [y, m, d] = String(value || '').split('-').map((v) => parseInt(v, 10));
  if (!y || !m || !d) return new Date(NaN);
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
};

const getRange = ({ from, to }) => {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = now;

  const fromDate = from ? parseYmdLocal(from, { endOfDay: false }) : defaultFrom;
  const toDate = to ? parseYmdLocal(to, { endOfDay: true }) : new Date(defaultTo.getFullYear(), defaultTo.getMonth(), defaultTo.getDate(), 23, 59, 59, 999);

  return {
    from: Number.isNaN(fromDate.getTime()) ? defaultFrom : fromDate,
    to: Number.isNaN(toDate.getTime()) ? defaultTo : toDate,
  };
};

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (key) => {
  const [y, m] = String(key).split('-');
  const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return dt.toLocaleString('en-IN', { month: 'short' });
};

const safeServiceInvoice = () => prisma.serviceInvoice && typeof prisma.serviceInvoice.findMany === 'function';

exports.getDashboard = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const { from, to, projectId } = req.query || {};
    const range = getRange({ from, to });
    const pId = toInt(projectId);

    const invoiceWhere = { shopId };
    if (pId) invoiceWhere.projectId = pId;
    if (safeServiceInvoice()) invoiceWhere.issuedDate = { gte: range.from, lte: range.to };

    const expenseWhere = { shopId, expenseDate: { gte: range.from, lte: range.to } };
    if (pId) expenseWhere.serviceProjectId = pId;
    // Exclude rejected from cost metrics
    expenseWhere.NOT = [{ status: 'Rejected' }];

    const timesheetWhere = { shopId, date: { gte: range.from, lte: range.to } };
    if (pId) timesheetWhere.projectId = pId;

    const [projects, employees] = await Promise.all([
      prisma.serviceProject.findMany({
        where: { shopId },
        select: { id: true, projectId: true, name: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.findMany({
        where: { shopId, isDeleted: false },
        select: { id: true, role: true, status: true }
      })
    ]);

    const [expenses, invoices, tasks, timesheets] = await Promise.all([
      prisma.expense.findMany({
        where: expenseWhere,
        select: { id: true, amount: true, category: true, expenseDate: true, serviceProjectId: true, status: true }
      }),
      safeServiceInvoice()
        ? prisma.serviceInvoice.findMany({
          where: invoiceWhere,
          select: { id: true, amount: true, subtotal: true, paid: true, dueDate: true, issuedDate: true, clientName: true, projectId: true, projectName: true, clientId: true, status: true }
        })
        : Promise.resolve([]),
      prisma.serviceTask.findMany({
        where: { shopId, createdAt: { gte: range.from, lte: range.to }, ...(pId ? { projectId: pId } : {}) },
        select: { id: true, column: true }
      }),
      prisma.serviceTimesheet.findMany({
        where: timesheetWhere,
        select: { id: true, hours: true, billable: true }
      })
    ]);

    const revenue = invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const cost = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = revenue - cost;
    const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const totalHours = timesheets.reduce((sum, t) => sum + Number(t.hours || 0), 0);
    const billableHours = timesheets.filter(t => t.billable).reduce((sum, t) => sum + Number(t.hours || 0), 0);
    const billableUtilization = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

    const completedTasks = tasks.filter(t => String(t.column || '').toLowerCase() === 'completed').length;
    const projectVelocity = completedTasks;

    const todayKey = ymd(new Date());
    const todayStart = parseYmdLocal(todayKey, { endOfDay: false });
    const todayEnd = parseYmdLocal(todayKey, { endOfDay: true });
    const [todayExpenseAgg, todayInvoiceAgg] = await Promise.all([
      prisma.expense.aggregate({
        where: { shopId, expenseDate: { gte: todayStart, lte: todayEnd }, NOT: [{ status: 'Rejected' }] },
        _sum: { amount: true }
      }),
      safeServiceInvoice()
        ? prisma.serviceInvoice.aggregate({
          where: { shopId, issuedDate: { gte: todayStart, lte: todayEnd } },
          _sum: { amount: true }
        })
        : Promise.resolve({ _sum: { amount: 0 } })
    ]);
    const dailyCashFlow = (todayInvoiceAgg?._sum?.amount || 0) - (todayExpenseAgg?._sum?.amount || 0);

    // Project Profitability: revenue vs cost
    const projectRevenue = new Map();
    for (const inv of invoices) {
      const key = inv.projectId || null;
      if (!key) continue;
      projectRevenue.set(key, (projectRevenue.get(key) || 0) + Number(inv.amount || 0));
    }
    const projectCost = new Map();
    for (const exp of expenses) {
      const key = exp.serviceProjectId || null;
      if (!key) continue;
      projectCost.set(key, (projectCost.get(key) || 0) + Number(exp.amount || 0));
    }
    const projectProfitability = projects
      .map((p) => {
        const revenueVal = projectRevenue.get(p.id) || 0;
        const costVal = projectCost.get(p.id) || 0;
        return { name: p.name, revenue: revenueVal, cost: costVal, profit: revenueVal - costVal };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Revenue by Client
    const clientRevenueMap = new Map();
    for (const inv of invoices) {
      const key = String(inv.clientName || 'Unknown');
      clientRevenueMap.set(key, (clientRevenueMap.get(key) || 0) + Number(inv.amount || 0));
    }
    const clientRevenue = Array.from(clientRevenueMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Expense trends (month buckets) -> marketing/operations/payroll
    const monthBuckets = new Map();
    for (const exp of expenses) {
      const d = new Date(exp.expenseDate);
      if (Number.isNaN(d.getTime())) continue;
      const key = monthKey(d);
      if (!monthBuckets.has(key)) monthBuckets.set(key, { marketing: 0, operations: 0, payroll: 0 });
      const bucket = monthBuckets.get(key);
      const cat = String(exp.category || '').toLowerCase();
      const amt = Number(exp.amount || 0);
      if (cat.includes('marketing')) bucket.marketing += amt;
      else if (cat.includes('payroll') || cat.includes('salary')) bucket.payroll += amt;
      else bucket.operations += amt;
    }
    const expenseTrends = Array.from(monthBuckets.entries())
      .sort(([a], [b]) => String(a).localeCompare(String(b)))
      .map(([key, val]) => ({ month: monthLabel(key), ...val }));

    // Asset utilization (inventory categories as "assets")
    const [totalByCat, inUseByCat] = await Promise.all([
      prisma.inventoryItem.groupBy({
        by: ['category'],
        where: { shopId, category: { not: null } },
        _count: { _all: true }
      }),
      prisma.inventoryItem.groupBy({
        by: ['category'],
        where: { shopId, category: { not: null }, stockEntries: { some: {} } },
        _count: { _all: true }
      })
    ]);
    const inUseMap = new Map(inUseByCat.map((r) => [String(r.category), r._count._all]));
    const assetUtilization = totalByCat
      .map((r) => ({
        category: String(r.category || 'Other'),
        total: r._count._all,
        inUse: inUseMap.get(String(r.category)) || 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // Employee allocation (heuristic)
    const isBillableRole = (role) => {
      const r = String(role || '').toLowerCase();
      return ['developer', 'engineer', 'designer', 'qa', 'consultant', 'dev'].some((k) => r.includes(k));
    };
    const activeEmployees = employees.filter((e) => String(e.status || '').toLowerCase() === 'active');
    const billable = activeEmployees.filter((e) => isBillableRole(e.role)).length;
    const nonBillable = Math.max(0, activeEmployees.length - billable);
    const bench = Math.max(0, employees.length - activeEmployees.length);
    const employeeAllocation = [
      { name: 'Billable', value: billable },
      { name: 'Non-Billable', value: nonBillable },
      { name: 'Bench', value: bench }
    ];

    // Outstanding invoices aging buckets (based on due date)
    const now = new Date();
    const aging = { '0-30 Days': 0, '31-60 Days': 0, '61-90 Days': 0, '90+ Days': 0 };
    for (const inv of invoices) {
      const outstanding = Math.max(0, Number(inv.amount || 0) - Number(inv.paid || 0));
      if (outstanding <= 0) continue;
      const due = inv.dueDate ? new Date(inv.dueDate) : null;
      const daysLate = due ? Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      if (daysLate <= 30) aging['0-30 Days'] += outstanding;
      else if (daysLate <= 60) aging['31-60 Days'] += outstanding;
      else if (daysLate <= 90) aging['61-90 Days'] += outstanding;
      else aging['90+ Days'] += outstanding;
    }
    const outstandingInvoices = Object.entries(aging).map(([range, amount]) => ({ range, amount }));

    res.json({
      success: true,
      range: { from: ymd(range.from), to: ymd(range.to) },
      filters: {
        projects
      },
      quickStats: {
        netProfitMargin,
        billableUtilization,
        projectVelocity,
        dailyCashFlow
      },
      charts: {
        projectProfitability,
        clientRevenue,
        expenseTrends,
        assetUtilization,
        employeeAllocation,
        outstandingInvoices
      }
    });
  } catch (error) {
    console.error('Error building service reports dashboard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportCsv = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const { from, to, projectId } = req.query || {};
    const range = getRange({ from, to });
    const pId = toInt(projectId);

    const invoiceWhere = { shopId };
    if (pId) invoiceWhere.projectId = pId;
    if (safeServiceInvoice()) invoiceWhere.issuedDate = { gte: range.from, lte: range.to };

    const expenseWhere = { shopId, expenseDate: { gte: range.from, lte: range.to }, NOT: [{ status: 'Rejected' }] };
    if (pId) expenseWhere.serviceProjectId = pId;

    const [invoices, expenses] = await Promise.all([
      safeServiceInvoice()
        ? prisma.serviceInvoice.findMany({ 
            where: invoiceWhere, 
            select: { amount: true, paid: true, issuedDate: true, clientName: true, projectName: true, status: true, invoiceId: true } 
          })
        : Promise.resolve([]),
      prisma.expense.findMany({ 
        where: expenseWhere, 
        select: { amount: true, category: true, expenseDate: true, description: true } 
      })
    ]);

    const revenue = invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const cost = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = revenue - cost;
    const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const outstanding = invoices.reduce((sum, i) => sum + Math.max(0, Number(i.amount || 0) - Number(i.paid || 0)), 0);

    const lines = [];
    
    // Summary
    lines.push(['SUMMARY']);
    lines.push(['From', ymd(range.from)]);
    lines.push(['To', ymd(range.to)]);
    lines.push(['Revenue', revenue.toFixed(2)]);
    lines.push(['Expenses', cost.toFixed(2)]);
    lines.push(['Net Profit', netProfit.toFixed(2)]);
    lines.push(['Net Profit Margin (%)', netProfitMargin.toFixed(2)]);
    lines.push(['Outstanding Invoices', outstanding.toFixed(2)]);
    lines.push([]);

    // Invoices Data
    lines.push(['INVOICE DETAILS']);
    lines.push(['Date', 'Invoice #', 'Client', 'Project', 'Amount', 'Paid', 'Outstanding', 'Status']);
    for (const inv of invoices) {
      const out = Math.max(0, Number(inv.amount || 0) - Number(inv.paid || 0));
      lines.push([
        inv.issuedDate ? ymd(new Date(inv.issuedDate)) : '',
        inv.invoiceId || '-',
        inv.clientName || '-',
        inv.projectName || '-',
        Number(inv.amount || 0).toFixed(2),
        Number(inv.paid || 0).toFixed(2),
        out.toFixed(2),
        inv.status || '-'
      ]);
    }
    lines.push([]);

    // Expenses Data
    lines.push(['EXPENSE DETAILS']);
    lines.push(['Date', 'Category', 'Description', 'Amount']);
    for (const exp of expenses) {
      lines.push([
        exp.expenseDate ? ymd(new Date(exp.expenseDate)) : '',
        exp.category || '-',
        exp.description || '-',
        Number(exp.amount || 0).toFixed(2)
      ]);
    }

    const csv = lines.map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="services_report.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting service reports CSV:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

