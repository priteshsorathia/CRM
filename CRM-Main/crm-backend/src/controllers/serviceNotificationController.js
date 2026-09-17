const prisma = require('../lib/prisma');

const toInt = (value) => {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
};

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

const mapTypeFromLog = (log) => {
  const m = String(log?.module || '').toLowerCase();
  const a = String(log?.action || '').toLowerCase();
  
  if (m.includes('asset') || m.includes('inventory') || a.includes('asset')) return 'Assets';
  if (m.includes('hr') || m.includes('attendance') || m.includes('leave') || m.includes('payroll') || a.includes('hr')) return 'HR';
  if (m.includes('project') || m.includes('task') || m.includes('timesheet') || a.includes('project') || a.includes('task')) return 'Projects';
  if (m.includes('invoice') || m.includes('bill') || m.includes('expense') || m.includes('billing') || a.includes('invoice') || a.includes('expense') || a.includes('accounting')) return 'Billing';
  
  return 'All';
};

const mapSeverity = ({ status, action }) => {
  const s = String(status || '').toLowerCase();
  const a = String(action || '').toLowerCase();
  if (s === 'failed' || s === 'error') return 'danger';
  if (a.includes('overdue') || a.includes('reject') || a.includes('delete')) return 'warning';
  if (a.includes('approve') || a.includes('success')) return 'success';
  return 'info';
};

const titleFromLog = (log) => {
  const action = String(log?.action || '').replace(/_/g, ' ').trim();
  if (action) return action.replace(/\b\w/g, (c) => c.toUpperCase());
  const module = String(log?.module || '').trim();
  return module ? `${module} Update` : 'Notification';
};

