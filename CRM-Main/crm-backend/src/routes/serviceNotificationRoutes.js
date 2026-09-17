const express = require('express');
const router = express.Router();
const { authenticateToken: auth } = require('../middleware/authMiddleware');
const controller = require('../controllers/serviceNotificationController');

router.get('/', auth, controller.listNotifications);
router.post('/mark-all-read', auth, controller.markAllRead);
router.delete('/', auth, controller.clearAll);

router.patch('/:id/read', auth, controller.markRead);
router.delete('/:id', auth, controller.dismissNotification);

module.exports = router;

