const prisma = require('../lib/prisma');

const safeServiceInvoice = () => prisma.serviceInvoice && typeof prisma.serviceInvoice.findMany === 'function';

const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (key) => {
  const [y, m] = String(key).split('-');
  const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return dt.toLocaleString('en-IN', { month: 'short' });
};

const getLastMonthKeys = (count = 6) => {
  const now = new Date();
  const keys = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
};

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);

const normalizeModuleType = (module) => {
  const m = String(module || '').toLowerCase();
  if (m.includes('expense')) return 'expense';
  if (m.includes('invoice') || m.includes('billing')) return 'invoice';
  if (m.includes('inventory') || m.includes('asset')) return 'asset';
  if (m.includes('employee') || m.includes('hrms') || m.includes('staff')) return 'employee';
  if (m.includes('project')) return 'project';
  return 'project';
};

const normalizeLogStatus = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'success') return 'completed';
  if (s === 'warning') return 'review';
  return 'pending';
};

exports.getDashboard = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const userId = parseInt(req.user.id);
    const employeeId = req.user.employeeId ? parseInt(req.user.employeeId) : null;
    
    const rawRole = String(req.user.role || '').toLowerCase();
    const isAdmin = (
      rawRole === 'admin' || 
      rawRole === 'shop_owner' || 
      rawRole === 'owner' || 
      rawRole === 'manager' ||
      rawRole.endsWith('_owner')
    );

    const now = new Date();
    const monthStart = startOfMonth(now);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

    const last6MonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 5, 1));
    const monthKeys = getLastMonthKeys(6);

    // Role-based filtering logic
    let projectIds = [];
    let clientNames = [];
    if (!isAdmin) {
      if (employeeId) {
        const assignedProjects = await prisma.serviceProject.findMany({
          where: { 
            shopId,
            teamMembers: { array_contains: employeeId }
          },
          select: { id: true, client: true }
        });
        projectIds = assignedProjects.map(p => p.id);
        clientNames = [...new Set(assignedProjects.map(p => p.client))].filter(Boolean);
      }
    }

    const [
      clientsCount,
      projectsCount,
      employeesCount,
      assetsCount,
      recentLogs,
      expensesMonthAgg,
      invoicesMonthAgg,
      pendingInvoicesCount,
      overdueInvoicesCount,
    ] = await Promise.all([
      // 1. Clients (filtered by company names associated with projects)
      isAdmin
        ? prisma.serviceClient.count({ where: { shopId } })
        : prisma.serviceClient.count({ 
            where: { 
              shopId,
              company: { in: clientNames }
            } 
          }),
      
      // 2. Projects
      isAdmin
        ? prisma.serviceProject.count({ where: { shopId } })
        : projectIds.length,

      // 3. Employees (Admin only)
      isAdmin
        ? prisma.employee.count({ where: { shopId, isDeleted: false } })
        : Promise.resolve(0),

      // 4. Assets Registered (Using Asset model, filtered by assignee)
      isAdmin
        ? prisma.asset.count({ where: { shopId } })
        : prisma.asset.count({ 
            where: { 
              shopId,
              assignedTo: {
                equals: req.user.name,
                mode: 'insensitive'
              }
            } 
          }),

      // 5. Recent Logs (Personal activity)
      prisma.activityLog.findMany({
        where: { 
          shopId,
          ...(!isAdmin ? { userId } : {})
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { user: { select: { id: true, name: true, username: true } } }
      }),

      // 6. Expenses monthly
      prisma.expense.aggregate({
        where: {
          shopId,
          expenseDate: { gte: monthStart, lt: nextMonthStart },
          NOT: [{ status: 'Rejected' }],
          ...(!isAdmin ? {
            OR: [
              { userId },
              { serviceProjectId: { in: projectIds } }
            ]
          } : {})
        },
        _sum: { amount: true }
      }),

      // 7. Invoices monthly
      safeServiceInvoice()
        ? prisma.serviceInvoice.aggregate({
          where: { 
            shopId, 
            issuedDate: { gte: monthStart, lt: nextMonthStart },
            ...(!isAdmin ? { projectId: { in: projectIds } } : {})
          },
          _sum: { amount: true }
        })
        : Promise.resolve({ _sum: { amount: 0 } }),

      // 8. Pending Invoices
      safeServiceInvoice()
        ? prisma.serviceInvoice.count({ 
            where: { 
              shopId, 
              status: { not: 'Paid' },
              ...(!isAdmin ? { projectId: { in: projectIds } } : {})
            } 
          })
        : Promise.resolve(0),

      // 9. Overdue Payments
      safeServiceInvoice()
        ? prisma.serviceInvoice.count({ 
            where: { 
              shopId, 
              dueDate: { lt: now }, 
              status: { not: 'Paid' },
              ...(!isAdmin ? { projectId: { in: projectIds } } : {})
            } 
          })
        : Promise.resolve(0),
    ]);

    // Monthly series for charts
    const [invoicesLast6, expensesLast6] = await Promise.all([
      safeServiceInvoice()
        ? prisma.serviceInvoice.findMany({
          where: { 
            shopId, 
            issuedDate: { gte: last6MonthStart },
            ...(!isAdmin ? { projectId: { in: projectIds } } : {})
          },
          select: { amount: true, issuedDate: true, clientName: true, client: { select: { company: true } } }
        })
        : Promise.resolve([]),
      prisma.expense.findMany({
        where: { 
          shopId, 
          expenseDate: { gte: last6MonthStart }, 
          NOT: [{ status: 'Rejected' }],
          ...(!isAdmin ? {
            OR: [
              { userId },
              { serviceProjectId: { in: projectIds } }
            ]
          } : {})
        },
        select: { amount: true, expenseDate: true }
      })
    ]);

    const revenueByMonth = new Map(monthKeys.map((k) => [k, 0]));
    for (const inv of invoicesLast6) {
      const d = new Date(inv.issuedDate);
      if (Number.isNaN(d.getTime())) continue;
      const k = monthKey(d);
      if (!revenueByMonth.has(k)) continue;
      revenueByMonth.set(k, revenueByMonth.get(k) + Number(inv.amount || 0));
    }

    const expenseByMonth = new Map(monthKeys.map((k) => [k, 0]));
    for (const exp of expensesLast6) {
      const d = new Date(exp.expenseDate);
      if (Number.isNaN(d.getTime())) continue;
      const k = monthKey(d);
      if (!expenseByMonth.has(k)) continue;
      expenseByMonth.set(k, expenseByMonth.get(k) + Number(exp.amount || 0));
    }

    const revenueData = monthKeys.map((k) => ({
      name: monthLabel(k),
      revenue: revenueByMonth.get(k) || 0,
      target: 0
    }));
    const expenseData = monthKeys.map((k) => ({
      name: monthLabel(k),
      expense: expenseByMonth.get(k) || 0
    }));
    const profitData = monthKeys.map((k) => ({
      name: monthLabel(k),
      profit: (revenueByMonth.get(k) || 0) - (expenseByMonth.get(k) || 0)
    }));

    // Client distribution by revenue share (last 6 months)
    const clientMap = new Map();
    for (const inv of invoicesLast6) {
      const key = String(inv.clientName || inv.client?.company || 'Unknown');
      clientMap.set(key, (clientMap.get(key) || 0) + Number(inv.amount || 0));
    }
    const totalRev = Array.from(clientMap.values()).reduce((s, v) => s + v, 0) || 0;
    const topClients = Array.from(clientMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
    const used = topClients.reduce((s, x) => s + x.value, 0);
    const others = Math.max(0, totalRev - used);

    const clientDistributionRaw = [
      ...topClients.map((c) => ({ name: c.name, value: totalRev > 0 ? (c.value / totalRev) * 100 : 0 })),
      ...(others > 0 ? [{ name: 'Others', value: totalRev > 0 ? (others / totalRev) * 100 : 0 }] : [])
    ];
    const clientDistribution = clientDistributionRaw.map((c) => ({ name: c.name, value: Math.round(c.value) }));

    const monthlyRevenue = invoicesMonthAgg?._sum?.amount || 0;
    const totalExpenses = expensesMonthAgg?._sum?.amount || 0;
    const netProfit = monthlyRevenue - totalExpenses;

    const metrics = [
      { id: 1, title: 'Active Projects', value: String(projectsCount), growth: null, isPositive: true, type: 'projects' },
      { id: 2, title: 'Total Clients', value: String(clientsCount), growth: null, isPositive: true, type: 'clients' },
      isAdmin && { id: 3, title: 'Employees', value: String(employeesCount), growth: null, isPositive: true, type: 'employees' },
      { id: 4, title: 'Assets Registered', value: String(assetsCount), growth: null, isPositive: true, type: 'assets' },
      { id: 5, title: 'Monthly Revenue', value: `₹${Number(monthlyRevenue).toLocaleString('en-IN')}`, growth: null, isPositive: true, type: 'revenue' },
      { id: 6, title: 'Total Expenses', value: `₹${Number(totalExpenses).toLocaleString('en-IN')}`, growth: null, isPositive: false, type: 'expenses' },
      { id: 7, title: 'Net Profit', value: `₹${Number(netProfit).toLocaleString('en-IN')}`, growth: null, isPositive: netProfit >= 0, type: 'profit' },
      { id: 8, title: 'Pending Invoices', value: String(pendingInvoicesCount || 0), growth: null, isPositive: false, type: 'pending' },
      { id: 9, title: 'Overdue Payments', value: String(overdueInvoicesCount || 0), growth: null, isPositive: true, type: 'overdue' },
    ].filter(Boolean);

    const recentActivities = (recentLogs || []).slice(0, 5).map((l) => ({
      id: l.id,
      type: normalizeModuleType(l.module),
      title: l.description || l.action || l.module || 'Activity',
      timestamp: l.createdAt,
      status: normalizeLogStatus(l.status),
      user: l.user?.name || l.user?.username || 'Unknown'
    }));

    res.json({
      success: true,
      metrics,
      charts: {
        revenueData,
        expenseData,
        profitData,
        clientDistribution,
      },
      recentActivities,
    });
  } catch (error) {
    console.error('Error building services dashboard:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
