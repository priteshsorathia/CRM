const prisma = require('../lib/prisma');

const normalizeRole = (value) => String(value || '').trim().toLowerCase();
const isManagerLikeRole = (role) => {
    const r = normalizeRole(role);
    return (
        r === 'manager' ||
        r === 'admin' ||
        r === 'administrator' ||
        r === 'owner' ||
        r === 'shop_owner' ||
        r === 'restaurant_owner' ||
        r.endsWith('_owner')
    );
};

// Helper to log asset activities
const logAssetActivity = async ({ shopId, userId, assetId, assetName, action, description, metadata = {} }) => {
    try {
        await prisma.activityLog.create({
            data: {
                shopId,
                userId,
                module: 'Assets',
                action,
                description,
                metadata: {
                    ...metadata,
                    assetId,
                    assetName
                }
            }
        });
    } catch (error) {
        console.error('Error logging asset activity:', error);
    }
};

// 1. Create a new Asset
const createAsset = async (req, res) => {
    try {
        const shopId = parseInt(req.user.shopId);
        if (!shopId) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Missing shop ID' });
        }

        if (!isManagerLikeRole(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Forbidden: Only admins can create assets' });
        }

        const {
            name, category, vendor, serialNumber, cost,
            purchaseDate, warrantyExpiry, condition, status, assignedTo
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Asset name is required'
            });
        }

        // Handle empty serialNumber as null (Postgres UNIQUE allows multiple NULLs, but not multiple "")
        const finalSerialNumber = (serialNumber && serialNumber.trim() !== "") ? serialNumber.trim() : null;

        // Generate a sequential numeric assetId by finding the maximum existing numerical ID
        const existingAssets = await prisma.asset.findMany({
            where: { shopId },
            select: { assetId: true }
        });

        let maxNum = 0;
        existingAssets.forEach(a => {
            const num = parseInt(a.assetId.replace(/\D/g, ''));
            if (!isNaN(num) && num > maxNum) maxNum = num;
        });

        const assetId = String(maxNum + 1);

        const asset = await prisma.asset.create({
            data: {
                shopId,
                assetId,
                name,
                category: category || 'Other',
                vendor: vendor || null,
                serialNumber: finalSerialNumber,
                cost: cost ? parseFloat(cost) : null,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
                condition: condition || 'New',
                status: status || 'Available',
                assignedTo: assignedTo || null
            }
        });

        res.status(201).json({
            success: true,
            message: 'Asset configured successfully',
            data: asset
        });

        // Log the activity
        await logAssetActivity({
            shopId,
            userId: req.user.id,
            assetId: asset.id,
            assetName: asset.name,
            action: 'Asset Created',
            description: `New asset "${name}" registered in ${category}`
        });

    } catch (error) {
        console.error('Error creating asset:', error);

        // Handle unique constraint violations
        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                error: `An asset with this ${error.meta.target.join(', ')} already exists.`
            });
        }

        res.status(500).json({
            success: false,
            error: 'Failed to create asset'
        });
    }
};

// 2. Get all assets
const getAssets = async (req, res) => {
    try {
        const shopId = parseInt(req.user.shopId);
        if (!shopId) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Missing shop ID' });
        }

        const isAdmin = isManagerLikeRole(req.user.role);
        const where = { shopId };

        if (!isAdmin) {
            // For Non-Admins, show only assets assigned to them
            where.assignedTo = {
                equals: req.user.name,
                mode: 'insensitive' // Optional, but usually name matching should be case-insensitive
            };
        }

        const assets = await prisma.asset.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: assets
        });
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch assets'
        });
    }
};

// 3. Delete an Asset
const deleteAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const shopId = parseInt(req.user.shopId);

        if (!shopId) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Missing shop ID' });
        }

        if (!isManagerLikeRole(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Forbidden: Only admins can delete assets' });
        }

        // Check if asset exists and belongs to this shop
        const asset = await prisma.asset.findFirst({
            where: {
                id: parseInt(id),
                shopId
            }
        });

        if (!asset) {
            return res.status(404).json({ success: false, error: 'Asset not found or unauthorized' });
        }

        await prisma.asset.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Asset deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete asset'
        });
    }
};

// 4. Get a Single Asset by ID
const getAssetById = async (req, res) => {
    try {
        const { id } = req.params;
        const shopId = parseInt(req.user.shopId);

        if (!shopId) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Missing shop ID' });
        }

        const isAdmin = isManagerLikeRole(req.user.role);
        const where = {
            id: parseInt(id),
            shopId
        };

        if (!isAdmin) {
            where.assignedTo = {
                equals: req.user.name,
                mode: 'insensitive'
            };
        }

        const asset = await prisma.asset.findFirst({
            where
        });

        if (!asset) {
            return res.status(404).json({ success: false, error: 'Asset not found or unauthorized' });
        }

        res.json({
            success: true,
            data: asset
        });

    } catch (error) {
        console.error('Error fetching asset:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch asset details'
        });
    }
};

