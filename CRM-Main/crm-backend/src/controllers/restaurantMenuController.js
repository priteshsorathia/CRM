const prisma = require('../lib/prisma');
const { createLog } = require('./logController');
const normalizeArray = (val) => {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  return [val];
};

const toIntArray = (val) => normalizeArray(val).map(v => parseInt(v, 10)).filter(v => !Number.isNaN(v));
const toStringArray = (val) => normalizeArray(val).map(v => String(v));

const getMenuItems = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const items = await prisma.restaurantMenuItem.findMany({
      where: {
        shopId: parseInt(shopId),
        isDeleted: false
      },
      include: { category: true, subCategory: true },
      orderBy: { id: 'desc' }
    });

    const mapped = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      original_price: item.original_price,
      food_type: item.food_type,
      category_id: item.categoryId,
      sub_category_id: item.subCategoryId,
      category_name: item.category?.name || null,
      sub_category_name: item.subCategory?.name || null,
      category: item.category?.name || null,
      sub_category: item.subCategory?.name || null,
      service_types: item.service_types || [],
      add_ons: item.add_on_ids || [],
      is_available: item.is_available,
      image: item.image
    }));

    res.json({ success: true, items: mapped });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu items' });
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { id } = req.params;
    const item = await prisma.restaurantMenuItem.findFirst({
      where: { id: parseInt(id), shopId: parseInt(shopId) },
      include: { category: true, subCategory: true }
    });

    if (!item) return res.status(404).json({ success: false, error: 'Menu item not found' });

    res.json({
      success: true,
      item: {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        original_price: item.original_price,
        food_type: item.food_type,
        category_id: item.categoryId,
        sub_category_id: item.subCategoryId,
        category_name: item.category?.name || null,
        sub_category_name: item.subCategory?.name || null,
        category: item.category?.name || null,
        sub_category: item.subCategory?.name || null,
        service_types: item.service_types || [],
        add_ons: item.add_on_ids || [],
        is_available: item.is_available,
        image: item.image
      }
    });
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu item' });
  }
};

const sanitizeAndValidate = (name, description, price, original_price) => {
  const htmlRegex = /<[^>]*>/g;
  const scriptRegex = /javascript:/gi;

  if (name !== undefined) {
    const trimmedName = String(name).trim();
    if (trimmedName === "") {
      return "Item name is required and cannot be empty spaces";
    }
    if (trimmedName.length < 3) {
      return "Item name must be at least 3 characters";
    }
    if (trimmedName.length > 50) {
      return "Item name cannot exceed 50 characters";
    }
    if (htmlRegex.test(trimmedName) || scriptRegex.test(trimmedName)) {
      return "HTML tags or script values are not allowed in name";
    }
  }

  if (description !== undefined && description !== null && description !== "") {
    const trimmedDesc = String(description).trim();
    if (trimmedDesc.length > 200) {
      return "Description cannot exceed 200 characters";
    }
    if (htmlRegex.test(trimmedDesc) || scriptRegex.test(trimmedDesc)) {
      return "HTML tags or script values are not allowed in description";
    }
  }

  if (price !== undefined) {
    const priceVal = parseFloat(price);
    if (isNaN(priceVal) || priceVal <= 0) {
      return "Price must be greater than 0";
    }
  }

  if (original_price !== undefined && original_price !== null && original_price !== "") {
    const origPriceVal = parseFloat(original_price);
    if (isNaN(origPriceVal) || origPriceVal <= 0) {
      return "Original price must be greater than 0";
    }
    if (price !== undefined) {
      const priceVal = parseFloat(price);
      if (!isNaN(priceVal) && priceVal > origPriceVal) {
        return "Sale Price should not be greater than Original Price";
      }
    }
  }

  return null;
};

