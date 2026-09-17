const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']; 
  const token = authHeader && authHeader.split(' ')[1];

  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Auth Middleware Debug:');
    console.log('  - Request URL:', req.url);
    console.log('  - Method:', req.method);
    console.log('  - Has Authorization Header:', !!authHeader);
    console.log('  - Token Present:', !!token);
    console.log('  - Token Preview:', token ? `${token.substring(0, 20)}...` : 'No token');
  }

  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ No token provided - returning 401');
    }
    return res.status(401).json({ error: 'Access token required' }); 
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Token verified successfully');
      console.log('  - Decoded User ID:', decoded.userId);
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { shop: true }
    });

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ User not found in database for ID:', decoded.userId);
      }
      return res.status(401).json({ 
        error: 'User not found',
        forceLogout: true
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ 
        error: 'Your account has been blocked',
        blocked: true,
        forceLogout: true
      });
    }

    // Check if shop is blocked
    if (user.shop && user.shop.isBlocked) {
      return res.status(403).json({ 
        error: 'Your shop has been blocked',
        blocked: true,
        forceLogout: true
      });
    }

    // Check if userType changed (force logout if changed)
    const currentUserType = user.userType || user.shop?.userType || 'retailers';
    if (decoded.userType && decoded.userType !== currentUserType) {
      return res.status(403).json({ 
        error: 'Account type changed. Please login again',
        forceLogout: true
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User found in database:');
      console.log('  - User ID:', user.id);
      console.log('  - Email:', user.email);
      console.log('  - Shop ID:', user.shopId);
      console.log('  - Has Shop:', !!user.shop);
      console.log('  - User Type:', currentUserType);
    }

    req.user = user;
    req.userType = currentUserType;
    next();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Token verification failed:');
      console.log('  - Error:', error.message);
      console.log('  - Error name:', error.name);
      
      // Specific error types
      if (error.name === 'TokenExpiredError') {
        console.log('  - Token expired at:', error.expiredAt);
      } else if (error.name === 'JsonWebTokenError') {
        console.log('  - JWT Error:', error.message);
      }
    }

    let errorMessage = 'Invalid or expired token';
    
    // More specific error messages for development
    if (process.env.NODE_ENV === 'development') {
      if (error.name === 'TokenExpiredError') {
        errorMessage = `Token expired at ${error.expiredAt}`;
      } else if (error.name === 'JsonWebTokenError') {
        errorMessage = `JWT Error: ${error.message}`;
      }
    }

    return res.status(403).json({ error: errorMessage });
  }
};

module.exports = { authenticateToken };