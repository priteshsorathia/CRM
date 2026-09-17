const express = require('express');
const router = express.Router();

const { getStarted, listGetStartedRequests, getGetStartedRequestById, deleteGetStartedRequest } = require('../controllers/getStartedController');

// Route to handle "Get Started" form submissions
router.post('/get-started/submit', getStarted);

// Fetch submitted "Get Started" requests
router.get('/get-started/requests', listGetStartedRequests);
router.get('/get-started/requests/:id', getGetStartedRequestById);
router.delete('/get-started/requests/:id', deleteGetStartedRequest);

module.exports = router;
