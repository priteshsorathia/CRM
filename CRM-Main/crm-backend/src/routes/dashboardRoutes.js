const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { getDashboardData, getEmiDashboardData } = require('../controllers/dashboardController');

// All routes protected
router.get('/', authenticateToken, getDashboardData);
router.get('/emi', authenticateToken, getEmiDashboardData);

module.exports = router;