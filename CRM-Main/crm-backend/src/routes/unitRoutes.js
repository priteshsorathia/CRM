const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getUnitCategories,
  getUnits,
  createDefaultUnits,
  createUnit,
  getUnitsByCategory
} = require('../controllers/unitController');

const router = express.Router();

// Public routes (no auth required)
router.get('/categories', getUnitCategories);
router.get('/', getUnits);
router.post('/default', createDefaultUnits);
router.post('/', createUnit);

// Protected routes (auth required)
router.get('/category/:categoryId', authenticateToken, getUnitsByCategory);

module.exports = router;