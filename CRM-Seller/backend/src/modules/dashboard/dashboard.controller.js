const prisma = require('../../database/prisma');
const { externalApi } = require('../../lib/externalApi');

exports.getSidebarStats = async (req, res) => {
    try {
        let supportCount = 0;
        let callbackCount = 0;
        
        try {
            const [ticketRes, callbackRes] = await Promise.all([
                externalApi.get('/api/support/tickets').catch(() => ({ data: { data: [] } })),
                externalApi.get('/api/support/callbacks').catch(() => ({ data: { data: [] } }))
            ]);
            
            const tickets = ticketRes.data.data;
            if (Array.isArray(tickets)) {
                supportCount = tickets.filter(t => t.status !== 'Closed').length;
            }
            
            const callbacks = callbackRes.data.data;
            if (Array.isArray(callbacks)) {
                callbackCount = callbacks.filter(c => c.status === 'Pending').length;
            }
        } catch (e) {
            console.warn("External stats fetch failed:", e.message);
        }

        const [reviewCount] = await Promise.all([
            prisma.review ? prisma.review.count({ where: { status: 'Pending' } }) : Promise.resolve(0)
        ]);

        res.status(200).json({
            success: true,
            data: {
                supportTickets: supportCount,
                callbackRequests: callbackCount,
                pendingReviews: reviewCount
            }
        });
    } catch (error) {
        console.error("Sidebar Stats Error:", error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        let totalShopsExternally = 0;
        let totalLeadsExternally = 0;
        let openTickets = 0;
        let pendingCallbacks = 0;

        try {
            const [shopRes, leadRes, ticketRes, callbackRes] = await Promise.all([
                externalApi.get('/shops').catch(() => ({ data: { data: [] } })),
                externalApi.get('/api/get-started/get-started/requests').catch(() => ({ data: { data: [] } })),
                externalApi.get('/api/support/tickets').catch(() => ({ data: { data: [] } })),
                externalApi.get('/api/support/callbacks').catch(() => ({ data: { data: [] } }))
            ]);
            
            const shops = shopRes.data.data || shopRes.data;
            if (Array.isArray(shops)) totalShopsExternally = shops.length;
            
            const leads = leadRes.data.data || leadRes.data;
            if (Array.isArray(leads)) totalLeadsExternally = leads.length;
            if (leadRes.data.meta?.total) totalLeadsExternally = leadRes.data.meta.total;

            const tickets = ticketRes.data.data;
            if (Array.isArray(tickets)) openTickets = tickets.filter(t => t.status === 'Open').length;

            const callbacks = callbackRes.data.data;
            if (Array.isArray(callbacks)) pendingCallbacks = callbacks.filter(c => c.status === 'Pending').length;
            
        } catch (e) {
            console.warn("External dashboard stats fetch failed:", e.message);
        }

        res.json({
            success: true,
            data: {
                revenue: {
                    total: 0,
                    today: 0,
                    weekly: 0,
                    monthly: 0
                },
                counts: {
                    customers: 0,
                    leads: totalLeadsExternally,
                    shops: totalShopsExternally,
                    pendingCallbacks,
                    openTickets
                },
                topClients: []
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
