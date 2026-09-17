const express = require('express');
const {
  getStockEntries,
  getStockEntry,
  createStockEntry,
  updateStockEntry,
  deleteStockEntry,
  getStockLevels
} = require('../controllers/stockController');

const router = express.Router();

// Stock routes - ALL SHOP-SPECIFIC
router.get('/:shopId/levels', getStockLevels); // Stock levels for specific shop
router.get('/:shopId/:id', getStockEntry); // Single stock entry from specific shop
router.get('/:shopId', getStockEntries); // All stock entries for specific shop with filters
router.post('/', createStockEntry); // Create stock entry (shopId in body)
router.put('/:id', updateStockEntry); // Update stock entry (shopId in body)
router.delete('/:shopId/:id', deleteStockEntry); // Delete stock entry from specific shop

module.exports = router;