const { externalApi } = require('../../lib/externalApi');

/**
 * 🛠️ Normalize shop with cross-referenced owner data
 * Priority order for email:
 * 1. Email from users array (with role 'shop_owner' or 'owner')
 * 2. Original 'email' field returned by Shop API
 */
const normalizeShop = (s, index, originalId) => {
    const owner = (s.users || []).find(u => u.role === 'shop_owner' || u.role === 'owner');
    
    return {
        ...s,
        serialId: s.serialId || (index !== undefined ? index + 1 : 0),
        id: s.id || s._id || originalId,
        // Override email if an official owner user exists
        email: (owner && owner.email) ? owner.email : s.email,
        status: s.status || (s.isBlocked ? 'Blocked' : 'Active'),
        createdAt: s.createdAt || new Date().toISOString()
    };
};

// GET all shops
exports.getAllShops = async (req, res) => {
    try {
        const { search } = req.query;
        
        const response = await externalApi.get('/shops');
        let shops = response.data.data || response.data;

        if (Array.isArray(shops)) {
            shops = shops.map((s, index) => normalizeShop(s, index));

            if (search) {
                const sLower = search.toLowerCase();
                shops = shops.filter(s =>
                    (s.name || '').toLowerCase().includes(sLower) ||
                    (s.address || s.location || '').toLowerCase().includes(sLower) ||
                    (s.phone || '').toLowerCase().includes(sLower) ||
                    (s.email || '').toLowerCase().includes(sLower)
                );
            }
            return res.status(200).json({ success: true, data: shops });
        }
        res.status(200).json({ success: true, data: [] });
    } catch (error) {
        console.error("Fetch Shops Error:", error.message);
        res.status(500).json({ success: false, message: 'External Service Unavailable' });
    }
};

// Get single shop by ID
exports.getShopById = async (req, res) => {
    try {
        const { id } = req.params;
        
        let extId = id;
        if (id.startsWith('ext-sh-')) {
            extId = id.replace('ext-sh-', '');
        } else if (id.startsWith('SH-')) {
            extId = id.split('-')[1].replace(/^0+/, '');
        }

        const response = await externalApi.get(`/shops/${extId}`);
        const shop = response.data.data || response.data;

        if (!shop) return res.status(404).json({ success: false, message: 'Shop record not found' });

        // normalizeShop handles the email fetch from external users automatically
        res.status(200).json({ success: true, data: normalizeShop(shop, undefined, id) });
    } catch (error) {
        console.error("Fetch Single Error:", error.message);
        res.status(error.response?.status || 500).json({ 
            success: false, 
            message: error.response?.data?.message || 'Failed to fetch shop details' 
        });
    }
};

// Create new shop
exports.createShop = async (req, res) => {
    try {
        const { name, address, location, phone, email, ownerName, gstNumber, upiId, userType } = req.body;

        if (!name || !ownerName || !(address || location) || !phone || !email || !upiId) {
            return res.status(400).json({ success: false, message: 'All mandatory fields must be filled.' });
        }

        const response = await externalApi.post('/shops/create', {
            name,
            address: address || location,
            phone,
            email,
            ownerName,
            gstNumber,
            upiId,
            userType: userType || 'retailers'
        });

        res.status(201).json({ success: true, data: response.data.data || response.data });
    } catch (error) {
        console.error("Create Shop Error:", error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to create shop externally'
        });
    }
};

// Update shop
exports.updateShop = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, location, phone, email, ownerName, gstNumber, upiId, userType, isBlocked } = req.body;

        let extId = id;
        if (id.startsWith('ext-sh-')) {
            extId = id.replace('ext-sh-', '');
        } else if (id.startsWith('SH-')) {
            extId = id.split('-')[1].replace(/^0+/, '');
        }

        const response = await externalApi.put(`/shops/${extId}`, {
            name,
            address: address || location,
            phone,
            email,
            ownerName,
            gstNumber,
            upiId,
            userType,
            isBlocked
        });

        res.status(200).json({ success: true, data: response.data.data || response.data });
    } catch (error) {
        console.error("Update Error:", error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to update shop'
        });
    }
};

// Toggle shop block status
exports.toggleShopBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const { isBlocked } = req.body;

        let extId = id;
        if (id.startsWith('ext-sh-')) {
            extId = id.replace('ext-sh-', '');
        } else if (id.startsWith('SH-')) {
            extId = id.split('-')[1].replace(/^0+/, '');
        }

        const response = await externalApi.patch(`/shops/${extId}/block`, { 
            isBlocked: isBlocked !== undefined ? isBlocked : true 
        });

        res.status(200).json({ success: true, data: response.data.data || response.data });
    } catch (error) {
        console.error("Block/Unblock Error:", error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to update shop block status'
        });
    }
};

// Delete shop (Not supported by external API)
exports.deleteShop = async (req, res) => {
    res.status(405).json({ 
        success: false, 
        message: 'Permanent deletion is not supported. Please use the Block feature instead.' 
    });
};
