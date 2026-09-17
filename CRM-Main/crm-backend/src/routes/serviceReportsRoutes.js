const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');
const controller = require('../controllers/serviceReportsController');

router.get('/dashboard', auth, checkPermission('REPORTS', 'READ'), controller.getDashboard);
router.get('/export', auth, checkPermission('REPORTS', 'READ'), controller.exportCsv);

module.exports = router;
