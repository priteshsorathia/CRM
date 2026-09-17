const express = require('express');
const router = express.Router();
const { submitLead, listLeads, leadStats, changeLeadStatus, removeLead, getLeadById } = require('./leads.controller');

// Public — called from CRM "Submit Application" form
router.post('/', submitLead);

// Dashboard — list all leads
router.get('/', listLeads);

// Dashboard — lead stats
router.get('/stats', leadStats);

// Dashboard — lead details
router.get('/:id', getLeadById);

// Dashboard — update status
router.patch('/:id/status', changeLeadStatus);

// Dashboard — delete lead
router.delete('/:id', removeLead);

module.exports = router;
