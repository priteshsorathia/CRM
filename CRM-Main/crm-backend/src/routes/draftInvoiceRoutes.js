const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const {
  saveDraftInvoice,
  getDraftInvoiceById,
  getAllDraftInvoices,
  deleteDraftInvoice,
  completeDraftInvoice,
  updateDraftInvoice
} = require('../controllers/draftInvoiceController');

// Middleware: Protect all routes
router.use(verifyToken);

// Routes
router.post('/save-draft', saveDraftInvoice); // Save draft invoice
router.get('/get-all-draft', getAllDraftInvoices); // Get all draft invoices by shop
router.get('/get-draft-by/:id', getDraftInvoiceById); // Get draft invoice by ID
router.put('/update-draft/:id', updateDraftInvoice); // Update draft invoice
router.delete('/delete-draft/:id', deleteDraftInvoice); // Delete draft invoice
router.post('/complete-draft/:id', completeDraftInvoice); // Complete draft invoice (convert to invoice)

// Compatibility shorthand routes (used by frontend paths like /api/draft-invoices/:id)
router.get('/:id', getDraftInvoiceById);
router.put('/:id', updateDraftInvoice);
router.delete('/:id', deleteDraftInvoice);

module.exports = router;

