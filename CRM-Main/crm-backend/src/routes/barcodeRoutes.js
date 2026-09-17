const express = require('express');
const router = express.Router();
const { getBarcodeImage, getProductByBarcode } = require('../controllers/barcodeController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Barcode image generation (Public or Auth - usually used in reports/UI)
router.get('/', getBarcodeImage);

// Product lookup by barcode (Needs Auth)
router.get('/barcode/:code', authenticateToken, getProductByBarcode);

module.exports = router;
