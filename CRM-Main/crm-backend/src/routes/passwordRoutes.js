const express = require('express');
const { changePassword, checkPasswordChangeRequired } = require('../controllers/passwordController');
const { verifyToken } = require('../controllers/authController');

const router = express.Router();

// Protected routes - require authentication
router.get('/check', verifyToken, checkPasswordChangeRequired);
router.post('/change', verifyToken, changePassword);

module.exports = router;