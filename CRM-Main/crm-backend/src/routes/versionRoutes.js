const express = require('express');
const router = express.Router();
const versionController = require('../controllers/versionController');
/**
 * @route   GET /api/version/check
 * @desc    Get system version information (Separate API for Network visibility)
 * @access  Public
 */
router.get('/check', versionController.getVersionInfo);

module.exports = router;