exports.listNotifications = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    const userId = toInt(req.user?.id);
    if (!shopId || !userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const {
      type = 'All',
      unread,
      page = 1,
      limit = 20,
      sort = 'desc'
    } = req.query || {};

    const take = toInt(limit) === -1 ? 200 : Math.min(Math.max(toInt(limit) || 20, 1), 200);
    const skip = toInt(limit) === -1 ? 0 : (Math.max(toInt(page) || 1, 1) - 1) * take;

    const isAdmin = isManagerLikeRole(req.user.role);

    const where = {
      shopId,
      NOT: {
        serviceNotificationStates: {
          some: {
            userId,
            dismissedAt: { not: null }
          }
        }
      }
    };

    if (!isAdmin) {
      where.userId = userId;
    }

    if (type && type !== 'All') {
      const lower = String(type).toLowerCase();
      if (lower === 'assets') {
        where.OR = [
          { module: { contains: 'Asset', mode: 'insensitive' } }, 
          { module: { contains: 'Inventory', mode: 'insensitive' } },
          { action: { contains: 'ASSET', mode: 'insensitive' } }
        ];
      } else if (lower === 'hr') {
        where.OR = [
          { module: { contains: 'HR', mode: 'insensitive' } },
          { module: { contains: 'Attendance', mode: 'insensitive' } },
          { module: { contains: 'Leave', mode: 'insensitive' } },
          { module: { contains: 'Payroll', mode: 'insensitive' } },
          { action: { contains: 'HR', mode: 'insensitive' } }
        ];
      } else if (lower === 'projects') {
        where.OR = [
          { module: { contains: 'Project', mode: 'insensitive' } },
          { module: { contains: 'Task', mode: 'insensitive' } },
          { module: { contains: 'Timesheet', mode: 'insensitive' } },
          { action: { contains: 'PROJECT', mode: 'insensitive' } },
          { action: { contains: 'TASK', mode: 'insensitive' } }
        ];
      } else if (lower === 'billing') {
        where.OR = [
          { module: { contains: 'Invoice', mode: 'insensitive' } },
          { module: { contains: 'Bill', mode: 'insensitive' } },
          { module: { contains: 'Expense', mode: 'insensitive' } },
          { module: { contains: 'Billing', mode: 'insensitive' } },
          { action: { contains: 'INVOICE', mode: 'insensitive' } },
          { action: { contains: 'EXPENSE', mode: 'insensitive' } },
          { action: { contains: 'ACCOUNTING', mode: 'insensitive' } }
        ];
      }
    }

    if (String(unread || '').toLowerCase() === 'true' || String(unread) === '1') {
      where.NOT = [
        where.NOT,
        {
          serviceNotificationStates: {
            some: {
              userId,
              readAt: { not: null }
            }
          }
        }
      ];
    }

    const sortOrder = sort === 'asc' ? 'asc' : 'desc';

    const [total, logs, totalUnread] = await prisma.$transaction([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: sortOrder },
        skip,
        take,
        include: {
          serviceNotificationStates: {
            where: { userId },
            select: { readAt: true, dismissedAt: true }
          }
        }
      }),
      prisma.activityLog.count({
        where: {
          ...where,
          NOT: [
            ...(Array.isArray(where.NOT) ? where.NOT : [where.NOT]),
            {
              serviceNotificationStates: {
                some: { userId, readAt: { not: null } }
              }
            }
          ]
        }
      })
    ]);

    const mapped = (logs || []).map((log) => {
      const state = Array.isArray(log.serviceNotificationStates) ? log.serviceNotificationStates[0] : null;
      return {
        id: log.id,
        type: mapTypeFromLog(log),
        title: titleFromLog(log),
        description: String(log.description || ''),
        module: log.module,
        action: log.action,
        status: log.status,
        severity: mapSeverity({ status: log.status, action: log.action }),
        read: Boolean(state?.readAt),
        createdAt: log.createdAt
      };
    });

    res.json({
      success: true,
      data: mapped,
      pagination: {
        total,
        unread: totalUnread,
        page: Math.max(toInt(page) || 1, 1),
        limit: toInt(limit) === -1 ? -1 : take,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Error listing service notifications:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to load notifications' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    const userId = toInt(req.user?.id);
    const activityLogId = toInt(req.params.id);
    if (!shopId || !userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!activityLogId) return res.status(400).json({ success: false, message: 'Invalid notification id' });

    const log = await prisma.activityLog.findFirst({ where: { id: activityLogId, shopId } });
    if (!log) return res.status(404).json({ success: false, message: 'Notification not found' });

    await prisma.serviceNotificationState.upsert({
      where: { userId_activityLogId: { userId, activityLogId } },
      update: { readAt: new Date() },
      create: { shopId, userId, activityLogId, readAt: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    const userId = toInt(req.user?.id);
    if (!shopId || !userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { type = 'All' } = req.query || {};

    const isAdmin = isManagerLikeRole(req.user.role);
    const whereLogs = {
      shopId,
      NOT: {
        serviceNotificationStates: {
          some: { userId, dismissedAt: { not: null } }
        }
      }
    };

    if (!isAdmin) {
      whereLogs.userId = userId;
    }

    if (type && type !== 'All') {
      const lower = String(type).toLowerCase();
      if (lower === 'assets') {
        whereLogs.OR = [
          { module: { contains: 'Asset', mode: 'insensitive' } }, 
          { module: { contains: 'Inventory', mode: 'insensitive' } },
          { action: { contains: 'ASSET', mode: 'insensitive' } }
        ];
      } else if (lower === 'hr') {
        whereLogs.OR = [
          { module: { contains: 'HR', mode: 'insensitive' } },
          { module: { contains: 'Attendance', mode: 'insensitive' } },
          { module: { contains: 'Leave', mode: 'insensitive' } },
          { module: { contains: 'Payroll', mode: 'insensitive' } },
          { action: { contains: 'HR', mode: 'insensitive' } }
        ];
      } else if (lower === 'projects') {
        whereLogs.OR = [
          { module: { contains: 'Project', mode: 'insensitive' } },
          { module: { contains: 'Task', mode: 'insensitive' } },
          { module: { contains: 'Timesheet', mode: 'insensitive' } },
          { action: { contains: 'PROJECT', mode: 'insensitive' } },
          { action: { contains: 'TASK', mode: 'insensitive' } }
        ];
      } else if (lower === 'billing') {
        whereLogs.OR = [
          { module: { contains: 'Invoice', mode: 'insensitive' } },
          { module: { contains: 'Bill', mode: 'insensitive' } },
          { module: { contains: 'Expense', mode: 'insensitive' } },
          { module: { contains: 'Billing', mode: 'insensitive' } },
          { action: { contains: 'INVOICE', mode: 'insensitive' } },
          { action: { contains: 'EXPENSE', mode: 'insensitive' } },
          { action: { contains: 'ACCOUNTING', mode: 'insensitive' } }
        ];
      }
    }

    const logs = await prisma.activityLog.findMany({
      where: whereLogs,
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: { id: true }
    });

    if (!logs.length) return res.json({ success: true });

    const now = new Date();
    await prisma.$transaction(
      (logs || []).map((l) =>
        prisma.serviceNotificationState.upsert({
          where: { userId_activityLogId: { userId, activityLogId: l.id } },
          update: { readAt: now },
          create: { shopId, userId, activityLogId: l.id, readAt: now }
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

exports.dismissNotification = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    const userId = toInt(req.user?.id);
    const activityLogId = toInt(req.params.id);
    if (!shopId || !userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!activityLogId) return res.status(400).json({ success: false, message: 'Invalid notification id' });

    const log = await prisma.activityLog.findFirst({ where: { id: activityLogId, shopId } });
    if (!log) return res.status(404).json({ success: false, message: 'Notification not found' });

    await prisma.serviceNotificationState.upsert({
      where: { userId_activityLogId: { userId, activityLogId } },
      update: { dismissedAt: new Date() },
      create: { shopId, userId, activityLogId, dismissedAt: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};

exports.clearAll = async (req, res) => {
  try {
    const shopId = toInt(req.user?.shopId);
    const userId = toInt(req.user?.id);
    if (!shopId || !userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const isAdmin = isManagerLikeRole(req.user.role);
    const where = {
        shopId,
        NOT: {
          serviceNotificationStates: { some: { userId, dismissedAt: { not: null } } }
        }
      };

    if (!isAdmin) {
      where.userId = userId;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: { id: true }
    });

    if (!logs.length) return res.json({ success: true });

    const now = new Date();
    await prisma.$transaction(
      (logs || []).map((l) =>
        prisma.serviceNotificationState.upsert({
          where: { userId_activityLogId: { userId, activityLogId: l.id } },
          update: { dismissedAt: now },
          create: { shopId, userId, activityLogId: l.id, dismissedAt: now }
        })
      )
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed' });
  }
};
