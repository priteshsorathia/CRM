const express = require('express');
const {
  testConnection,
  getDBHealth,
  getDBStats,
  resetDatabase
} = require('../controllers/dbController');

const router = express.Router();

// Database connection routes
router.get('/test', testConnection);
router.get('/health', getDBHealth);
router.get('/stats', getDBStats);
router.delete('/reset', resetDatabase); // Be careful with this one!

module.exports = router;