const express = require('express');
const router = express.Router();
const controller = require('../controllers/serviceProjectController');
const { authenticateToken: auth } = require('../middleware/authMiddleware');


const { checkPermission } = require('../middleware/permissionMiddleware');

// Project Routes
router.get('/meta/managers', auth, checkPermission('PROJECT', 'READ'), controller.getProjectManagers);
router.get('/', auth, checkPermission('PROJECT', 'READ'), controller.getProjects);
router.post('/', auth, checkPermission('PROJECT', 'CREATE'), controller.createProject);
router.put('/:id', auth, checkPermission('PROJECT', 'UPDATE'), controller.updateProject);
router.delete('/:id', auth, checkPermission('PROJECT', 'DELETE'), controller.deleteProject);
router.get('/:id/members', auth, checkPermission('PROJECT', 'READ'), controller.getProjectMembers);
router.post('/:id/members', auth, checkPermission('PROJECT', 'UPDATE'), controller.addProjectMember);
router.delete('/:id/members/:employeeId', auth, checkPermission('PROJECT', 'DELETE'), controller.removeProjectMember);

// Task Routes
router.get('/:projectId/tasks', auth, checkPermission('TASK', 'READ'), controller.getTasks);
router.post('/:projectId/tasks', auth, checkPermission('TASK', 'CREATE'), controller.createTask);
router.put('/tasks/:taskId', auth, checkPermission('TASK', 'UPDATE'), controller.updateTask);
router.delete('/tasks/:taskId', auth, checkPermission('TASK', 'DELETE'), controller.deleteTask);

// Timesheet Routes
router.get('/:projectId/timesheets', auth, checkPermission('PROJECT', 'READ'), controller.getTimesheets);
router.post('/:projectId/timesheets', auth, checkPermission('PROJECT', 'CREATE'), controller.createTimesheet);

module.exports = router;
