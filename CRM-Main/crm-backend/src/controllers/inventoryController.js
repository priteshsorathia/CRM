const prisma = require('../lib/prisma');
const { createLog } = require('./logController');
const { generateBarcode } = require('../utils/barcode');

// Helper: Calculate current stock based on stock entries
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

    // Only calculate from stock entries
    stockEntries.forEach(entry => {
      if (entry.stockType === 'in') {
        totalStock += parseFloat(entry.quantity);
      } else if (entry.stockType === 'out') {
        totalStock -= parseFloat(entry.quantity);
      }
    });

    return Math.max(0, totalStock);
  } catch (error) {
    console.error('Error calculating stock:', error);
    return 0;
  }
};

// Get inventory items for current shop (for invoice module - simple list)
const getInventoryItems = async (req, res) => {
  try {
    const shopId = parseInt(req.user.shopId);

    console.log('📦 Fetching inventory items (including combos) for shop:', shopId);

    // 1) Normal inventory items
    const items = await prisma.inventoryItem.findMany({
      where: { shopId },
      include: {
        unit: {
          include: {
            unitCategory: true
          }
        }
      },
      orderBy: {
        item_name: 'asc'
      }
    });

    // Calculate current stock for each simple item
    const itemsWithStock = await Promise.all(
      items.map(async (item) => {
        const currentStock = await calculateCurrentStock(item.id, shopId);
        return {
          ...item,
          isCombo: false,
          current_stock: currentStock
        };
      })
    );

    // Filter: Include all items (even with 0 stock) so they can be added to invoices
    const availableItems = itemsWithStock;

    // 2) Combo products
    const comboProducts = await prisma.comboProduct.findMany({
      where: { shopId },
      include: {
        items: {
          include: {
            inventoryItem: {
              include: {
                unit: {
                  include: { unitCategory: true }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const combosWithStock = await Promise.all(
      comboProducts.map(async (combo) => {
        // Available combos limited by lowest stock of component items
        let maxComboStock = Infinity;

        for (const ci of combo.items) {
          const itemStock = await calculateCurrentStock(ci.inventoryItemId, shopId);
          const requiredQty = ci.quantity || 1;
          const possible = requiredQty > 0 ? Math.floor(itemStock / requiredQty) : 0;
          maxComboStock = Math.min(maxComboStock, possible);
        }

        if (!Number.isFinite(maxComboStock) || maxComboStock < 0) {
          maxComboStock = 0;
        }

        return {
          ...combo,
          isCombo: true,
          current_stock: maxComboStock
        };
      })
    );

    const availableCombos = combosWithStock.filter(c => c.current_stock > 0);

    console.log(
      `✅ Found ${availableItems.length} simple items and ${availableCombos.length} combo items for shop ${shopId}`
    );

    res.json({
      success: true,
      items: availableItems,
      combos: availableCombos
    });
  } catch (error) {
    console.error('❌ Error fetching inventory items:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get ALL inventory items with filtering and pagination (Main Inventory Page)
const getAllInventoryItems = async (req, res) => {
  try {
    const { shopId } = req.params;
    const userShopId = parseInt(req.user.shopId);

    // Validate shop ID from params
    if (!shopId || isNaN(parseInt(shopId))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID in request'
      });
    }

    const numericShopId = parseInt(shopId);

    // Verify user has access to this shop
    if (numericShopId !== userShopId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this shop'
      });
    }

    // Get query parameters
    const {
      search = '',
      category = '',
      brand = '',
      stockStatus = '',
      sortBy = 'name_asc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter conditions
    const whereConditions = {
      shopId: numericShopId
    };

    // Search filter (item_name, item_code or barcode)
    if (search) {
      whereConditions.OR = [
        {
          item_name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          item_code: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          barcode: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Category filter
    if (category) {
      whereConditions.category = category;
    }

    // Brand filter
    if (brand) {
      whereConditions.brand = brand;
    }

    // Calculate total count
    const totalItems = await prisma.inventoryItem.count({
      where: whereConditions
    });

    // Calculate skip for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build orderBy based on sortBy parameter
    let orderBy = {};
    switch (sortBy) {
      case 'name_asc':
        orderBy = { item_name: 'asc' };
        break;
      case 'name_desc':
        orderBy = { item_name: 'desc' };
        break;
      case 'price_high':
        orderBy = { selling_price: 'desc' };
        break;
      case 'price_low':
        orderBy = { selling_price: 'asc' };
        break;
      case 'stock_high':
        orderBy = { default_quantity: 'desc' }; // Note: This sorts by default qty, not calculated stock
        break;
      case 'stock_low':
        orderBy = { default_quantity: 'asc' };
        break;
      default:
        orderBy = { item_name: 'asc' };
    }

    // Fetch items with filters
    const items = await prisma.inventoryItem.findMany({
      where: whereConditions,
      include: {
        unit: {
          include: {
            unitCategory: true
          }
        }
      },
      orderBy: orderBy,
      skip: skip,
      take: parseInt(limit)
    });

    // Calculate current stock for each item
    const itemsWithStock = await Promise.all(
      items.map(async (item) => {
        const currentStock = await calculateCurrentStock(item.id, numericShopId);
        return {
          ...item,
          current_stock: currentStock
        };
      })
    );

    // Apply stock status filter after calculating stock
    let filteredItems = itemsWithStock;
    if (stockStatus) {
      filteredItems = itemsWithStock.filter(item => {
        if (stockStatus === 'in_stock' && item.current_stock > 0) return true;
        if (stockStatus === 'low_stock' && item.current_stock > 0 && item.current_stock <= 10) return true;
        if (stockStatus === 'out_of_stock' && item.current_stock <= 0) return true;
        return false;
      });
    }

    // Get distinct categories and brands for filters
    const categories = await prisma.inventoryItem.findMany({
      where: {
        shopId: numericShopId,
        category: { not: null }
      },
      distinct: ['category'],
      select: { category: true }
    });

    const brands = await prisma.inventoryItem.findMany({
      where: {
        shopId: numericShopId,
        brand: { not: null }
      },
      distinct: ['brand'],
      select: { brand: true }
    });

    // ✅ Also fetch combo products for this shop (not paginated, usually small count)
    const comboProducts = await prisma.comboProduct.findMany({
      where: { shopId: numericShopId },
      include: {
        items: {
          include: {
            inventoryItem: {
              include: {
                unit: {
                  include: { unitCategory: true }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Calculate effective current stock for each combo product
    const combosWithStock = await Promise.all(
      comboProducts.map(async (combo) => {
        let maxComboStock = Infinity;

        for (const ci of combo.items) {
          const itemStock = await calculateCurrentStock(ci.inventoryItemId, numericShopId);
          const requiredQty = ci.quantity || 1;
          const possible = requiredQty > 0 ? Math.floor(itemStock / requiredQty) : 0;
          maxComboStock = Math.min(maxComboStock, possible);
        }

        if (!Number.isFinite(maxComboStock) || maxComboStock < 0) {
          maxComboStock = 0;
        }

        return {
          ...combo,
          isCombo: true,
          current_stock: maxComboStock
        };
      })
    );

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / parseInt(limit));

    res.json({
      success: true,
      data: filteredItems,
      combos: combosWithStock,
      pagination: {
        total: totalItems,
        pages: totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      },
      filters: {
        categories: categories.map(c => c.category).filter(Boolean),
        brands: brands.map(b => b.brand).filter(Boolean)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching inventory items:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get single inventory item
const getInventoryItem = async (req, res) => {
  try {
    const { id, shopId } = req.params;

    // Validate shopId
    if (!shopId || isNaN(parseInt(shopId))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID'
      });
    }

    const numericShopId = parseInt(shopId);

    const item = await prisma.inventoryItem.findFirst({
      where: {
        id: parseInt(id),
        shopId: numericShopId // CRITICAL: Check item belongs to this shop
      },
      include: {
        unit: {
          include: {
            unitCategory: true
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in this shop'
      });
    }

    // ✅ Calculate current stock for single item
    const currentStock = await calculateCurrentStock(parseInt(id), numericShopId);
    const itemWithStock = {
      ...item,
      current_stock: currentStock,
      // Don't include default_quantity here to avoid confusion
      default_quantity: currentStock
    };

    res.json({
      success: true,
      data: itemWithStock
    });
  } catch (error) {
    console.error('❌ Get inventory item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory item: ' + error.message
    });
  }
};

// Create new inventory item
const createInventoryItem = async (req, res) => {
  try {
    let {
      item_name,
      item_code,
      category,
      brand,
      original_price,
      selling_price,
      default_quantity,
      item_image,
      default_unit_id,
      shopId,
      barcode
    } = req.body;

    // Validate required fields
    if (!item_name || !item_code || !default_unit_id || !shopId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: item_name, item_code, default_unit_id, and shopId are required'
      });
    }

    // Trim strings and perform security validation
    item_name = item_name.trim();
    item_code = item_code.trim();
    if (category) category = category.trim();
    if (brand) brand = brand.trim();
    if (barcode) barcode = barcode.trim();

    const invalidCharRegex = /[<>]/;
    if (invalidCharRegex.test(item_name) || invalidCharRegex.test(item_code) || 
       (category && invalidCharRegex.test(category)) || 
       (brand && invalidCharRegex.test(brand)) || 
       (barcode && invalidCharRegex.test(barcode))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid characters detected. HTML tags (<, >) are not allowed.'
      });
    }

    if (!item_name || !item_code) {
      return res.status(400).json({
        success: false,
        error: 'Item name and code cannot be empty'
      });
    }

    // Validate shopId
    if (isNaN(parseInt(shopId))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID'
      });
    }

    const numericShopId = parseInt(shopId);

    // Check if shop exists
    const shop = await prisma.shop.findFirst({
      where: { id: numericShopId }
    });

    if (!shop) {
      return res.status(404).json({
        success: false,
        error: `Shop with ID ${shopId} not found`
      });
    }

    // Check if item code already exists for this shop
    const existingCode = await prisma.inventoryItem.findFirst({
      where: { item_code, shopId: numericShopId }
    });

    if (existingCode) {
      return res.status(400).json({
        success: false,
        error: 'Item code already exists in this shop'
      });
    }

    // Check if item name already exists for this shop
    const existingName = await prisma.inventoryItem.findFirst({
      where: { item_name: { equals: item_name, mode: 'insensitive' }, shopId: numericShopId }
    });

    if (existingName) {
      return res.status(400).json({
        success: false,
        error: 'Item name already exists in this shop'
      });
    }

    // Check if barcode already exists
    if (barcode) {
      const existingBarcode = await prisma.inventoryItem.findFirst({
        where: { barcode }
      });

      if (existingBarcode) {
        return res.status(400).json({
          success: false,
          error: 'Barcode already exists for another item'
        });
      }
    }

    // Create the item - CRITICAL: Assign to specific shop
    const item = await prisma.inventoryItem.create({
      data: {
        item_name,
        item_code,
        category,
        brand,
        original_price: parseFloat(original_price) || 0,
        selling_price: parseFloat(selling_price) || 0,
        default_quantity: parseFloat(default_quantity) || 0,
        default_unit_id: parseInt(default_unit_id),
        shopId: numericShopId,
        item_image,
        barcode: barcode || null
      },
      include: {
        unit: {
          include: {
            unitCategory: true
          }
        }
      }
    });

    // If barcode was not provided in request, generate it using the new ID and update
    if (!barcode) {
      const generatedBarcode = generateBarcode(item_name, item.id);
      await prisma.inventoryItem.update({
        where: { id: item.id },
        data: { barcode: generatedBarcode }
      });
      // Reflect in local item object for response
      item.barcode = generatedBarcode;
    }
    if (parseFloat(default_quantity) > 0) {
      await prisma.stockEntry.create({
        data: {
          itemId: item.id,
          quantity: parseFloat(default_quantity),
          unitId: parseInt(default_unit_id),
          stockType: 'in',
          pricePerUnit: parseFloat(original_price) || 0,
          totalValue: (parseFloat(original_price) || 0) * parseFloat(default_quantity),
          notes: 'Initial Stock',
          shopId: numericShopId
        }
      });
    }

    // ✅ ACTIVITY LOG: Inventory item created
    if (req.user && req.user.id && req.user.shopId) {
      try {
        await createLog(
          req,
          req.user.id,
          req.user.shopId,
          'INVENTORY_ITEM_CREATE',
          `Created inventory item: ${item.item_name} (Code: ${item.item_code})`,
          'Inventory',
          'Success'
        );
      } catch (logError) {
        console.error('Failed to create inventory item log:', logError);
        // Don't fail the request if logging fails
      }
    }

    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully'
    });
  } catch (error) {
    console.error('❌ Create inventory item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create inventory item: ' + error.message
    });
  }
};

// Create combo inventory product (combo of multiple items)
const createComboInventoryItem = async (req, res) => {
  try {
    const userShopId = parseInt(req.user.shopId);
    let {
      name,
      code,
      description,
      price,
      items, // [{ inventoryItemId, quantity }] OR JSON string when sent via multipart
      // Optional image field when not using file upload
      combo_image,
      image,
      barcode
    } = req.body;

    // If items came as JSON string (from FormData), parse it
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Invalid items format. Expected JSON array.'
        });
      }
    }

    // If using multer upload, prefer file path as image source
    let finalImage = combo_image || image || null;
    if (req.file && req.file.filename) {
      // Store relative path to match static /uploads serving
      finalImage = `/uploads/${req.file.filename}`;
    }

    if (!name || !code || !price || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'name, code, price and at least one item are required'
      });
    }

    // Validate all items belong to this shop
    const itemIds = items.map(i => parseInt(i.inventoryItemId)).filter(Boolean);
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        id: { in: itemIds },
        shopId: userShopId
      },
      select: { id: true }
    });

    if (inventoryItems.length !== itemIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more items do not belong to this shop or do not exist'
      });
    }

    // Check combo code uniqueness per shop
    const existingCombo = await prisma.comboProduct.findFirst({
      where: { code, shopId: userShopId }
    });
    if (existingCombo) {
      return res.status(400).json({
        success: false,
        error: 'Combo code already exists in this shop'
      });
    }

    const combo = await prisma.$transaction(async (tx) => {
      const comboProduct = await tx.comboProduct.create({
        data: {
          name,
          code,
          description: description || null,
          barcode: barcode || null,
          price: parseFloat(price),
          image: finalImage,
          shopId: userShopId,
          items: {
            create: items.map(it => ({
              inventoryItemId: parseInt(it.inventoryItemId),
              quantity: parseFloat(it.quantity || 1)
            }))
          }
        },
        include: {
          items: {
            include: {
              inventoryItem: true
            }
          }
        }
      });

      return comboProduct;
    });

    // If barcode was not provided, generate using ID and update
    if (!barcode) {
      const generatedBarcode = generateBarcode(name, combo.id);
      await prisma.comboProduct.update({
        where: { id: combo.id },
        data: { barcode: generatedBarcode }
      });
      combo.barcode = generatedBarcode;
    }

    // Optional: Activity log
    if (req.user && req.user.id && req.user.shopId) {
      try {
        await createLog(
          req,
          req.user.id,
          req.user.shopId,
          'INVENTORY_COMBO_CREATE',
          `Created combo product: ${combo.name} (Code: ${combo.code}) with ${combo.items.length} items`,
          'Inventory',
          'Success'
        );
      } catch (logError) {
        console.error('Failed to create combo product log:', logError);
      }
    }

    res.status(201).json({
      success: true,
      data: combo,
      message: 'Combo product created successfully'
    });
  } catch (error) {
    console.error('❌ Create combo product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create combo product: ' + error.message
    });
  }
};

// Update combo inventory product
const updateComboInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userShopId = parseInt(req.user.shopId);
    let {
      name,
      code,
      description,
      price,
      items, // optional: [{ inventoryItemId, quantity }] OR JSON string when sent via multipart
      combo_image,
      image,
      barcode
    } = req.body;

    // Parse items if received as JSON string
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'Invalid items format. Expected JSON array.'
        });
      }
    }

    // Determine final image: uploaded file takes priority
    let finalImage = combo_image || image || null;
    if (req.file && req.file.filename) {
      finalImage = `/uploads/${req.file.filename}`;
    }

    const comboId = parseInt(id);

    if (isNaN(comboId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid combo ID'
      });
    }

    // Ensure combo exists and belongs to this shop
    const existingCombo = await prisma.comboProduct.findFirst({
      where: { id: comboId, shopId: userShopId },
      include: { items: true }
    });

    if (!existingCombo) {
      return res.status(404).json({
        success: false,
        error: 'Combo product not found in this shop'
      });
    }

    // If code is changing, ensure uniqueness per shop
    if (code && code !== existingCombo.code) {
      const codeExists = await prisma.comboProduct.findFirst({
        where: {
          code,
          shopId: userShopId,
          id: { not: comboId }
        }
      });

      if (codeExists) {
        return res.status(400).json({
          success: false,
          error: 'Combo code already exists in this shop'
        });
      }
    }

    // Validate and normalise items if provided
    let validatedItems = null;
    if (Array.isArray(items)) {
      const itemIds = items.map(i => parseInt(i.inventoryItemId)).filter(Boolean);

      if (itemIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one valid item is required for the combo'
        });
      }

      const inventoryItems = await prisma.inventoryItem.findMany({
        where: {
          id: { in: itemIds },
          shopId: userShopId
        },
        select: { id: true }
      });

      if (inventoryItems.length !== itemIds.length) {
        return res.status(400).json({
          success: false,
          error: 'One or more items do not belong to this shop or do not exist'
        });
      }

      validatedItems = items.map(it => ({
        inventoryItemId: parseInt(it.inventoryItemId),
        quantity: parseFloat(it.quantity || 1)
      }));
    }

    const updatedCombo = await prisma.$transaction(async (tx) => {
      // Update main combo product
      const comboProduct = await tx.comboProduct.update({
        where: { id: comboId },
        data: {
          ...(name && { name }),
          ...(code && { code }),
          barcode: barcode !== undefined ? barcode : existingCombo.barcode,
          description: description !== undefined ? description : existingCombo.description,
          price: price !== undefined ? parseFloat(price) : existingCombo.price,
          image: finalImage !== null ? finalImage : existingCombo.image
        }
      });

      // If items were provided, replace existing composition
      if (validatedItems) {
        await tx.comboItem.deleteMany({
          where: { comboId: comboId }
        });

        await tx.comboItem.createMany({
          data: validatedItems.map(vi => ({
            comboId: comboId,
            inventoryItemId: vi.inventoryItemId,
            quantity: vi.quantity
          }))
        });
      }

      // Return combo with items and inventory details
      return tx.comboProduct.findUnique({
        where: { id: comboId },
        include: {
          items: {
            include: {
              inventoryItem: true
            }
          }
        }
      });
    });

    // Optional: Activity log
    if (req.user && req.user.id && req.user.shopId) {
      try {
        await createLog(
          req,
          req.user.id,
          req.user.shopId,
          'INVENTORY_COMBO_UPDATE',
          `Updated combo product: ${updatedCombo.name} (Code: ${updatedCombo.code})`,
          'Inventory',
          'Success'
        );
      } catch (logError) {
        console.error('Failed to create combo product update log:', logError);
      }
    }

    res.json({
      success: true,
      data: updatedCombo,
      message: 'Combo product updated successfully'
    });
  } catch (error) {
    console.error('❌ Update combo product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update combo product: ' + error.message
    });
  }
};

