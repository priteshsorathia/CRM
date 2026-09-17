const { authenticateToken } = require('./authMiddleware');

/**
 * Middleware to check if user has access to retailers routes
 */
const requireRetailers = (req, res, next) => {
  // First authenticate the token
  authenticateToken(req, res, () => {
    // Check userType
    const userType = req.userType || req.user?.userType || req.user?.shop?.userType || 'retailers';
    
    if (userType !== 'retailers') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. This route is only accessible to retailers.',
        forceLogout: false
      });
    }
    
    next();
  });
};

/**
 * Middleware to check if user has access to restaurants routes
 */
const requireRestaurants = (req, res, next) => {
  // First authenticate the token
  authenticateToken(req, res, () => {
    // Check userType
    const userType = req.userType || req.user?.userType || req.user?.shop?.userType || 'retailers';
    
    if (userType !== 'restaurants') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. This route is only accessible to restaurants.',
        forceLogout: false
      });
    }
    
    next();
  });
};

module.exports = {
  requireRetailers,
  requireRestaurants
};
