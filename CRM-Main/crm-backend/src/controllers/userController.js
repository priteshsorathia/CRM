const prisma = require('../lib/prisma');
const { hashPassword } = require('../utils/passwordUtils');


const createUser = async (req, res) => {
  try {
    const { name, email, username, phone, password, shopId, role = 'user', userType, isBlocked } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }

    const baseForUsername = (username && String(username).trim() !== '')
      ? String(username).trim()
      : (String(name || '').split(' ')[0] || String(email || '').split('@')[0] || 'user');

    const normalizeUsernameBase = (value) => {
      return String(value || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 10) || 'user';
    };

    const usernameBase = normalizeUsernameBase(baseForUsername);
    let finalUsername = usernameBase;

    // Ensure unique username (add random 4 digits when needed)
    let tries = 0;
    while (tries < 6) {
      const conflict = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username: finalUsername }
          ]
        }
      });

      if (!conflict) break;
      if (conflict.email === email) return res.status(400).json({ error: 'User with this email already exists' });

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      finalUsername = `${usernameBase}${randomSuffix}`;
      tries++;
    }

    if (tries >= 6) {
      return res.status(500).json({ error: 'Failed to generate a unique username. Please try again.' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        username: finalUsername,
        password: hashedPassword,
        role,
        userType: userType || undefined,
        isBlocked: isBlocked === true || isBlocked === 'true',
        shopId: shopId !== undefined && shopId !== null && String(shopId).trim() !== '' ? parseInt(shopId) : null
      },
      include: { shop: true }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

const getAllUsers = async (req, res) => {
  try {
    const where = {};
    
    // If authenticated, restrict to shop/user scope
    if (req.user) {
      const shopId = req.user.shopId;
      const role = req.user.role;
      
      if (shopId) {
        where.shopId = parseInt(shopId);
      }

      if (role && !isManagerLikeRole(role)) {
        where.id = req.user.id;
      }
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      success: true,
      data: usersWithoutPasswords,
      count: usersWithoutPasswords.length
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message 
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, email, username, phone, password, role, shopId, userType, isBlocked } = req.body || {};

    if (email !== undefined || username !== undefined) {
      const conflict = await prisma.user.findFirst({
        where: {
          id: { not: userId },
          OR: [
            ...(email !== undefined ? [{ email }] : []),
            ...(username !== undefined ? [{ username }] : [])
          ]
        }
      });

      if (conflict?.email === email) return res.status(400).json({ error: 'User with this email already exists' });
      if (conflict?.username === username) return res.status(400).json({ error: 'User with this username already exists' });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (username !== undefined) data.username = username;
    if (role !== undefined) data.role = role;
    if (userType !== undefined) data.userType = userType;
    if (isBlocked !== undefined) data.isBlocked = isBlocked === true || isBlocked === 'true';
    if (shopId !== undefined) {
      if (shopId === null || String(shopId).trim() === '') {
        data.shopId = null;
      } else {
        const parsedShopId = parseInt(shopId);
        if (!Number.isFinite(parsedShopId)) return res.status(400).json({ error: 'Invalid shopId' });
        data.shopId = parsedShopId;
      }
    }
    if (password !== undefined && String(password).trim() !== '') data.password = await hashPassword(password);

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const { password: _, ...userWithoutPassword } = updated;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({ where: { id: userId } });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);

    if (error && (error.code === 'P2003' || error.code === 'P2014')) {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete user because it has related records. Block the user instead.',
        details: error.message
      });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
};