// Delete combo inventory product
const deleteComboInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userShopId = parseInt(req.user.shopId);
    const comboId = parseInt(id);

    if (isNaN(comboId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid combo ID'
      });
    }

    const existingCombo = await prisma.comboProduct.findFirst({
      where: { id: comboId, shopId: userShopId }
    });

    if (!existingCombo) {
      return res.status(404).json({
        success: false,
        error: 'Combo product not found in this shop'
      });
    }

    await prisma.comboProduct.delete({
      where: { id: comboId }
    });

    // Optional: Activity log
    if (req.user && req.user.id && req.user.shopId) {
      try {
        await createLog(
          req,
          req.user.id,
          req.user.shopId,
          'INVENTORY_COMBO_DELETE',
          `Deleted combo product: ${existingCombo.name} (Code: ${existingCombo.code})`,
          'Inventory',
          'Success'
        );
      } catch (logError) {
        console.error('Failed to create combo product delete log:', logError);
      }
    }

    res.json({
      success: true,
      message: 'Combo product deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete combo product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete combo product: ' + error.message
    });
  }
};

// Update inventory item
const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      item_name,
      item_code,
      category,
      brand,
      price_per_unit, // This seems redundant if you have selling_price, keeping for safety
      original_price,
      selling_price,
      default_quantity,
      item_image,
      default_unit_id,
      shopId,
      barcode
    } = req.body;

    // Validate shopId
    if (!shopId || isNaN(parseInt(shopId))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID'
      });
    }

    // Trim strings and perform security validation
    if (item_name) item_name = item_name.trim();
    if (item_code) item_code = item_code.trim();
    if (category) category = category.trim();
    if (brand) brand = brand.trim();
    if (barcode) barcode = barcode.trim();

    const invalidCharRegex = /[<>]/;
    if ((item_name && invalidCharRegex.test(item_name)) || 
        (item_code && invalidCharRegex.test(item_code)) || 
        (category && invalidCharRegex.test(category)) || 
        (brand && invalidCharRegex.test(brand)) || 
        (barcode && invalidCharRegex.test(barcode))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid characters detected. HTML tags (<, >) are not allowed.'
      });
    }

    if ((item_name !== undefined && !item_name) || (item_code !== undefined && !item_code)) {
      return res.status(400).json({
        success: false,
        error: 'Item name and code cannot be empty'
      });
    }

    const numericShopId = parseInt(shopId);

    // Check if item exists and belongs to shop - CRITICAL: Verify shop ownership
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id: parseInt(id),
        shopId: numericShopId
      }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in this shop'
      });
    }

    // Check if item code already exists for another item in same shop
    if (item_code && item_code !== existingItem.item_code) {
      const codeExists = await prisma.inventoryItem.findFirst({
        where: {
          item_code,
          shopId: numericShopId,
          id: { not: parseInt(id) }
        }
      });

      if (codeExists) {
        return res.status(400).json({
          success: false,
          error: 'Item code already exists in this shop'
        });
      }
    }

    // Check if item name already exists for another item in same shop
    if (item_name && item_name.toLowerCase() !== existingItem.item_name.toLowerCase()) {
      const nameExists = await prisma.inventoryItem.findFirst({
        where: {
          item_name: { equals: item_name, mode: 'insensitive' },
          shopId: numericShopId,
          id: { not: parseInt(id) }
        }
      });

      if (nameExists) {
        return res.status(400).json({
          success: false,
          error: 'Item name already exists in this shop'
        });
      }
    }

    // Check if barcode already exists for another item
    if (barcode && barcode !== existingItem.barcode) {
      const barcodeExists = await prisma.inventoryItem.findFirst({
        where: {
          barcode,
          id: { not: parseInt(id) }
        }
      });

      if (barcodeExists) {
        return res.status(400).json({
          success: false,
          error: 'Barcode already exists for another item'
        });
      }
    }

    const newQuantity = parseFloat(default_quantity);

    // ✅ Update item record including default_quantity
    const item = await prisma.inventoryItem.update({
      where: { id: parseInt(id) },
      data: {
        item_name,
        item_code,
        category,
        brand,
        original_price: parseFloat(original_price) || existingItem.original_price,
        selling_price: parseFloat(selling_price) || existingItem.selling_price,
        default_quantity: newQuantity, // ✅ FIXED: Now saves the new quantity
        default_unit_id: parseInt(default_unit_id),
        item_image,
        barcode: barcode !== undefined ? barcode : existingItem.barcode
      },
      include: {
        unit: {
          include: {
            unitCategory: true
          }
        }
      }
    });

    // ✅ Create a stock adjustment entry when quantity changes
    if (!isNaN(newQuantity)) {
      const currentStock = await calculateCurrentStock(parseInt(id), numericShopId);
      const diff = newQuantity - currentStock;

      if (Math.abs(diff) > 0.001) { // Only create entry if there's a meaningful change
        const stockType = diff > 0 ? 'in' : 'out';
        const adjustQty = Math.abs(diff);

        await prisma.stockEntry.create({
          data: {
            itemId: parseInt(id),
            shopId: numericShopId,
            quantity: adjustQty,
            stockType,
            notes: `Manual stock adjustment (edit item form). Previous: ${currentStock}, New: ${newQuantity}`,
            unitId: parseInt(default_unit_id),
            pricePerUnit: parseFloat(original_price) || existingItem.original_price,
          }
        });

        console.log(`📦 Stock adjustment: ${stockType} ${adjustQty} units for item ${id}`);
      }
    }

    res.json({
      success: true,
      data: item,
      message: 'Item and stock updated successfully'
    });
  } catch (error) {
    console.error('❌ Update inventory item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update inventory item: ' + error.message
    });
  }
};

// Delete inventory item
const deleteInventoryItem = async (req, res) => {
  try {
    const { id, shopId } = req.params;

    // Validate IDs
    if (!shopId || !id || isNaN(parseInt(shopId)) || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid shop ID or item ID'
      });
    }

    const numericShopId = parseInt(shopId);
    const numericId = parseInt(id);

    // Check if item exists and belongs to shop - CRITICAL: Verify shop ownership
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        id: numericId,
        shopId: numericShopId
      }
    });

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in this shop'
      });
    }

    // Hard delete (since we don't have soft delete field)
    await prisma.inventoryItem.delete({
      where: { id: numericId }
    });

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete inventory item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete inventory item: ' + error.message
    });
  }
};

module.exports = {
  getInventoryItems,
  getAllInventoryItems,
  getInventoryItem,
  createInventoryItem,
  createComboInventoryItem,
  updateComboInventoryItem,
  deleteComboInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
};