const prisma = require('../lib/prisma');
const { createLog } = require('./logController');


// Get current user's profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const formatDateOnly = (date) => {
      if (!date) return null;
      // Extract YYYY-MM-DD from ISO string safely
      try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().split('T')[0];
      } catch (e) {
        return null;
      }
    };

    // Explicitly select only required fields for profile view
    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || (user.shop ? user.shop.phone : ''), // Fallback to shop phone for owners if personal is empty
      role: user.role,
      username: user.username,
      createdAt: formatDateOnly(user.createdAt),
      join_date: formatDateOnly(user.createdAt), // Default join date to account creation
      shop: user.shop ? {
        id: user.shop.id,
        name: user.shop.name,
        phone: user.shop.phone,
        address: user.shop.address
      } : null,
      salary: 0,
      status: 'active'
    };

    // Special handling for Owners to pull more personal details if available in shop record
    if (user.role.toLowerCase().includes('owner') && user.shop) {
      if (user.shop.ownerName && (!user.name || user.name === user.shop.name)) {
        profileData.name = user.shop.ownerName; // Use personal owner name instead of business name
      }
    }

    // If user is linked to an HRMS employee record, fetch those specific details
    if (user.employeeId) {
      try {
        const employee = await prisma.employee.findUnique({
          where: { id: user.employeeId },
          select: { status: true, salary: true, join_date: true, phone: true },
        });

        if (employee) {
          profileData.status = employee.status || 'active';
          profileData.salary = employee.salary || 0;
          if (employee.phone) {
            profileData.phone = employee.phone; // Override with HRMS phone
          }
          if (employee.join_date) {
            const formattedDate = formatDateOnly(employee.join_date);
            profileData.join_date = formattedDate; // Set explicit join date
            profileData.createdAt = formattedDate; // Keep createdAt synced for frontend
          }
        }
      } catch (empError) {
        console.error('Failed to fetch linked employee details for profile:', empError);
      }
    }

    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

// Update current user's profile
const updateProfile = async (req, res) => {
  try {
    const authUser = req.user;

    if (!authUser) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    const userId = authUser.id;
    const { name, email, upiId, phone } = req.body;

    const loggedInRole = String(authUser.role || '').trim().toLowerCase();
    const isRestrictedRole = ['manager', 'restaurant_manager', 'staff', 'cook'].includes(loggedInRole);

    // Build dynamic update object so we only update provided fields
    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (email !== undefined && !isRestrictedRole) dataToUpdate.email = email;
    if (upiId !== undefined) dataToUpdate.upiId = upiId;
    if (phone !== undefined) dataToUpdate.phone = phone;

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No profile fields provided to update',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      include: { shop: true },
    });

    // If user is linked to an HRMS employee record, sync name and phone
    if (updatedUser.employeeId) {
      try {
        await prisma.employee.update({
          where: { id: updatedUser.employeeId },
          data: {
            full_name: updatedUser.name,
            phone: updatedUser.phone
          }
        });
      } catch (empUpdateError) {
        console.error('Failed to sync profile update to employee record:', empUpdateError);
      }
    }

    // Activity log for profile update
    try {
      await createLog(
        req,
        updatedUser.id,
        updatedUser.shopId,
        'PROFILE_UPDATE',
        `Updated profile details for user ${updatedUser.username}`,
        'Profile',
        'Success'
      );
    } catch (logError) {
      console.error('Failed to create profile update log:', logError);
    }

    const { password, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};