// 5. Update an Asset (for Assignment, Maintenance, etc.)
const updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const shopId = parseInt(req.user.shopId);
        const updates = req.body;

        if (!shopId) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Missing shop ID' });
        }

        if (!isManagerLikeRole(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Forbidden: Only admins can update assets' });
        }

        // Check if asset exists and belongs to this shop
        const asset = await prisma.asset.findFirst({
            where: {
                id: parseInt(id),
                shopId
            }
        });

        if (!asset) {
            return res.status(404).json({ success: false, error: 'Asset not found or unauthorized' });
        }

        // Filter updates to allowed fields if necessary, or just spread
        // For assignment: updates would be { status: 'Assigned', assignedTo: 'Employee Name' }
        // For return: { status: 'Available', assignedTo: null }

        const updatedAsset = await prisma.asset.update({
            where: { id: parseInt(id) },
            data: {
                ...updates,
                // Ensure certain fields aren't overwritten by mistake if needed
                shopId: shopId
            }
        });

        res.json({
            success: true,
            message: 'Asset updated successfully',
            data: updatedAsset
        });

        // Log the activity based on what changed
        let action = 'Asset Updated';
        let description = `Asset "${updatedAsset.name}" updated`;

        if (updates.status && updates.status !== asset.status) {
            action = updates.status;
            if (updates.status === 'Assigned') {
                description = `Asset assigned to ${updates.assignedTo}`;
            } else if (updates.status === 'Available') {
                description = `Asset returned to inventory`;
            } else if (updates.status === 'Maintenance') {
                description = `Asset sent for maintenance`;
            }
        }

        await logAssetActivity({
            shopId,
            userId: req.user.id,
            assetId: updatedAsset.id,
            assetName: updatedAsset.name,
            action,
            description
        });

    } catch (error) {
        console.error('Error updating asset:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update asset'
        });
    }
};

module.exports = {
    createAsset,
    getAssets,
    deleteAsset,
    getAssetById,
    updateAsset,
    getAssetHistory: async (req, res) => {
        try {
            const { id } = req.params;
            const shopId = parseInt(req.user.shopId);

            if (!shopId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            const isAdmin = isManagerLikeRole(req.user.role);
            if (!isAdmin) {
                // Verify user can see this asset
                const asset = await prisma.asset.findFirst({
                    where: {
                        id: parseInt(id),
                        shopId,
                        assignedTo: { equals: req.user.name, mode: 'insensitive' }
                    }
                });
                if (!asset) return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
            }

            const logs = await prisma.activityLog.findMany({
                where: {
                    shopId,
                    module: 'Assets',
                    metadata: {
                        path: ['assetId'],
                        equals: parseInt(id)
                    }
                },
                include: { user: { select: { name: true } } },
                orderBy: { createdAt: 'desc' }
            });

            res.json({
                success: true,
                data: logs.map(log => ({
                    date: log.createdAt,
                    action: log.action,
                    user: log.user.name,
                    description: log.description
                }))
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch history' });
        }
    },
    getAllAssetLogs: async (req, res) => {
        try {
            const shopId = parseInt(req.user.shopId);
            if (!shopId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            if (!isManagerLikeRole(req.user.role)) {
                return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
            }

            const logs = await prisma.activityLog.findMany({
                where: { shopId, module: 'Assets' },
                include: { user: { select: { name: true } } },
                orderBy: { createdAt: 'desc' }
            });

            res.json({
                success: true,
                data: logs.map(log => ({
                    id: log.id,
                    activity: log.action,
                    asset: log.metadata?.assetName || 'Asset',
                    user: log.user.name,
                    date: log.createdAt,
                    notes: log.description
                }))
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch logs' });
        }
    },
    getDepreciationReport: async (req, res) => {
        try {
            const shopId = parseInt(req.user.shopId);
            if (!shopId) return res.status(401).json({ success: false, error: 'Unauthorized' });

            if (!isManagerLikeRole(req.user.role)) {
                return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
            }

            const assets = await prisma.asset.findMany({
                where: { shopId },
                select: { cost: true, purchaseDate: true }
            });

            const currentYear = new Date().getFullYear();
            const startYear = currentYear - 4;
            const report = [];

            for (let year = startYear; year <= currentYear; year++) {
                let totalValue = 0;
                let totalDepreciation = 0;

                assets.forEach(asset => {
                    const pYear = new Date(asset.purchaseDate).getFullYear();
                    const cost = asset.cost || 0;

                    if (pYear <= year) {
                        const yearsOwned = year - pYear;
                        // Simple 15% declining balance depreciation
                        const valueAfterDepr = cost * Math.pow(0.85, yearsOwned);
                        const depreciationThisYear = yearsOwned > 0 ? (cost * Math.pow(0.85, yearsOwned - 1) * 0.15) : 0;

                        totalValue += valueAfterDepr;
                        totalDepreciation += depreciationThisYear;
                    }
                });

                report.push({
                    year: year.toString(),
                    value: Math.round(totalValue),
                    depreciation: Math.round(totalDepreciation)
                });
            }

            res.json({ success: true, data: report });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch report' });
        }
    }
};
