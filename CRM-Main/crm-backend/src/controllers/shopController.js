const prisma = require('../lib/prisma');
const { generateRandomPassword } = require('../utils/generateCredentials');
const { hashPassword } = require('../utils/passwordUtils');
const { sendCredentialsEmail, sendShopStatusNotificationEmail } = require('../utils/emailService');

const generateUsername = (namePart) => {
  const base = namePart.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}${randomSuffix}`;
};

const createShopWithOwner = async (req, res) => {
  try {
    const { name, ownerName, address, phone, email, gstNumber, upiId, logo } = req.body;
    if (!name || !address || !phone || !email || !ownerName || !upiId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const shopOwnerName = ownerName || name;
    let generatedUsername = generateUsername(shopOwnerName);

    // Existence checks
    const existingShop = await prisma.shop.findFirst({ where: { email } });
    if (existingShop) return res.status(400).json({ success: false, error: 'Shop exists' });

    let existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { username: generatedUsername }] } });
    if (existingUser && existingUser.email === email) return res.status(400).json({ success: false, error: 'User exists' });

    const generatedPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(generatedPassword);
    const userType = req.body.userType || 'retailers';

    const result = await prisma.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: { name, ownerName, address, phone, email, gstNumber: gstNumber || null, upiId: upiId || null, logo: logo || null, userType }
      });
      const user = await tx.user.create({
        data: { name: shopOwnerName, email, username: generatedUsername, password: hashedPassword, role: 'shop_owner', upiId: upiId || null, shopId: shop.id, userType },
        include: { shop: true }
      });
      return { shop, user, generatedPassword, generatedUsername };
    });

    await sendCredentialsEmail(email, {
      email, username: result.generatedUsername, password: result.generatedPassword, shopId: result.shop.id, shopName: result.shop.name
    }).catch(err => console.error("Email fail:", err));

    res.status(201).json({ success: true, message: 'Created', data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAllShops = async (req, res) => {
  try {
    const shops = await prisma.shop.findMany({
      include: { users: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: shops });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getShopById = async (req, res) => {
  try {
    const shop = await prisma.shop.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { users: { select: { id: true, name: true, email: true, role: true, isBlocked: true, createdAt: true } } }
    });
    if (!shop) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: shop });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getShopsByType = async (req, res) => {
  try {
    const { userType, isBlocked } = req.query;
    const where = {};
    if (userType) where.userType = userType;
    if (isBlocked !== undefined) where.isBlocked = isBlocked === 'true';

    const shops = await prisma.shop.findMany({
      where,
      include: { users: { select: { id: true, name: true, email: true, role: true, isBlocked: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: shops });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const notifyShopStatusChange = async (req, shop, nextBlocked) => {
  try {
    // 1. Create In-App Notification (ActivityLog) for each user of this shop
    for (const user of shop.users) {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          shopId: shop.id,
          action: nextBlocked ? 'SHOP_BLOCKED' : 'SHOP_UNLOCKED',
          description: `Your shop "${shop.name}" has been ${nextBlocked ? 'blocked' : 'unlocked'} by the administrator.`,
          module: 'Shop',
          status: 'Info',
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
          userAgent: 'System Notification',
          metadata: {}
        }
      });
    }

    // 2. Send Email Notification to each user
    for (const user of shop.users) {
      if (user.email) {
        await sendShopStatusNotificationEmail(user.email, {
          name: user.name,
          shopName: shop.name,
          isBlocked: nextBlocked
        }).catch(err => console.error(`Failed to send status email to ${user.email}:`, err));
      }
    }

    // 3. Send email to shop email itself if not already covered
    if (shop.email && !shop.users.some(u => u.email === shop.email)) {
      await sendShopStatusNotificationEmail(shop.email, {
        name: shop.ownerName || 'Shop Owner',
        shopName: shop.name,
        isBlocked: nextBlocked
      }).catch(err => console.error(`Failed to send status email to shop ${shop.email}:`, err));
    }
  } catch (error) {
    console.error('Error notifying shop status change:', error);
  }
};

const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ownerName, address, phone, email, gstNumber, upiId, logo, userType, isBlocked } = req.body;

    const existingShop = await prisma.shop.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existingShop) return res.status(404).json({ success: false, error: 'Shop not found' });
    const wasBlocked = existingShop.isBlocked;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (ownerName !== undefined) updateData.ownerName = ownerName;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (upiId !== undefined) updateData.upiId = upiId;
    if (logo !== undefined) updateData.logo = logo;
    if (userType) updateData.userType = userType;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked === true || isBlocked === 'true';

    const updatedShop = await prisma.shop.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { users: true }
    });

    if (ownerName !== undefined) {
      await prisma.user.updateMany({
        where: { shopId: parseInt(id), role: 'shop_owner' },
        data: { name: ownerName }
      });
    }

    if (upiId !== undefined) {
      await prisma.user.updateMany({
        where: { shopId: parseInt(id), role: 'shop_owner' },
        data: { upiId: upiId }
      });
    }

    if (updateData.isBlocked !== undefined) {
      await prisma.user.updateMany({
        where: { shopId: parseInt(id) },
        data: { isBlocked: updateData.isBlocked }
      });
    }

    const nextBlocked = updateData.isBlocked !== undefined ? updateData.isBlocked : wasBlocked;
    if (wasBlocked !== nextBlocked) {
      await notifyShopStatusChange(req, updatedShop, nextBlocked);
    }

    res.json({ success: true, data: updatedShop });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const setShopBlockedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    const nextBlocked = isBlocked === true || isBlocked === 'true';

    const existingShop = await prisma.shop.findUnique({
      where: { id: parseInt(id) }
    });
    if (!existingShop) return res.status(404).json({ success: false, error: 'Shop not found' });
    const wasBlocked = existingShop.isBlocked;

    const shop = await prisma.shop.update({
      where: { id: parseInt(id) },
      data: { isBlocked: nextBlocked },
      include: { users: true }
    });

    await prisma.user.updateMany({
      where: { shopId: parseInt(id) },
      data: { isBlocked: nextBlocked }
    });

    if (wasBlocked !== nextBlocked) {
      await notifyShopStatusChange(req, shop, nextBlocked);
    }

    res.json({ success: true, data: shop });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked, userType } = req.body;
    const updateData = {};
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked === true || isBlocked === 'true';
    if (userType) updateData.userType = userType;

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { shop: true }
    });
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createShopWithOwner, getAllShops, getShopById, getShopsByType, updateShop, setShopBlockedStatus, updateUser
};
