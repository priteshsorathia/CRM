const express = require('express');
const { forgotPassword, resetPassword, validateToken } = require('../controllers/forgotPasswordController');

const router = express.Router();

// Make sure these are proper function references
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/validate-token', validateToken);

module.exports = router;