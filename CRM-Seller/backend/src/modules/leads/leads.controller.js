const { createLead, getAllLeads, updateLeadStatus, deleteLead, getLeadStats, getLeadById: getLeadByIdService } = require('./leads.service');

// POST /api/leads  — public endpoint for CRM lead form
const submitLead = async (req, res, next) => {
  try {
    const { fullName, email, phone, businessType, businessName, location, message } = req.body;

    if (!fullName || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Full name, email, and phone are required.' });
    }

    const lead = await createLead({ fullName, email, phone, businessType, businessName, location, message });
    return res.status(201).json({ success: true, message: 'Lead submitted successfully.', data: lead });
  } catch (err) {
    next(err);
  }
};

// GET /api/leads  — dashboard list
const listLeads = async (req, res, next) => {
  try {
    const { search, status, page, limit } = req.query;
    const result = await getAllLeads({ search, status, page: Number(page) || 1, limit: Number(limit) || 50 });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// GET /api/leads/stats
const leadStats = async (req, res, next) => {
  try {
    const stats = await getLeadStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/leads/:id/status
const changeLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['New', 'Contacted', 'Qualified', 'Lost'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    }
    const lead = await updateLeadStatus(id, status);
    return res.status(200).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/leads/:id
const removeLead = async (req, res, next) => {
  try {
    await deleteLead(req.params.id);
    return res.status(200).json({ success: true, message: 'Lead deleted.' });
  } catch (err) {
    const status = err.response?.status || 500;
    const message = err.response?.data?.message || err.message || 'Failed to delete lead.';
    return res.status(status).json({ success: false, message });
  }
};

// GET /api/leads/:id
const getLeadById = async (req, res, next) => {
  try {
    const lead = await getLeadByIdService(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
    return res.status(200).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitLead, listLeads, leadStats, changeLeadStatus, removeLead, getLeadById };
