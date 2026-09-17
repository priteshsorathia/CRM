const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getInventoryItems,
  getAllInventoryItems,
  getInventoryItem,
  createInventoryItem,
  createComboInventoryItem,
  updateComboInventoryItem,
  deleteComboInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} = require('../controllers/inventoryController');

// Multer setup for combo product image uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'combo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const { makeFileFilter } = require('../utils/fileValidation');

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: makeFileFilter((req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  })
});

// Import the new Category Controller
const {
  getCategories,
  createCategory,
  deleteCategory
} = require('../controllers/categoryController');

// Apply auth middleware to all routes
router.use(authenticateToken);

// --- CATEGORY ROUTES (New) ---
router.get('/get-categories', getCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

// --- INVENTORY ROUTES (Existing) ---

// Get inventory items for current shop (for invoice module)
router.get('/items', getInventoryItems);

// Get all inventory items for shop management
router.get('/:shopId', getAllInventoryItems);

// Get single inventory item
router.get('/:id/shop/:shopId', getInventoryItem);

// Create new inventory item
router.post('/', createInventoryItem);

// Create new combo inventory item (product made of multiple items) with optional image
router.post('/combo', upload.single('image'), createComboInventoryItem);
// Update combo inventory item (support image replacement)
router.put('/combo/:id', upload.single('image'), updateComboInventoryItem);
// Delete combo inventory item
router.delete('/combo/:id', deleteComboInventoryItem);

// Update inventory item
router.put('/:id', updateInventoryItem);

// Delete inventory item
router.delete('/:id/shop/:shopId', deleteInventoryItem);

module.exports = router;