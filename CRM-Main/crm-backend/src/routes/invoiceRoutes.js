const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  getShopDetails, generateInvoiceNumber, createInvoice, getInvoices, getInvoiceById,
  updateInvoice, deleteInvoice, getNextInvoiceNumber, getInvoicesByUserId,
  getUnpaidCustomers, searchCustomers, toggleTaxSettings, getInvoiceUsers, generateMonthlyReport,
  generateInvoicePDF,
  addPaymentEntry
} = require('../controllers/invoiceController');
const { getInventoryItems } = require('../controllers/inventoryController');

router.use(authenticateToken);

// Static Routes
router.get('/next-number', getNextInvoiceNumber);
router.get('/shop-details', getShopDetails);
router.get('/search-customers', searchCustomers);
router.get('/unpaid-clients', getUnpaidCustomers);
router.get('/generate-number', generateInvoiceNumber);
router.get('/items', getInventoryItems);
router.post('/toggle-tax-view', toggleTaxSettings);

// ✅ New Routes
router.get('/users', getInvoiceUsers);
router.get('/report', generateMonthlyReport); 

// Main Routes
router.get('/', getInvoices);
router.get('/user/:userId', getInvoicesByUserId);
router.post('/', createInvoice);

// Dynamic Routes
router.get('/:id/pdf', generateInvoicePDF); // PDF download route (must be before /:id)
router.get('/:id', getInvoiceById);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

router.post('/:id/payment', addPaymentEntry)

module.exports = router;