const prisma = require('../lib/prisma');
const { createLog } = require('./logController');

// Calculate current stock for an item based on stock entries
const calculateCurrentStock = async (itemId, shopId) => {
  try {
    const stockEntries = await prisma.stockEntry.findMany({
      where: {
        itemId: parseInt(itemId),
        shopId: parseInt(shopId)
      },
      select: {
        quantity: true,
        stockType: true
      }
    });

    let totalStock = 0;
    stockEntries.forEach(entry => {
      if (entry.stockType === 'in') {
        totalStock += parseFloat(entry.quantity);
      } else if (entry.stockType === 'out') {
        totalStock -= parseFloat(entry.quantity);
      }
    });

    return totalStock;
  } catch (error) {
    console.error('Error calculating stock:', error);
    return 0;
  }
};

// Function to update inventory item's default_quantity
const updateInventoryStock = async (itemId, shopId, newQuantity) => {
  try {
    await prisma.inventoryItem.update({
      where: { 
        id: parseInt(itemId),
        shopId: parseInt(shopId)
      },
      data: {
        default_quantity: parseFloat(newQuantity)
      }
    });
    console.log(`✅ Updated inventory item ${itemId} stock to ${newQuantity}`);
  } catch (error) {
    console.error('❌ Error updating inventory stock:', error);
    throw error;
  }
};

