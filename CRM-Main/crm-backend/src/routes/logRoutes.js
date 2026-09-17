const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { getLogs, getLogById, exportLogs } = require('../controllers/logController');

router.use(authenticateToken);

// Get all logs with pagination and filters
router.get('/', getLogs);

// ✅ Export logs to CSV (must be before /:id to avoid route conflict)
router.get('/export', exportLogs);

// Get single log by ID
router.get('/:id', getLogById);

module.exports = router;