const { externalApi } = require('../../lib/externalApi');

const normalizeUser = (u, index, originalId) => ({
    ...u,
    id: u.id || originalId || `ext-ur-${index + 1}`,
    serialId: u.serialId || (typeof u.id === 'number' ? u.id : (index !== undefined ? index + 1 : 0)),
    status: (u.isBlocked === true || u.status === 'Inactive' || u.status === 'Blocked') ? 'Inactive' : 'Active',
    createdAt: u.createdAt || new Date().toISOString()
});

// GET all users
exports.getAllUsers = async (req, res) => {
    try {
        const response = await externalApi.get('/users');
        let users = response.data.data || response.data;

        if (!Array.isArray(users)) users = [];

        users = users.map((u, index) => normalizeUser(u, index));
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error('Fetch Users Error:', error.message);
        res.status(500).json({ success: false, message: 'External User Service Unavailable' });
    }
};

// GET user by ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        let extId = id;
        if (id.startsWith('ext-ur-')) {
            extId = id.replace('ext-ur-', '');
        } else if (id.startsWith('UR-')) {
            extId = id.split('-')[1].replace(/^0+/, '');
        }

        const response = await externalApi.get(`/users/${extId}`);
        const user = response.data.data || response.data;

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.status(200).json({ success: true, data: normalizeUser(user, undefined, id) });
    } catch (error) {
        console.error('Fetch User Error:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to fetch user details'
        });
    }
};

// POST create user
exports.createUser = async (req, res) => {
    try {
        const response = await externalApi.post('/users', req.body);
        res.status(201).json({ success: true, data: response.data.data || response.data });
    } catch (error) {
        console.error('Create User Error:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to create user'
        });
    }
};

// PUT update user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        let extId = id;
        if (id.startsWith('ext-ur-')) {
            extId = id.replace('ext-ur-', '');
        } else if (id.startsWith('UR-')) {
            extId = id.split('-')[1].replace(/^0+/, '');
        }

        const response = await externalApi.put(`/users/${extId}`, req.body);
        res.status(200).json({ success: true, data: response.data.data || response.data });
    } catch (error) {
        console.error('Update User Error:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to update user'
        });
    }
};

// DELETE user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        let extId = id;
        if (id.startsWith('ext-ur-')) {
            extId = id.replace('ext-ur-', '');
        } else if (id.startsWith('UR-')) {
            extId = id.split('-')[1].replace(/^0+/, '');
        }

        await externalApi.delete(`/users/${extId}`);
        res.status(200).json({ success: true, message: 'User deleted.' });
    } catch (error) {
        console.error('Delete User Error:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to delete user'
        });
    }
};
