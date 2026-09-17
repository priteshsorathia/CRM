const express = require('express');
const router = express.Router();
const controller = require('./callback.controller');

// GET all callback requests
router.get('/', controller.getAllCallbacks);

// GET single callback request by ID
router.get('/:id', controller.getCallbackById);

// POST new callback request
router.post('/', controller.createCallback);

// PUT full update
router.put('/:id', controller.updateCallback);

// PATCH update (partial)
router.patch('/:id', controller.updateCallback);

// PATCH status update
router.patch('/:id/status', controller.updateStatus);

// DELETE callback request
router.delete('/:id', controller.deleteCallback);

module.exports = router;