const createMenuItem = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const {
      name,
      description,
      price,
      original_price,
      food_type,
      category_id,
      sub_category_id,
      service_types,
      add_ons,
      is_available,
      image
    } = req.body;

    // Validation: Only admin/owner/manager can manage menu
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const valError = sanitizeAndValidate(name, description, price, original_price);
    if (valError) {
      return res.status(400).json({ success: false, error: valError });
    }

    const item = await prisma.restaurantMenuItem.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        price: parseFloat(price),
        original_price: original_price !== null && original_price !== undefined && original_price !== "" ? parseFloat(original_price) : null,
        food_type: food_type || null,
        categoryId: category_id ? parseInt(category_id, 10) : null,
        subCategoryId: sub_category_id ? parseInt(sub_category_id, 10) : null,
        service_types: toStringArray(service_types),
        add_on_ids: toIntArray(add_ons),
        is_available: is_available !== false,
        image: image || null,
        shopId: parseInt(shopId)
      }
    });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Create Menu Item',
      `Created menu item ${item.name} • Price: ₹${item.price}`,
      'Restaurant Menu',
      'Success'
    );

    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error('Create menu item error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Create Menu Item',
      'Failed to create menu item',
      'Restaurant Menu',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to create menu item' });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { id } = req.params;
    const {
      name,
      description,
      price,
      original_price,
      food_type,
      category_id,
      sub_category_id,
      service_types,
      add_ons,
      is_available,
      image
    } = req.body;

    // Validation
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    let checkPrice = price;
    let checkOrig = original_price;
    if (price === undefined || original_price === undefined) {
      const existingItem = await prisma.restaurantMenuItem.findFirst({
        where: { id: parseInt(id), shopId: parseInt(shopId) }
      });
      if (existingItem) {
        if (price === undefined) checkPrice = existingItem.price;
        if (original_price === undefined) checkOrig = existingItem.original_price;
      }
    }

    const valError = sanitizeAndValidate(name, description, checkPrice, checkOrig);
    if (valError) {
      return res.status(400).json({ success: false, error: valError });
    }

    const updated = await prisma.restaurantMenuItem.updateMany({
      where: { id: parseInt(id), shopId: parseInt(shopId) },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        description: description !== undefined ? (description ? String(description).trim() : null) : undefined,
        price: price !== undefined ? parseFloat(price) : undefined,
        original_price: original_price !== undefined ? (original_price !== null && original_price !== "" ? parseFloat(original_price) : null) : undefined,
        food_type: food_type !== undefined ? (food_type || null) : undefined,
        categoryId: category_id !== undefined ? (category_id ? parseInt(category_id, 10) : null) : undefined,
        subCategoryId: sub_category_id !== undefined ? (sub_category_id ? parseInt(sub_category_id, 10) : null) : undefined,
        service_types: service_types !== undefined ? toStringArray(service_types) : undefined,
        add_on_ids: add_ons !== undefined ? toIntArray(add_ons) : undefined,
        is_available: is_available !== undefined ? !!is_available : undefined,
        image: image !== undefined ? (image || null) : undefined
      }
    });

    if (updated.count === 0) return res.status(404).json({ success: false, error: 'Menu item not found' });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Update Menu Item',
      `Updated menu item ${id}`,
      'Restaurant Menu',
      'Success'
    );

    res.json({ success: true, message: 'Menu item updated successfully' });
  } catch (error) {
    console.error('Update menu item error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Update Menu Item',
      `Failed to update menu item ${req.params?.id || ''}`.trim(),
      'Restaurant Menu',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to update menu item' });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { id } = req.params;

    // Validation
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const deleted = await prisma.restaurantMenuItem.updateMany({
      where: { id: parseInt(id), shopId: parseInt(shopId) },
      data: { isDeleted: true }
    });

    if (deleted.count === 0) return res.status(404).json({ success: false, error: 'Menu item not found' });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Delete Menu Item',
      `Deleted menu item ${id}`,
      'Restaurant Menu',
      'Success'
    );

    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Delete Menu Item',
      `Failed to delete menu item ${req.params?.id || ''}`.trim(),
      'Restaurant Menu',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to delete menu item' });
  }
};

