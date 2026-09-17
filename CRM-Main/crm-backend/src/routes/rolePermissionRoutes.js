const express = require('express');
const router = express.Router();
const controller = require('../controllers/rolePermissionController');
const { authenticateToken: auth } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');


router.get('/', auth, controller.getPermissions);
router.put('/', auth, checkPermission('ROLES', 'UPDATE'), controller.updatePermissions);
router.get('/designations', auth, controller.getDesignations);
router.delete('/designation', auth, checkPermission('ROLES', 'DELETE'), controller.deleteDesignation);

module.exports = router;