// Get all stock entries for a shop with filters
const getStockEntries = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { 
      search, 
      itemId, 
      stockType, 
      dateFrom, 
      dateTo,
      page = 1, 
      limit = 10,
      sortBy = 'newest'
    } = req.query;

    console.log('📥 Fetching stock entries for shop:', shopId, 'with filters:', req.query);

    // Validate shopId
    if (!shopId || isNaN(parseInt(shopId))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID'
      });
    }

    const numericShopId = parseInt(shopId);
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    let where = { 
      shopId: numericShopId
    };

    // Item filter
    if (itemId) {
      where.itemId = parseInt(itemId);
    }

    // Stock type filter
    if (stockType) {
      where.stockType = stockType;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Set to end of day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Search filter (search in item name or code)
    if (search) {
      where.OR = [
        {
          item: {
            item_name: { contains: search, mode: 'insensitive' }
          }
        },
        {
          item: {
            item_code: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    // Build orderBy based on sortBy parameter
    let orderBy = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'name_asc':
        orderBy = { item: { item_name: 'asc' } };
        break;
      case 'name_desc':
        orderBy = { item: { item_name: 'desc' } };
        break;
      case 'quantity_high':
        orderBy = { quantity: 'desc' };
        break;
      case 'quantity_low':
        orderBy = { quantity: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [entries, total] = await Promise.all([
      prisma.stockEntry.findMany({
        where,
        include: {
          item: {
            select: {
              id: true,
              item_name: true,
              item_code: true,
              brand: true,
              category: true,
              original_price: true,
              selling_price: true,
              default_quantity: true
            }
          },
          unit: {
            select: {
              id: true,
              name: true,
              symbol: true
            }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.stockEntry.count({ where })
    ]);

    // Get items for filter dropdown
    const items = await prisma.inventoryItem.findMany({
      where: { shopId: numericShopId },
      select: {
        id: true,
        item_name: true,
        item_code: true
      },
      orderBy: { item_name: 'asc' }
    });

    console.log(`✅ Found ${entries.length} stock entries for shop ${shopId}`);

    res.json({
      success: true,
      data: entries,
      filters: {
        items: items
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching stock entries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock entries: ' + error.message
    });
  }
};

// Get single stock entry
const getStockEntry = async (req, res) => {
  try {
    const { shopId, id } = req.params;

    // Validate IDs
    if (!shopId || !id || isNaN(parseInt(shopId)) || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID or stock entry ID'
      });
    }

    const numericShopId = parseInt(shopId);
    const numericId = parseInt(id);

    // Find the stock entry - VERIFY IT BELONGS TO SHOP
    const stockEntry = await prisma.stockEntry.findFirst({
      where: {
        id: numericId,
        shopId: numericShopId
      },
      include: {
        item: {
          select: {
            id: true,
            item_name: true,
            item_code: true,
            brand: true,
            category: true,
            original_price: true,
            selling_price: true,
            default_quantity: true
          }
        },
        unit: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        }
      }
    });

    if (!stockEntry) {
      return res.status(404).json({
        success: false,
        error: 'Stock entry not found in this shop'
      });
    }

    res.json({
      success: true,
      data: stockEntry,
      message: 'Stock entry retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching stock entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock entry: ' + error.message
    });
  }
};

// Create new stock entry
const createStockEntry = async (req, res) => {
  try {
    const { itemId, quantity, unitId, stockType, pricePerUnit, notes, shopId } = req.body;

    // Validate required fields
    if (!itemId || !quantity || !unitId || !stockType || !shopId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: itemId, quantity, unitId, stockType, and shopId are required'
      });
    }

    // Parse IDs
    const parsedItemId = parseInt(itemId);
    const parsedUnitId = parseInt(unitId);
    const parsedShopId = parseInt(shopId);
    const parsedQuantity = parseFloat(quantity);
    const parsedPricePerUnit = pricePerUnit ? parseFloat(pricePerUnit) : null;

    // Check if shop exists
    const shop = await prisma.shop.findFirst({
      where: { id: parsedShopId }
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: `Shop with ID ${parsedShopId} not found`
      });
    }

    // Check if item exists and belongs to the same shop
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: parsedItemId,
        shopId: parsedShopId
      }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in this shop'
      });
    }

    // Check if unit exists
    const unit = await prisma.unit.findFirst({
      where: { id: parsedUnitId }
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        error: `Unit with ID ${parsedUnitId} not found`
      });
    }

    // Calculate total value
    const totalValue = parsedPricePerUnit ? parsedQuantity * parsedPricePerUnit : null;

    // Create stock entry - ASSIGN TO SPECIFIC SHOP
    const stockEntry = await prisma.stockEntry.create({
      data: {
        itemId: parsedItemId,
        quantity: parsedQuantity,
        unitId: parsedUnitId,
        stockType,
        pricePerUnit: parsedPricePerUnit,
        totalValue,
        notes: notes || null,
        shopId: parsedShopId // CRITICAL: Assign to shop
      },
      include: {
        item: {
          select: {
            id: true,
            item_name: true,
            item_code: true,
            brand: true,
            category: true,
            original_price: true,
            selling_price: true
          }
        },
        unit: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        }
      }
    });

    // ✅ SYNC: Update inventory item's stock
    const currentStock = await calculateCurrentStock(parsedItemId, parsedShopId);
    await updateInventoryStock(parsedItemId, parsedShopId, currentStock);

    // ✅ ACTIVITY LOG: New stock entry (In/Out)
    if (req.user && req.user.id && req.user.shopId) {
      const action =
        stockType === 'in'
          ? 'STOCK_IN'
          : stockType === 'out'
          ? 'STOCK_OUT'
          : 'STOCK_ENTRY';

      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        action,
        `Stock ${stockType} of ${parsedQuantity} units for item ID ${parsedItemId} in shop ${parsedShopId}`,
        'Stock',
        'Success'
      );
    }

    res.status(201).json({
      success: true,
      data: stockEntry,
      message: 'Stock entry created successfully'
    });

  } catch (error) {
    console.error('Error creating stock entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create stock entry: ' + error.message
    });
  }
};

