const prisma = require('../lib/prisma');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { createLog } = require('./logController');

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('🔐 Forgot password request for:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const trimmedEmail = email.trim();

    // Find user by email case-insensitively
    const user = await prisma.user.findFirst({
      where: { email: { equals: trimmedEmail, mode: 'insensitive' } }
    });

    // Return 404 error if user does not exist
    if (!user) {
      console.log('📧 Email not found in database:', trimmedEmail);

      // ✅ ACTIVITY LOG: Forgot password attempt for non-existing email (no user/shop)
      await createLog(
        req,
        0,
        0,
        'FORGOT_PASSWORD_REQUEST',
        `Password reset requested for non-existing email ${trimmedEmail}`,
        'Auth',
        'Failed'
      );

      return res.status(404).json({
        success: false,
        error: 'Email address is not registered'
      });
    }

    console.log('✅ User found:', user.email);

    // Generate reset token (valid for 15 minutes)
    // We add user.password to JWT_SECRET to invalidate token after password is changed
    const secret = process.env.JWT_SECRET + user.password;
    const resetToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'password_reset'
      },
      secret,
      { expiresIn: '15m' }
    );

    // Create reset URL
    // Get the first origin if CLIENT_URL has comma-separated origins
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0].trim();
    const resetUrl = `${clientUrl}/auth/reset-password?token=${resetToken}`;

    // Send reset email
    const emailResult = await sendPasswordResetEmail(user.email, {
      name: user.name || user.username || user.email.split('@')[0] || 'User',
      resetUrl: resetUrl,
      expiryTime: '15 minutes'
    });

    if (emailResult.success) {
      console.log('✅ Password reset email sent to:', user.email);

      // ✅ ACTIVITY LOG: Forgot password email sent
      await createLog(
        req,
        user.id,
        user.shopId,
        'FORGOT_PASSWORD_EMAIL_SENT',
        `Password reset email sent to ${user.email}`,
        'Auth',
        'Success'
      );

      res.json({
        success: true,
        message: 'Password reset link has been sent successfully'
      });
    } else {
      console.error('❌ Failed to send reset email:', emailResult.error);

      // ✅ ACTIVITY LOG: Forgot password email failure
      await createLog(
        req,
        user.id,
        user.shopId,
        'FORGOT_PASSWORD_EMAIL_FAILED',
        `Failed to send password reset email to ${user.email}`,
        'Auth',
        'Failed'
      );

      res.status(500).json({
        success: false,
        error: 'Failed to send reset email'
      });
    }

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    console.error('Error stack:', error.stack);
    
    // More detailed error response
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Internal server error. Please try again later.'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log('🔄 Reset password request');

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
    }

    // Decode token first to extract userId
    let decoded;
    try {
      decoded = jwt.decode(token);
      if (!decoded || !decoded.userId || decoded.type !== 'password_reset') {
        return res.status(400).json({
          success: false,
          error: 'Invalid reset token structure'
        });
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Check expiration explicitly
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && currentTime > decoded.exp) {
      return res.status(400).json({
        success: false,
        error: 'This reset link has expired'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify token using secret + old password hash
    const secret = process.env.JWT_SECRET + user.password;
    try {
      jwt.verify(token, secret);
    } catch (tokenError) {
      return res.status(400).json({
        success: false,
        error: tokenError.name === 'TokenExpiredError'
          ? 'This reset link has expired'
          : 'This reset link is invalid or has already been used'
      });
    }

    // Hash new password
    const { hashPassword } = require('../utils/passwordUtils');
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    console.log('✅ Password updated for user:', user.email);

    // ✅ ACTIVITY LOG: Password reset
    await createLog(
      req,
      user.id,
      user.shopId,
      'PASSWORD_RESET',
      `Password reset successfully for user ${user.email}`,
      'Auth',
      'Success'
    );

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const validateToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    // Decode token first
    let decoded;
    try {
      decoded = jwt.decode(token);
      if (!decoded || !decoded.userId || decoded.type !== 'password_reset') {
        return res.status(400).json({
          success: false,
          error: 'Invalid token structure'
        });
      }
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Check expiration explicitly
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && currentTime > decoded.exp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify token using secret + password hash
    const secret = process.env.JWT_SECRET + user.password;
    try {
      jwt.verify(token, secret);
    } catch (tokenError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    return res.json({
      success: true,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('❌ Validate token error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
  validateToken
};
