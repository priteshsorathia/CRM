const express = require('express');
const router = express.Router();
const controller = require('../controllers/serviceInvoiceController');
const { authenticateToken: auth } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');

router.get('/', auth, checkPermission('BILLING', 'READ'), controller.getInvoices);
router.get('/:id', auth, checkPermission('BILLING', 'READ'), controller.getInvoiceById);
router.post('/', auth, checkPermission('BILLING', 'CREATE'), controller.createInvoice);
router.put('/:id', auth, checkPermission('BILLING', 'UPDATE'), controller.updateInvoice);
router.delete('/:id', auth, checkPermission('BILLING', 'DELETE'), controller.deleteInvoice);

module.exports = router;
