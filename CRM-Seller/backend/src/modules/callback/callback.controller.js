const { externalApi } = require('../../lib/externalApi');

// Helper to normalize callback from external app to dashboard structure
const normalizeCallback = (c) => ({
    id: c.id,
    serialId: c.id,
    name: c.name,
    contact: c.phone || c.contact,
    email: c.email,
    preferredDate: c.preferred_date || c.preferredDate,
    preferredTime: c.preferred_time || c.preferredTime,
    issue: c.issue_description || c.issue,
    status: c.status,
    createdAt: c.createdAt
});

// GET all callbacks from external app
exports.getAllCallbacks = async (req, res) => {
    try {
        const { search, status } = req.query;
        
        const response = await externalApi.get('/api/support/callbacks');
        let callbacks = response.data.data;

        if (Array.isArray(callbacks)) {
            callbacks = callbacks.map(normalizeCallback);

            if (status && status !== 'All') {
                callbacks = callbacks.filter(c => c.status === status);
            }
            if (search) {
                const sLower = search.toLowerCase();
                callbacks = callbacks.filter(c => 
                    (c.name || '').toLowerCase().includes(sLower) ||
                    (c.contact || '').toLowerCase().includes(sLower) ||
                    (c.email || '').toLowerCase().includes(sLower) ||
                    (c.issue || '').toLowerCase().includes(sLower)
                );
            }
            return res.status(200).json({ success: true, data: callbacks });
        }
        res.status(200).json({ success: true, data: [] });
    } catch (error) {
        console.error('Fetch Callbacks Error:', error.message);
        res.status(500).json({ success: false, message: 'External Service Unavailable' });
    }
};

// GET single callback by ID
exports.getCallbackById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const response = await externalApi.get('/api/support/callbacks');
        const callbacks = response.data.data;
        const callback = callbacks.find(c => String(c.id) === String(id));

        if (!callback) return res.status(404).json({ success: false, message: 'Callback not found' });
        res.status(200).json({ success: true, data: normalizeCallback(callback) });
    } catch (error) {
        console.error('Fetch Callback Error:', error.message);
        res.status(500).json({ success: false, message: 'External Service Unavailable' });
    }
};

// Create new callback request
exports.createCallback = async (req, res) => {
    try {
        const { name, contact, email, preferredDate, preferredTime, issue } = req.body;

        const response = await externalApi.post('/api/support/callback', {
            name, email, phone: contact, preferred_date: preferredDate, preferred_time: preferredTime, issue_description: issue
        });

        res.status(201).json({ success: true, data: response.data.data || response.data });
    } catch (error) {
        console.error('Create Callback Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create external callback' });
    }
};

// Update status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const response = await externalApi.patch(`/api/support/callbacks/${id}`, { status });
        res.status(200).json({ success: true, data: response.data.data || response.data });
    } catch (error) {
        console.error('Update Status Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update external callback' });
    }
};

// Full update update
exports.updateCallback = async (req, res) => {
    return exports.updateStatus(req, res);
};

// Delete callback request
exports.deleteCallback = async (req, res) => {
    res.status(405).json({ success: false, message: 'Deletion not supported by external service' });
};
