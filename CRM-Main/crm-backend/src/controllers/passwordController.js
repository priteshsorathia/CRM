const prisma = require('../lib/prisma');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { verifyToken } = require('./authController');


const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    console.log('🔐 Change password request for user:', userId);

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Password validation
    if (newPassword.length > 32) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at most 32 characters long'
      });
    }

    if (/\s/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password cannot contain spaces'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={[\]}|:;"'<,>.?/~`])/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('✅ User found:', user.email);

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      console.log('❌ Current password is incorrect');
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    console.log('✅ Current password verified');

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password in database
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    console.log('✅ Password updated successfully for user:', user.email);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

// Check if user needs to change password (first login)
const checkPasswordChangeRequired = async (req, res) => {
  try {
    const userId = req.user.id;

    // You can add logic here to check if it's user's first login
    // For now, we'll check if password was changed from initial generated one
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Simple logic: if user was created recently and never updated password
    const isFirstLogin = new Date() - new Date(user.createdAt) < 24 * 60 * 60 * 1000; // Within 24 hours

    res.json({
      success: true,
      data: {
        passwordChangeRequired: isFirstLogin
      }
    });

  } catch (error) {
    console.error('❌ Check password change error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  changePassword,
  checkPasswordChangeRequired
};