const getCategories = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const categories = await prisma.restaurantMenuCategory.findMany({
      where: { shopId: parseInt(shopId) },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
};

const validateCategoryNameBackend = (name) => {
  const htmlRegex = /<[^>]*>/g;
  const scriptRegex = /javascript:/gi;

  if (name === undefined || name === null || String(name).trim() === "") {
    return "Name is required and cannot be empty spaces";
  }
  const nameTrimmed = String(name).trim();
  if (nameTrimmed.length < 3) {
    return "Name must be at least 3 characters";
  }
  if (nameTrimmed.length > 30) {
    return "Name cannot exceed 30 characters";
  }
  if (htmlRegex.test(nameTrimmed) || scriptRegex.test(nameTrimmed)) {
    return "HTML tags or script values are not allowed";
  }
  return null;
};

const createCategory = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { name, food_type } = req.body;

    // Validation
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const valErr = validateCategoryNameBackend(name);
    if (valErr) {
      return res.status(400).json({ success: false, error: valErr });
    }

    const nameTrimmed = String(name).trim();
    const existing = await prisma.restaurantMenuCategory.findFirst({
      where: {
        shopId: parseInt(shopId),
        name: { equals: nameTrimmed, mode: 'insensitive' }
      }
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Category already exists' });
    }

    const category = await prisma.restaurantMenuCategory.create({
      data: {
        name: nameTrimmed,
        food_type: food_type || null,
        shopId: parseInt(shopId)
      }
    });
    await createLog(
      req,
      req.user.id,
      shopId,
      'Create Category',
      `Created category ${category.name}`,
      'Restaurant Menu',
      'Success'
    );

    res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Create category error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Create Category',
      'Failed to create category',
      'Restaurant Menu',
      'Failed'
    );
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Category already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { id } = req.params;
    const { name, food_type } = req.body;

    // Validation
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    if (name !== undefined) {
      const valErr = validateCategoryNameBackend(name);
      if (valErr) {
        return res.status(400).json({ success: false, error: valErr });
      }
    }

    const updated = await prisma.restaurantMenuCategory.updateMany({
      where: { id: parseInt(id), shopId: parseInt(shopId) },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        food_type: food_type !== undefined ? (food_type || null) : undefined
      }
    });

    if (updated.count === 0) return res.status(404).json({ success: false, error: 'Category not found' });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Update Category',
      `Updated category ${id}`,
      'Restaurant Menu',
      'Success'
    );

    res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update category error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Update Category',
      `Failed to update category ${req.params?.id || ''}`.trim(),
      'Restaurant Menu',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { id } = req.params;

    // Validation
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const deleted = await prisma.restaurantMenuCategory.deleteMany({
      where: { id: parseInt(id), shopId: parseInt(shopId) }
    });
    if (deleted.count === 0) return res.status(404).json({ success: false, error: 'Category not found' });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Delete Category',
      `Deleted category ${id}`,
      'Restaurant Menu',
      'Success'
    );

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Delete Category',
      `Failed to delete category ${req.params?.id || ''}`.trim(),
      'Restaurant Menu',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
};

const getSubCategories = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const subCategories = await prisma.restaurantMenuSubCategory.findMany({
      where: { shopId: parseInt(shopId) },
      orderBy: { name: 'asc' }
    });
    const mapped = subCategories.map(sub => ({
      id: sub.id,
      name: sub.name,
      category_id: sub.categoryId,
      categoryId: sub.categoryId
    }));
    res.json({ success: true, subCategories: mapped });
  } catch (error) {
    console.error('Get sub-categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sub-categories' });
  }
};

const createSubCategory = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { name, category_id } = req.body;

    // Validation
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const valErr = validateCategoryNameBackend(name);
    if (valErr) {
      return res.status(400).json({ success: false, error: valErr });
    }

    const nameTrimmed = String(name).trim();
    const existing = await prisma.restaurantMenuSubCategory.findFirst({
      where: {
        shopId: parseInt(shopId),
        name: { equals: nameTrimmed, mode: 'insensitive' }
      }
    });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Sub-category already exists' });
    }

    const subCategory = await prisma.restaurantMenuSubCategory.create({
      data: {
        name: nameTrimmed,
        categoryId: category_id ? parseInt(category_id, 10) : null,
        shopId: parseInt(shopId)
      }
    });
    await createLog(
      req,
      req.user.id,
      shopId,
      'Create Sub Category',
      `Created sub-category ${subCategory.name}`,
      'Restaurant Menu',
      'Success'
    );

    res.status(201).json({ success: true, subCategory });
  } catch (error) {
    console.error('Create sub-category error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Create Sub Category',
      'Failed to create sub-category',
      'Restaurant Menu',
      'Failed'
    );
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Sub-category already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create sub-category' });
  }
};

