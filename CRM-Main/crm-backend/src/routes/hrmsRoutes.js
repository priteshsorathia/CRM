const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const {
  // Staff
  getEmployees,
  getEmployeeById,
  createEmployee,
  getNextEmpId,
  checkUserAvailability,
  updateEmployee, // Ensure this is imported
  updateStatus,
  deleteEmployee,
  changePassword,
  // Leave
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveRequest,
  updateLeaveRequestStatus,

  // Attendance
  getDailyAttendance,
  getAttendanceRange,
  markCheckIn,
  markCheckOut,
  punchInOut,
  getSingleAttendance,
  updateAttendanceRecord,
  getAttendanceDayWise,

  // Payroll
  calculatePayroll,
  getPayrollById,
  updatePayroll,
  getPayrolls,
  exportPayrollReport
} = require('../controllers/hrmsController');

const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} = require('../controllers/departmentController');


const { checkPermission } = require('../middleware/permissionMiddleware');

// ==========================================
// MIDDLEWARE: Protect all HRMS routes
// ==========================================
router.use(verifyToken);

// ==========================================
// 1. STAFF MANAGEMENT ROUTES
// ==========================================
router.get('/staff', checkPermission('EMPLOYEE', 'READ'), getEmployees);
router.get('/staff/next-id', checkPermission('EMPLOYEE', 'CREATE'), getNextEmpId);
router.post('/staff/check-availability', checkPermission('EMPLOYEE', 'CREATE'), checkUserAvailability);
router.post('/staff', checkPermission('EMPLOYEE', 'CREATE'), createEmployee);
router.get('/staff/:id', checkPermission('EMPLOYEE', 'READ'), getEmployeeById);
router.put('/staff/:id', checkPermission('EMPLOYEE', 'UPDATE'), updateEmployee);
router.patch('/staff/:id/status', checkPermission('EMPLOYEE', 'UPDATE'), updateStatus);
router.delete('/staff/:id', checkPermission('EMPLOYEE', 'DELETE'), deleteEmployee);
router.post('/staff/:id/change-password', checkPermission('EMPLOYEE', 'UPDATE'), changePassword);

// ==========================================
// 1B. LEAVE MANAGEMENT ROUTES
// ==========================================
router.get('/leave-requests', checkPermission('EMPLOYEE', 'READ'), getLeaveRequests);
router.post('/leave-requests', checkPermission('EMPLOYEE', 'READ'), createLeaveRequest); // Read permission is minimum for requesting leave
router.patch('/leave-requests/:id', checkPermission('EMPLOYEE', 'UPDATE'), updateLeaveRequestStatus);
router.put('/leave-requests/:id', checkPermission('EMPLOYEE', 'UPDATE'), updateLeaveRequest);

// ==========================================
// 2. ATTENDANCE MANAGEMENT ROUTES
// ==========================================
router.get('/attendance', getDailyAttendance);
router.get('/attendance/day-wise', getAttendanceDayWise);
router.get('/attendance/range', getAttendanceRange);

// Punch In/Out (authorization handled inside controllers)
router.post('/attendance/check-in', markCheckIn);
router.post('/attendance/check-out', markCheckOut);
router.post('/attendance/punch', punchInOut);

// For Editing (Get single record & Update)
router.get('/attendance/record', getSingleAttendance);
router.put('/attendance/record', checkPermission('EMPLOYEE', 'UPDATE'), updateAttendanceRecord);

// ==========================================
// 3. PAYROLL MANAGEMENT ROUTES
// ==========================================
router.post('/payroll/calculate', checkPermission('EMPLOYEE', 'CREATE'), calculatePayroll);
router.get('/payroll/list', checkPermission('EMPLOYEE', 'READ'), getPayrolls);
router.get('/payroll/export', checkPermission('EMPLOYEE', 'READ'), exportPayrollReport);
router.get('/payroll/:id', checkPermission('EMPLOYEE', 'READ'), getPayrollById);
router.put('/payroll/:id', checkPermission('EMPLOYEE', 'UPDATE'), updatePayroll);
// ==========================================
// 4. DEPARTMENT MANAGEMENT ROUTES
// ==========================================
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);

module.exports = router;