// Update stock entry
const updateStockEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, quantity, unitId, stockType, pricePerUnit, notes, shopId } = req.body;

    // Validate required fields
    if (!itemId || !quantity || !unitId || !stockType || !shopId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: itemId, quantity, unitId, stockType, and shopId are required'
      });
    }

    const numericShopId = parseInt(shopId);

    // Check if stock entry exists and belongs to shop
    const existingEntry = await prisma.stockEntry.findFirst({
      where: {
        id: parseInt(id),
        shopId: numericShopId
      }
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        error: 'Stock entry not found in this shop'
      });
    }

    // Check if item exists and belongs to the same shop
    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: parseInt(itemId),
        shopId: numericShopId
      }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in this shop'
      });
    }

    // Calculate total value
    const totalValue = pricePerUnit ? parseFloat(quantity) * parseFloat(pricePerUnit) : null;

    // Update stock entry
    const updatedEntry = await prisma.stockEntry.update({
      where: { id: parseInt(id) },
      data: {
        itemId: parseInt(itemId),
        quantity: parseFloat(quantity),
        unitId: parseInt(unitId),
        stockType,
        pricePerUnit: pricePerUnit ? parseFloat(pricePerUnit) : null,
        totalValue,
        notes: notes || null,
        shopId: numericShopId
      },
      include: {
        item: {
          select: {
            id: true,
            item_name: true,
            item_code: true,
            brand: true,
            category: true,
            original_price: true,
            selling_price: true
          }
        },
        unit: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        }
      }
    });

    // ✅ SYNC: Update inventory item's stock
    const currentStock = await calculateCurrentStock(parseInt(itemId), numericShopId);
    await updateInventoryStock(parseInt(itemId), numericShopId, currentStock);

    // ✅ ACTIVITY LOG: Updated stock entry
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'STOCK_UPDATE',
        `Updated stock entry ID ${id} for item ID ${itemId} in shop ${numericShopId}`,
        'Stock',
        'Success'
      );
    }

    res.json({
      success: true,
      data: updatedEntry,
      message: 'Stock entry updated successfully'
    });

  } catch (error) {
    console.error('Error updating stock entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update stock entry: ' + error.message
    });
  }
};

// Delete stock entry
const deleteStockEntry = async (req, res) => {
  try {
    const { shopId, id } = req.params;

    // Validate IDs
    if (!shopId || !id || isNaN(parseInt(shopId)) || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID or stock entry ID'
      });
    }

    const numericShopId = parseInt(shopId);
    const numericId = parseInt(id);

    // Check if stock entry exists and belongs to shop
    const existingEntry = await prisma.stockEntry.findFirst({
      where: {
        id: numericId,
        shopId: numericShopId
      }
    });

    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        error: 'Stock entry not found in this shop'
      });
    }

    // Get item ID before deletion for sync
    const itemId = existingEntry.itemId;

    // Delete stock entry
    await prisma.stockEntry.delete({
      where: { id: numericId }
    });

    // ✅ SYNC: Update inventory item's stock after deletion
    const currentStock = await calculateCurrentStock(itemId, numericShopId);
    await updateInventoryStock(itemId, numericShopId, currentStock);

    // ✅ ACTIVITY LOG: Deleted stock entry
    if (req.user && req.user.id && req.user.shopId) {
      await createLog(
        req,
        req.user.id,
        req.user.shopId,
        'STOCK_DELETE',
        `Deleted stock entry ID ${numericId} for item ID ${itemId} in shop ${numericShopId}`,
        'Stock',
        'Success'
      );
    }

    res.json({
      success: true,
      message: 'Stock entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting stock entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete stock entry: ' + error.message
    });
  }
};

// Get stock levels
const getStockLevels = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Validate shopId
    if (!shopId || isNaN(parseInt(shopId))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID'
      });
    }

    const numericShopId = parseInt(shopId);

    // Calculate stock levels by summing quantities grouped by item - ONLY FOR THIS SHOP
    const stockLevels = await prisma.stockEntry.groupBy({
      by: ['itemId'],
      where: {
        shopId: numericShopId
      },
      _sum: {
        quantity: true
      }
    });

    // Get item details for each stock level
    const stockLevelsWithDetails = await Promise.all(
      stockLevels.map(async (level) => {
        const item = await prisma.inventoryItem.findFirst({
          where: { 
            id: level.itemId,
            shopId: numericShopId
          },
          include: {
            unit: {
              select: {
                id: true,
                name: true,
                symbol: true
              }
            }
          }
        });

        return {
          itemId: level.itemId,
          item_name: item?.item_name || 'Unknown Item',
          item_code: item?.item_code || 'N/A',
          unit: item?.unit,
          original_price: item?.original_price,
          selling_price: item?.selling_price,
          totalQuantity: level._sum.quantity || 0
        };
      })
    );

    res.json({
      success: true,
      data: stockLevelsWithDetails,
      message: 'Stock levels retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching stock levels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock levels: ' + error.message
    });
  }
};

module.exports = {
  getStockEntries,
  getStockEntry,
  createStockEntry,
  updateStockEntry,
  deleteStockEntry,
  getStockLevels
};