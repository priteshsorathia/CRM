const express = require('express');
const { 
  createShopWithOwner, 
  getAllShops, 
  getShopById,
  getShopsByType,
  updateShop,
  setShopBlockedStatus,
  updateUser
} = require('../controllers/shopController');
const { validateShopCreation } = require('../middleware/validationMiddleware');

const router = express.Router();

// Public routes
router.post('/create', validateShopCreation, createShopWithOwner);
router.get('/', getAllShops);
router.get('/filter', getShopsByType); // GET /shops/filter?userType=retailers&isBlocked=false
router.get('/:id', getShopById);
router.put('/:id', updateShop);
router.patch('/:id/block', setShopBlockedStatus);

// User management routes
router.put('/user/:id', updateUser);

module.exports = router;
