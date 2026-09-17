const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Public Routes (No token needed)
const authRoutes = require('./auth/auth.routes');
router.use('/auth', authRoutes);

// PRIVATE ROUTES (Protected by protect middleware)
// These routes will return 401 if a valid JWT is missing or expired
router.use('/dashboard', protect, require('./dashboard/dashboard.routes'));
router.use('/leads', protect, require('./leads/leads.routes'));
router.use('/shops', protect, require('./shop/shop.routes'));
router.use('/employees', protect, require('./employees/employees.routes'));
router.use('/onboarding', protect, require('./onboarding/onboarding.routes'));
router.use('/users', protect, require('./user/user.routes'));
router.use('/support-tickets', protect, require('./support/support.routes'));
router.use('/callback-requests', protect, require('./callback/callback.routes'));
router.use('/reviews', protect, require('./review/review.routes'));
router.use('/company', protect, require('./company/company.routes'));
router.use('/demo', protect, require('./demo/demo.routes'));

module.exports = router;
