const express = require('express');
const router = express.Router();
const { login, updateProfile } = require('./auth.controller');

// POST /api/auth/login
router.post('/login', login);

// PUT /api/auth/update-profile
router.put('/update-profile', updateProfile);

module.exports = router;
