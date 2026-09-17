const { externalApi } = require('../../lib/externalApi');

// Helper to normalize tickets from external app to dashboard structure
const normalizeTicket = (t) => ({
    id: t.id,
    serialId: t.ticketId || `TKT-${t.id}`,
    subject: t.subject,
    category: t.category,
    priority: t.priority,
    status: t.status,
    description: t.description,
    submittedBy: t.email,
    email: t.email,
    createdAt: t.createdAt
});

// GET all tickets from external app
exports.getAllTickets = async (req, res) => {
    try {
        const { status, priority, search } = req.query;
        
        const response = await externalApi.get('/api/support/tickets');
        let tickets = response.data.data || response.data;

        if (Array.isArray(tickets)) {
            tickets = tickets.map(normalizeTicket);

            // Fetch-time filtering (since external app might not support all filters)
            if (status && status !== 'All') {
                tickets = tickets.filter(t => t.status === status);
            }
            if (priority && priority !== 'All') {
                tickets = tickets.filter(t => t.priority === priority);
            }
            if (search) {
                const sLower = search.toLowerCase();
                tickets = tickets.filter(t => 
                    (t.subject || '').toLowerCase().includes(sLower) ||
                    (t.category || '').toLowerCase().includes(sLower) ||
                    (t.email || '').toLowerCase().includes(sLower)
                );
            }
            return res.status(200).json({ success: true, data: tickets });
        }
        res.status(200).json({ success: true, data: [] });
    } catch (error) {
        console.error('Fetch Tickets Error:', error.message);
        res.status(500).json({ success: false, message: 'External Service Unavailable' });
    }
};

// GET ticket by ID
exports.getTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // External app expects numeric ID
        const response = await externalApi.get('/api/support/tickets');
        const tickets = response.data.data || response.data;
        const ticket = tickets.find(t => String(t.id) === String(id) || t.ticketId === id);

        if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
        res.status(200).json({ success: true, data: normalizeTicket(ticket) });
    } catch (error) {
        console.error('Fetch Ticket Error:', error.message);
        res.status(500).json({ success: false, message: 'External Service Unavailable' });
    }
};

// POST create ticket (Proxy to external)
exports.createTicket = async (req, res) => {
    try {
        const { subject, category, priority, description, email } = req.body;

        const response = await externalApi.post('/api/support/ticket', {
            subject, category, priority, description, email
        });

        res.status(201).json({ success: true, data: response.data.data || response.data });
    } catch (error) {
        console.error('Create Ticket Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create external ticket' });
    }
};

// PATCH status only
exports.updateTicketStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const response = await externalApi.patch(`/api/support/tickets/${id}`, { status });
        const rawTicket = response.data.data || response.data;
        res.status(200).json({ success: true, data: normalizeTicket(rawTicket) });
    } catch (error) {
        console.error('Update Status Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update external ticket' });
    }
};

// PUT update ticket (Not fully supported by external app, fallback to status)
exports.updateTicket = async (req, res) => {
    return exports.updateTicketStatus(req, res);
};

// DELETE ticket (Not supported by external app)
exports.deleteTicket = async (req, res) => {
    res.status(405).json({ success: false, message: 'Deletion not supported by external service' });
};
