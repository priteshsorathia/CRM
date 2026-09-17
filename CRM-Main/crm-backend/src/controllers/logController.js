const prisma = require('../lib/prisma');

const parseYmdLocal = (value, { endOfDay = false } = {}) => {
  const [y, m, d] = String(value || '').split('-').map((v) => parseInt(v, 10));
  if (!y || !m || !d) return new Date(NaN);
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
};

const buildCreatedAtRange = ({ date, dateFrom, dateTo }) => {
  // date=YYYY-MM-DD keeps backward compatibility (single day)
  if (date) {
    const start = parseYmdLocal(date, { endOfDay: false });
    const end = parseYmdLocal(date, { endOfDay: true });
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    return { gte: start, lte: end };
  }

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

// Helper to parse User Agent (Simple version)
const parseUserAgent = (ua) => {
  if (!ua) return 'Unknown Device';
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone')) return 'iPhone';
  return 'Desktop/Mobile';
};

// 1. Create Log Helper (Updated)
const createLog = async (req, userId, shopId, action, description, module, status = "Success") => {
  try {
    // Try to get IP
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'];
    const device = parseUserAgent(userAgent);

    await prisma.activityLog.create({
      data: {
        userId: parseInt(userId),
        shopId: parseInt(shopId),
        action,
        description,
        module,
        status,
        ipAddress: Array.isArray(ip) ? ip[0] : ip, // Handle proxy arrays
        userAgent: device + (userAgent.includes('Chrome') ? ' (Chrome)' : ''), 
        metadata: {} 
      }
    });
  } catch (error) {
    console.error('Failed to create log:', error);
  }
};

// 2. Get Logs (With Filters)
const getLogs = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const role = req.user.role;
    const { 
      page = 1, 
      limit = 20, 
      module, 
      action, 
      status, 
      search,
      date,
      dateFrom,
      dateTo,
      staffId 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build Dynamic Query
    const whereCondition = {
      shopId: parseInt(shopId),
    };

    // Determine access scope
    const isAdmin = role === 'admin' || role === 'shop_owner';

    const baseScopeWhere = {
      shopId: parseInt(shopId)
    };

    if (module && module !== 'All Modules') whereCondition.module = module;
    if (action && action !== 'All Actions') whereCondition.action = action;
    if (status && status !== 'All Statuses') whereCondition.status = status;

    // User-wise filtering
    if (isAdmin) {
      if (staffId && staffId !== 'All Staff') {
        whereCondition.userId = parseInt(staffId);
      }
    } else {
      whereCondition.userId = req.user.id;
      baseScopeWhere.userId = req.user.id;
    }

    // Date Filter (Single day or range)
    const createdAtRange = buildCreatedAtRange({ date, dateFrom, dateTo });
    if (createdAtRange) {
      whereCondition.createdAt = createdAtRange;
    }

    // Search filter (action/description/module/user/id/ip)
    if (search != null && String(search).trim() !== '') {
      const term = String(search).trim();
      const idNum = Number(term);

      const or = [
        { action: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { module: { contains: term, mode: 'insensitive' } },
        { status: { contains: term, mode: 'insensitive' } },
        { ipAddress: { contains: term, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { username: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
            ]
          }
        }
      ];

      if (Number.isFinite(idNum)) {
        or.push({ id: idNum });
      }

      whereCondition.OR = or;
    }

    // Get Data
    const totalLogs = await prisma.activityLog.count({ where: whereCondition });
    const logs = await prisma.activityLog.findMany({
      where: whereCondition,
      include: {
        user: { select: { id: true, name: true, username: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: parseInt(limit)
    });

    // Get unique users for the Staff Dropdown
    const staffMembers = await prisma.user.findMany({
      where: { shopId: parseInt(shopId) },
      select: { id: true, name: true, username: true }
    });

    // Provide a stable module list (not affected by current module filter)
    const distinctModules = await prisma.activityLog.findMany({
      where: baseScopeWhere,
      distinct: ['module'],
      select: { module: true }
    });

    res.json({
      success: true,
      data: logs,
      filters: {
        staff: staffMembers,
        modules: distinctModules
          .map((m) => m.module)
          .filter(Boolean)
          .sort((a, b) => String(a).localeCompare(String(b)))
      },
      pagination: {
        total: totalLogs,
        pages: Math.ceil(totalLogs / parseInt(limit)),
        currentPage: parseInt(page),
      }
    });

  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
};

// Get Log by ID
const getLogById = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const role = req.user.role;
    const logId = parseInt(req.params.id);

    if (isNaN(logId)) {
      return res.status(400).json({ success: false, error: 'Invalid log ID' });
    }

    // Build where condition
    const whereCondition = {
      id: logId,
      shopId: parseInt(shopId)
    };

    // Non-admin users can only see their own logs
    const isAdmin = role === 'admin' || role === 'shop_owner';
    if (!isAdmin) {
      whereCondition.userId = req.user.id;
    }

    // Fetch the log
    const log = await prisma.activityLog.findFirst({
      where: whereCondition,
      include: {
        user: { 
          select: { 
            id: true, 
            name: true, 
            username: true,
            email: true,
            role: true
          } 
        },
        shop: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!log) {
      return res.status(404).json({ 
        success: false, 
        error: 'Log not found or access denied' 
      });
    }

    res.json({
      success: true,
      data: log
    });

  } catch (error) {
    console.error('Get log by ID error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch log' });
  }
};

// ✅ NEW: Export Logs to CSV
const exportLogs = async (req, res) => {
    try {
        const shopId = req.user.shopId;
        const role = req.user.role;
        // Get filter params (same as getLogs but no pagination needed)
        const { module, status, search, date, dateFrom, dateTo } = req.query;

        const whereCondition = {
            shopId: parseInt(shopId),
        };

        const isAdmin = role === 'admin' || role === 'shop_owner';
        if (!isAdmin) whereCondition.userId = req.user.id;

        if (module && module !== 'All Modules') whereCondition.module = module;
        if (status && status !== 'All Statuses') whereCondition.status = status;

        const createdAtRange = buildCreatedAtRange({ date, dateFrom, dateTo });
        if (createdAtRange) {
            whereCondition.createdAt = createdAtRange;
        }
        
        // Simple search filter if provided
        if (search) {
            whereCondition.OR = [
                { action: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Fetch ALL matching logs (no skip/take)
        const logs = await prisma.activityLog.findMany({
            where: whereCondition,
            include: {
                user: { select: { username: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Generate CSV Content
        const csvHeader = 'Date,User,Module,Action,Status,Description,IP Address\n';
        const csvRows = logs.map(log => {
            // Escape quotes and handle commas in content
            const safe = (text) => `"${(text || '').replace(/"/g, '""')}"`;
            
            return [
                safe(new Date(log.createdAt).toLocaleString()),
                safe(log.user?.username || 'Unknown'),
                safe(log.module),
                safe(log.action),
                safe(log.status),
                safe(log.description),
                safe(log.ipAddress)
            ].join(',');
        });

        const csvContent = csvHeader + csvRows.join('\n');

        // Send file
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="activity_logs.csv"');
        res.status(200).send(csvContent);

    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ success: false, error: 'Failed to export logs' });
    }
};

module.exports = { getLogs, getLogById, createLog, exportLogs };
