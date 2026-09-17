const express = require('express');
const router = express.Router();
const controller = require('./onboarding.controller');
const upload = require('../../middleware/upload');

// GET all onboarding requests
router.get('/', controller.getAllOnboardings);

// GET single onboarding request
router.get('/:id', controller.getOnboardingById);

// POST new onboarding application
router.post('/', upload.fields([
    { name: 'documentPan', maxCount: 1 },
    { name: 'documentAddress', maxCount: 1 },
    { name: 'documentGst', maxCount: 1 }
]), controller.createOnboarding);

// PUT full update
router.put('/:id', upload.fields([
    { name: 'documentPan', maxCount: 1 },
    { name: 'documentAddress', maxCount: 1 },
    { name: 'documentGst', maxCount: 1 }
]), controller.updateOnboarding);

// PATCH status update
router.patch('/:id/status', controller.updateStatus);

// DELETE onboarding application
router.delete('/:id', controller.deleteOnboarding);

module.exports = router;
