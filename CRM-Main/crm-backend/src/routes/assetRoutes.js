const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const { 
    createAsset, 
    getAssets, 
    deleteAsset, 
    getAssetById, 
    updateAsset,
    getAssetHistory,
    getAllAssetLogs,
    getDepreciationReport
} = require('../controllers/assetController');


const { checkPermission } = require('../middleware/permissionMiddleware');

// All routes are protected via verifyToken
router.use(verifyToken);

// Create a new Asset
router.post('/', checkPermission('ASSETS', 'CREATE'), createAsset);

// Get all Assets
router.get('/', checkPermission('ASSETS', 'READ'), getAssets);

// Get Global Asset Logs
router.get('/logs', checkPermission('ASSETS', 'READ'), getAllAssetLogs);

// Get Depreciation Report
router.get('/reports/depreciation', checkPermission('ASSETS', 'READ'), getDepreciationReport);

// Get a single Asset by ID
router.get('/:id', checkPermission('ASSETS', 'READ'), getAssetById);

// Get Asset History
router.get('/:id/history', checkPermission('ASSETS', 'READ'), getAssetHistory);

// Update an Asset
router.put('/:id', checkPermission('ASSETS', 'UPDATE'), updateAsset);

// Delete an Asset
router.delete('/:id', checkPermission('ASSETS', 'DELETE'), deleteAsset);

module.exports = router;
