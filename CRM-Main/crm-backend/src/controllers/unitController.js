const prisma = require('../lib/prisma');

// Get all unit categories (no shopId needed)
const getUnitCategories = async (req, res) => {
  try {
    const categories = await prisma.unitCategory.findMany({
      include: {
        units: {
          orderBy: { isBaseUnit: 'desc' }
        }
      }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Get unit categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unit categories'
    });
  }
};

// Get all units (no shopId needed)
const getUnits = async (req, res) => {
  try {
    const units = await prisma.unit.findMany({
      include: {
        unitCategory: true
      },
      orderBy: [
        { unitCategory: { name: 'asc' } },
        { isBaseUnit: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: units
    });
  } catch (error) {
    console.error('❌ Get units error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch units'
    });
  }
};

// Create default units for a new shop
const createDefaultUnits = async (req, res) => {
  try {
    // Check if default units already exist
    const existingCategories = await prisma.unitCategory.findMany();
    
    if (existingCategories.length > 0) {
      return res.json({
        success: true,
        message: 'Default units already exist'
      });
    }

    // Default unit categories and units
    const defaultData = [
      {
        name: 'Weight',
        description: 'Units for measuring weight',
        units: [
          { name: 'Kilogram', symbol: 'kg', conversionRate: 1, isBaseUnit: true },
          { name: 'Gram', symbol: 'g', conversionRate: 0.001, isBaseUnit: false }
        ]
      },
      {
        name: 'Volume',
        description: 'Units for measuring volume',
        units: [
          { name: 'Liter', symbol: 'L', conversionRate: 1, isBaseUnit: true },
          { name: 'Milliliter', symbol: 'ml', conversionRate: 0.001, isBaseUnit: false }
        ]
      },
      {
        name: 'Count',
        description: 'Units for counting items',
        units: [
          { name: 'Piece', symbol: 'pc', conversionRate: 1, isBaseUnit: true },
          { name: 'Quantity', symbol: 'qty', conversionRate: 1, isBaseUnit: false }
        ]
      }
    ];

    // Create categories and units
    for (const categoryData of defaultData) {
      const category = await prisma.unitCategory.create({
        data: {
          name: categoryData.name,
          description: categoryData.description
        }
      });

      for (const unitData of categoryData.units) {
        await prisma.unit.create({
          data: {
            ...unitData,
            unitCategoryId: category.id
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Default units created successfully'
    });
  } catch (error) {
    console.error('❌ Create default units error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create default units'
    });
  }
};

// Create custom unit
const createUnit = async (req, res) => {
  try {
    const { name, symbol, conversionRate, isBaseUnit, unitCategoryId } = req.body;

    const unit = await prisma.unit.create({
      data: {
        name,
        symbol,
        conversionRate: parseFloat(conversionRate),
        isBaseUnit: Boolean(isBaseUnit),
        unitCategoryId: parseInt(unitCategoryId)
      }
    });

    res.json({
      success: true,
      data: unit,
      message: 'Unit created successfully'
    });
  } catch (error) {
    console.error('❌ Create unit error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create unit'
    });
  }
};

// Get units by category ID
const getUnitsByCategory = async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId);
    
    const units = await prisma.unit.findMany({
      where: { unitCategoryId: categoryId },
      orderBy: { conversionRate: 'asc' }
    });

    res.json({
      success: true,
      units: units
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUnitCategories,
  getUnits,
  createDefaultUnits,
  createUnit,
  getUnitsByCategory
};