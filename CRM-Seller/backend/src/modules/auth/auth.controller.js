const jwt = require('jsonwebtoken');
const prisma = require('../../database/prisma');
const { externalApi } = require('../../lib/externalApi');

const JWT_SECRET = process.env.JWT_SECRET;

// Multi-Source Login — Check Local Employees, then External Users
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/Username and password are required.' });
    }

    // 1. Check Local Employees Table First (Internal Staff)
    const localEmployee = await prisma.employee.findFirst({
        where: {
            OR: [
                { email: identifier },
                { username: identifier }
            ]
        }
    });

    if (localEmployee) {
      // Direct password comparison as per project current requirements
      if (localEmployee.password === password) {
        // Generate JWT token valid for 7 days
        const token = jwt.sign(
          { id: localEmployee.id, email: localEmployee.email, role: localEmployee.role, type: 'staff' },
          JWT_SECRET,
          { expiresIn: '7d' } 
        );

        return res.status(200).json({
          success: true,
          message: 'Staff Login successful',
          token,
          user: {
            id: localEmployee.id,
            name: localEmployee.name,
            email: localEmployee.email,
            role: localEmployee.role,
            type: 'staff'
          }
        });
      }
    }

    // 2. Fallback to external 8001 (For Sellers/Customers)
    try {
      const response = await externalApi.post('/auth/login', {
        username: identifier,
        password
      });

      const externalData = response.data.data || response.data;

      return res.status(200).json({
        success: true,
        message: 'Customer Login successful',
        token: externalData.token,
        user: {
          ...externalData.user,
          type: 'customer'
        }
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or account not found.'
      });
    }
  } catch (err) {
    console.error("Auth System Error:", err.message);
    next(err);
  }
};

const me = async (req, res, next) => {
  res.status(200).json({ success: true, user: req.user || null });
};

const updateProfile = async (req, res, next) => {
  try {
    const { id, type } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    if (type === 'staff') {
      const { name, email, username, phone } = req.body;
      const updated = await prisma.employee.update({
        where: { id },
        data: { name, email, username, phone }
      });
      return res.status(200).json({ success: true, message: 'Staff profile updated', user: updated });
    }

    const response = await externalApi.put(`/users/${id}`, req.body);

    return res.status(200).json({
      success: true,
      message: 'Customer profile updated successfully',
      user: response.data.data || response.data
    });
  } catch (err) {
    console.error("Profile update Proxy Error:", err.message);
    next(err);
  }
};

module.exports = { login, me, updateProfile };
