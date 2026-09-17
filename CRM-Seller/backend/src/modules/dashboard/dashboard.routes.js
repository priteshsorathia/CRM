const express = require('express');
const router = express.Router();
const controller = require('./dashboard.controller');

router.get('/sidebar-stats', controller.getSidebarStats);
router.get('/stats', controller.getDashboardStats);

module.exports = router;
