const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/authMiddleware');
const controller = require('../controllers/serviceDashboardController');

router.get('/', auth, controller.getDashboard);

module.exports = router;

