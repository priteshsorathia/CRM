const express = require('express');
const { verifyToken } = require('../controllers/authController');
const { getProfile, updateProfile } = require('../controllers/profileController');

const router = express.Router();

// Get current user's profile
router.get('/get-profile', verifyToken, getProfile);

// Update current user's profile
router.put('/update-profile', verifyToken, updateProfile);

module.exports = router;

