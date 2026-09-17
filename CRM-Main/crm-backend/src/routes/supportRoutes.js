const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    submitTicket, 
    requestCallback, 
    getCallbacks, 
    updateCallbackStatus,
    getTickets,
    updateTicketStatus 
} = require('../controllers/supportController');
const { authenticateToken } = require('../middleware/authMiddleware');

const { makeFileFilter } = require('../utils/fileValidation');

// Multer: Memory Storage (Files stored in RAM buffer for emailing)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: makeFileFilter()
});

// Routes are public for submission
router.post('/ticket', upload.array('attachments', 5), submitTicket);
router.post('/callback', requestCallback);

// Admin Routes (Optional: Add authenticateToken here if you want to protect them)
router.get('/callbacks', getCallbacks);
router.patch('/callbacks/:id', updateCallbackStatus);
router.get('/tickets', getTickets);
router.patch('/tickets/:id', updateTicketStatus);

module.exports = router;