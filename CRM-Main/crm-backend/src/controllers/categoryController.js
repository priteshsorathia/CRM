const prisma = require('../lib/prisma');

// Get all categories for a shop (including unique names used in inventory)
const getCategories = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    console.log('📬 Fetching categories for shopId:', shopId);
    
    // 1. Fetch explicitly created categories
    const categoriesList = await prisma.category.findMany({
      where: { shopId },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch unique category strings currently used in inventory items
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { shopId },
      select: { category: true },
      distinct: ['category']
    });

    // Combine and preserve real IDs for explicit categories
    const explicitCategoryNames = new Map(categoriesList.map(c => [c.name, c.id]));
    
    // Get unique names from inventory that aren't in explicit categories
    const inventoryCategoryNames = inventoryItems
      .map(item => item.category?.trim())
      .filter(name => name && !explicitCategoryNames.has(name));

    // Newest explicit categories first, then inventory-derived categories
    const finalCategories = [
      ...categoriesList.map(c => ({ id: c.id, name: c.name, isExplicit: true })),
      ...[...new Set(inventoryCategoryNames)].map((name, index) => ({ 
        id: `inv-${index}`, 
        name, 
        isExplicit: false 
      }))
    ];

    console.log(`✅ Found ${finalCategories.length} categories (combined) for shop ${shopId}`);
    res.json({ success: true, data: finalCategories });
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create a new category
const createCategory = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const category = await prisma.category.create({
      data: {
        name,
        shopId
      }
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Category already exists' });
    }
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);
    const { id } = req.params;

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return res.status(400).json({ success: false, error: 'Invalid category ID' });
    }

    // 1. Get the category to find its name
    const category = await prisma.category.findFirst({
      where: { 
        id: parsedId,
        shopId 
      }
    });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // 2. Check if any InventoryItems are using this category name (case-insensitive & trimmed)
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { shopId },
      select: { category: true },
      distinct: ['category']
    });

    const isLinked = inventoryItems.some(
      item => item.category?.trim().toLowerCase() === category.name.trim().toLowerCase()
    );

    if (isLinked) {
      return res.status(400).json({ 
        success: false, 
        error: 'Category is associated with an item and cannot be deleted' 
      });
    }

    // 3. Delete the category
    await prisma.category.delete({
      where: { id: parsedId }
    });

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getCategories, createCategory, deleteCategory };