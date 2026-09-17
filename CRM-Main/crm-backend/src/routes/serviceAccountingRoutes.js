const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');
const controller = require('../controllers/serviceAccountingController');

router.get('/overview', auth, checkPermission('ACCOUNTING', 'READ'), controller.getOverview);

router.get('/journals', auth, checkPermission('ACCOUNTING', 'READ'), controller.listJournals);
router.post('/journals', auth, checkPermission('ACCOUNTING', 'CREATE'), controller.createJournal);
router.get('/journals/:id', auth, checkPermission('ACCOUNTING', 'READ'), controller.getJournal);

router.get('/reports/:key', auth, checkPermission('ACCOUNTING', 'READ'), controller.getReport);
router.get('/sheets', auth, checkPermission('ACCOUNTING', 'READ'), controller.listSheets);
router.get('/sheets/fetch', auth, checkPermission('ACCOUNTING', 'READ'), controller.getSheet);
router.put('/sheets/:id/adjustments', auth, checkPermission('ACCOUNTING', 'UPDATE'), controller.updateSheetAdjustments);

router.get('/periods', auth, checkPermission('ACCOUNTING', 'READ'), controller.listFiscalPeriods);
router.post('/periods', auth, checkPermission('ACCOUNTING', 'CREATE'), controller.createFiscalPeriod);
router.put('/periods/:id', auth, checkPermission('ACCOUNTING', 'UPDATE'), controller.updateFiscalPeriod);
router.delete('/periods/:id', auth, checkPermission('ACCOUNTING', 'DELETE'), controller.deleteFiscalPeriod);

router.delete('/years/:year', auth, checkPermission('ACCOUNTING', 'DELETE'), controller.deleteYear);

module.exports = router;
