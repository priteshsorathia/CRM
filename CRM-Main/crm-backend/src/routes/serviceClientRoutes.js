const express = require('express');
const router = express.Router();
const controller = require('../controllers/serviceClientController');
const { authenticateToken: auth } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');

router.get('/', auth, checkPermission('CLIENTS', 'READ'), controller.getClients);
router.post('/', auth, checkPermission('CLIENTS', 'CREATE'), controller.createClient);
router.put('/:id', auth, checkPermission('CLIENTS', 'UPDATE'), controller.updateClient);
router.delete('/:id', auth, checkPermission('CLIENTS', 'DELETE'), controller.deleteClient);
router.post('/:id/share', auth, checkPermission('CLIENTS', 'READ'), controller.uploadMiddleware, controller.shareClientProfile);

module.exports = router;
