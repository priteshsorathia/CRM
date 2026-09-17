const express = require('express');
const router = express.Router();
const controller = require('./shop.controller');

// GET all shops
router.get('/', controller.getAllShops);

// GET single shop by ID
router.get('/:id', controller.getShopById);

// POST new shop
router.post('/', controller.createShop);

// PUT full update
router.put('/:id', controller.updateShop);

// DELETE shop
router.delete('/:id', controller.deleteShop);

// BLOCK/UNBLOCK shop
router.patch('/:id/block', controller.toggleShopBlock);

module.exports = router;
