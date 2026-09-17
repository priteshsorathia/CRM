const prisma = require('../lib/prisma');

/**
 * Middleware to check if the user has permission for a specific module and action.
 * @param {string} module - The module name (e.g., 'PROJECT', 'ASSETS')
 * @param {string} action - The action (e.g., 'CREATE', 'READ', 'UPDATE', 'DELETE')
 */
const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const shopId = req.user.shopId;
      const role = user.role; // This is the Designation

      // 1. Admin/Owner always has full access
      const lowerRole = (role || '').toLowerCase();
      if (lowerRole === 'admin' || lowerRole === 'shop_owner' || lowerRole === 'owner') {
        return next();
      }


      // 2. Fetch permission from DB (Case-Insensitive for the Role/Designation)
      const permission = await prisma.rolePermission.findFirst({
        where: {
          shopId,
          role: {
            equals: role,
            mode: 'insensitive' // Ensure 'Manager' matches 'manager' in DB
          },
          module: {
            equals: module,
            mode: 'insensitive' // Also be safe with module naming
          }
        }
      });

      // 3. If no permission record exists, default to DENIED
      if (!permission) {
        return res.status(403).json({
          success: false,
          error: `Access Denied: You do not have permission to ${action} ${module} records.`
        });
      }

      // 4. Map action string to column name
      const actionMap = {
        'CREATE': 'canCreate',
        'READ': 'canRead',
        'UPDATE': 'canUpdate',
        'DELETE': 'canDelete'
      };

      const column = actionMap[action.toUpperCase()];
      if (!column || !permission[column]) {
        return res.status(403).json({
          success: false,
          error: `Access Denied: You do not have permission to ${action} ${module} records.`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ success: false, error: 'Authorization error' });
    }
  };
};

module.exports = { checkPermission };
