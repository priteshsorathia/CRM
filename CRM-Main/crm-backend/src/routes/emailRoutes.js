const express = require('express');
const { sendEmail, testEmail, sendTestEmail } = require('../controllers/emailController');

const router = express.Router();

router.post('/send-email', sendEmail);
router.get('/test', testEmail); // Test email configuration
router.post('/send-test', sendTestEmail); // Send test email

module.exports = router;