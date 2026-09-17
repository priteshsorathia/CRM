const express = require('express');
const router = express.Router();
const controller = require('./customer.controller');

// GET all customers
router.get('/', controller.getAllCustomers);

// GET single customer by ID
router.get('/:id', controller.getCustomerById);

// POST new customer
router.post('/', controller.createCustomer);

// PUT full update
router.put('/:id', controller.updateCustomer);

// PATCH status update
router.patch('/:id/status', controller.updateStatus);

// DELETE customer
router.delete('/:id', controller.deleteCustomer);

module.exports = router;
