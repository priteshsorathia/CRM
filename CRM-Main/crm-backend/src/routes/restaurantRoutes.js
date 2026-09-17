const express = require('express');
const router = express.Router();

const { requireRestaurants } = require('../middleware/userTypeMiddleware');
const path = require('path');
const multer = require('multer');
const {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  regenerateTableToken
} = require('../controllers/restaurantTableController');

const {
    getTableMenu,
    placeSelfOrder,
    getTableOrders,
    processTablePayment
} = require('../controllers/selfOrderController');

const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getAddOns,
  getDeletedItems,
  restoreMenuItem,
  permanentlyDeleteMenuItem
} = require('../controllers/restaurantMenuController');

const {
  getOrders,
  getOrderById,
  getOrderByToken,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/restaurantOrderController');

const {
  getRestaurantInvoices,
  getRestaurantInvoiceById,
  createRestaurantInvoice,
  updateRestaurantInvoice,
  deleteRestaurantInvoice,
  getDeletedInvoices,
  restoreInvoice,
  permanentlyDeleteInvoice
} = require('../controllers/restaurantInvoiceController');

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `menu-${unique}${path.extname(file.originalname)}`);
  }
});
const { makeFileFilter } = require('../utils/fileValidation');

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: makeFileFilter((req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const isImageMime = file.mimetype && file.mimetype.startsWith('image/');
    if (isImageMime || allowedExtensions.includes(ext)) cb(null, true);
    else cb(new Error('Only images allowed (JPG, PNG, GIF, WEBP)'));
  })
});

// Restaurant Tables
router.get('/tables', requireRestaurants, getTables);
router.post('/tables', requireRestaurants, createTable);
router.post('/tables/:id/regenerate-token', requireRestaurants, regenerateTableToken);
router.put('/tables/:id', requireRestaurants, updateTable);
router.delete('/tables/:id', requireRestaurants, deleteTable);

// Public Self-Ordering (QR based)
router.get('/self-order/menu/:token', getTableMenu);
router.post('/self-order/place/:token', placeSelfOrder);
router.get('/self-order/orders/:token', getTableOrders);
router.post('/self-order/pay/:token', processTablePayment);

// Restaurant Menu (static routes first)
router.get('/menu/categories', requireRestaurants, getCategories);
router.post('/menu/categories', requireRestaurants, createCategory);
router.put('/menu/categories/:id', requireRestaurants, updateCategory);
router.delete('/menu/categories/:id', requireRestaurants, deleteCategory);
router.get('/menu/sub-categories', requireRestaurants, getSubCategories);
router.post('/menu/sub-categories', requireRestaurants, createSubCategory);
router.put('/menu/sub-categories/:id', requireRestaurants, updateSubCategory);
router.delete('/menu/sub-categories/:id', requireRestaurants, deleteSubCategory);
router.get('/menu/add-ons', requireRestaurants, getAddOns);

router.get('/menu/trash', requireRestaurants, getDeletedItems);
router.post('/menu/:id/restore', requireRestaurants, restoreMenuItem);
router.delete('/menu/:id/permanent', requireRestaurants, permanentlyDeleteMenuItem);
router.get('/menu', requireRestaurants, getMenuItems);
router.post('/menu', requireRestaurants, createMenuItem);
router.get('/menu/:id', requireRestaurants, getMenuItemById);
router.put('/menu/:id', requireRestaurants, updateMenuItem);
router.delete('/menu/:id', requireRestaurants, deleteMenuItem);

// Restaurant Orders
router.get('/orders', requireRestaurants, getOrders);
router.post('/orders', requireRestaurants, createOrder);
router.get('/orders/token/:token', requireRestaurants, getOrderByToken);
router.get('/orders/:id', requireRestaurants, getOrderById);
router.put('/orders/:id', requireRestaurants, updateOrder);
router.put('/orders/:id/status', requireRestaurants, updateOrderStatus);
router.delete('/orders/:id', requireRestaurants, deleteOrder);

// Restaurant Invoices
router.get('/invoices/trash', requireRestaurants, getDeletedInvoices);
router.post('/invoices/:id/restore', requireRestaurants, restoreInvoice);
router.delete('/invoices/:id/permanent', requireRestaurants, permanentlyDeleteInvoice);
router.get('/invoices', requireRestaurants, getRestaurantInvoices);
router.post('/invoices', requireRestaurants, createRestaurantInvoice);
router.get('/invoices/:id', requireRestaurants, getRestaurantInvoiceById);
router.put('/invoices/:id', requireRestaurants, updateRestaurantInvoice);
router.delete('/invoices/:id', requireRestaurants, deleteRestaurantInvoice);

router.post('/menu/upload-image', requireRestaurants, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Image required' });
    res.json({ success: true, imageUrl: `/uploads/${req.file.filename}` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

module.exports = router;