const updateSubCategory = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { id } = req.params;
    const { name, category_id } = req.body;

    // Validation
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    if (name !== undefined) {
      const valErr = validateCategoryNameBackend(name);
      if (valErr) {
        return res.status(400).json({ success: false, error: valErr });
      }
    }

    const updated = await prisma.restaurantMenuSubCategory.updateMany({
      where: { id: parseInt(id), shopId: parseInt(shopId) },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        categoryId: category_id !== undefined ? (category_id ? parseInt(category_id, 10) : null) : undefined
      }
    });

    if (updated.count === 0) return res.status(404).json({ success: false, error: 'Sub-category not found' });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Update Sub Category',
      `Updated sub-category ${id}`,
      'Restaurant Menu',
      'Success'
    );

    res.json({ success: true, message: 'Sub-category updated successfully' });
  } catch (error) {
    console.error('Update sub-category error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Update Sub Category',
      `Failed to update sub-category ${req.params?.id || ''}`.trim(),
      'Restaurant Menu',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to update sub-category' });
  }
};

const deleteSubCategory = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { id } = req.params;

    // Validation
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const deleted = await prisma.restaurantMenuSubCategory.deleteMany({
      where: { id: parseInt(id), shopId: parseInt(shopId) }
    });
    if (deleted.count === 0) return res.status(404).json({ success: false, error: 'Sub-category not found' });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Delete Sub Category',
      `Deleted sub-category ${id}`,
      'Restaurant Menu',
      'Success'
    );

    res.json({ success: true, message: 'Sub-category deleted successfully' });
  } catch (error) {
    console.error('Delete sub-category error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Delete Sub Category',
      `Failed to delete sub-category ${req.params?.id || ''}`.trim(),
      'Restaurant Menu',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to delete sub-category' });
  }
};

const getDeletedItems = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const items = await prisma.restaurantMenuItem.findMany({
      where: {
        shopId: parseInt(shopId),
        isDeleted: true
      },
      include: { category: true, subCategory: true },
      orderBy: { id: 'desc' }
    });

    const mapped = items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      original_price: item.original_price,
      food_type: item.food_type,
      category_id: item.categoryId,
      sub_category_id: item.subCategoryId,
      category_name: item.category?.name || null,
      sub_category_name: item.subCategory?.name || null,
      category: item.category?.name || null,
      sub_category: item.subCategory?.name || null,
      service_types: item.service_types || [],
      add_ons: item.add_on_ids || [],
      is_available: item.is_available,
      image: item.image
    }));

    res.json({ success: true, items: mapped });
  } catch (error) {
    console.error('Get deleted items error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch deleted items' });
  }
};

const restoreMenuItem = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { id } = req.params;

    // Validation
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const restored = await prisma.restaurantMenuItem.updateMany({
      where: { id: parseInt(id), shopId: parseInt(shopId) },
      data: { isDeleted: false }
    });

    if (restored.count === 0) return res.status(404).json({ success: false, error: 'Menu item not found' });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Restore Menu Item',
      `Restored menu item ${id}`,
      'Restaurant Menu',
      'Success'
    );

    res.json({ success: true, message: 'Menu item restored successfully' });
  } catch (error) {
    console.error('Restore menu item error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Restore Menu Item',
      `Failed to restore menu item ${req.params?.id || ''}`.trim(),
      'Restaurant Menu',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to restore menu item' });
  }
};

const permanentlyDeleteMenuItem = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const userRole = req.user.role;
    const { id } = req.params;

    // Validation
    if (userRole !== 'shop_owner' && userRole !== 'admin' && userRole !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Permission denied' });
    }

    const deleted = await prisma.restaurantMenuItem.deleteMany({
      where: { id: parseInt(id), shopId: parseInt(shopId), isDeleted: true }
    });

    if (deleted.count === 0) return res.status(404).json({ success: false, error: 'Menu item not found' });

    await createLog(
      req,
      req.user.id,
      shopId,
      'Permanently Delete Menu Item',
      `Permanently deleted menu item ${id}`,
      'Restaurant Menu',
      'Success'
    );

    res.json({ success: true, message: 'Menu item permanently deleted' });
  } catch (error) {
    console.error('Permanent delete menu item error:', error);
    await createLog(
      req,
      req.user?.id,
      req.user?.shopId,
      'Permanently Delete Menu Item',
      `Failed to permanently delete menu item ${req.params?.id || ''}`.trim(),
      'Restaurant Menu',
      'Failed'
    );
    res.status(500).json({ success: false, error: 'Failed to permanently delete menu item' });
  }
};

const getAddOns = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const addOns = await prisma.restaurantMenuAddOn.findMany({
      where: { shopId: parseInt(shopId) },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, addOns });
  } catch (error) {
    console.error('Get add-ons error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch add-ons' });
  }
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getAddOns,
  getDeletedItems,
  restoreMenuItem,
  permanentlyDeleteMenuItem
};
