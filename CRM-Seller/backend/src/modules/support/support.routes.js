const express = require('express');
const router = express.Router();
const { getAllTickets, getTicketById, createTicket, updateTicket, updateTicketStatus, deleteTicket } = require('./support.controller');

router.get('/', getAllTickets);
router.get('/:id', getTicketById);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.patch('/:id', updateTicket);
router.patch('/:id/status', updateTicketStatus);
router.delete('/:id', deleteTicket);

module.exports = router;
