const express = require('express');
const { login, verifyToken, getCurrentUser, logout } = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/login', login); 
router.post('/logout', logout);

// Protected routes (require authentication)
router.get('/me', verifyToken, getCurrentUser);

module.exports = router;
