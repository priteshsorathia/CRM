const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken: auth } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/permissionMiddleware');
const controller = require('../controllers/serviceExpenseController');

const uploadsDir = path.join(__dirname, '..', '..', (process.env.UPLOAD_DIR || 'uploads'));
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `expense-${req.params.id || 'new'}-${unique}${path.extname(file.originalname)}`);
  }
});

const { makeFileFilter } = require('../utils/fileValidation');

const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: makeFileFilter((req, file, cb) => {
    const ok =
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('image/');
    if (ok) cb(null, true);
    else cb(new Error('Only PDF or image files are allowed'), false);
  })
});

router.get('/', auth, checkPermission('EXPENSES', 'READ'), controller.listExpenses);
router.post('/', auth, checkPermission('EXPENSES', 'CREATE'), controller.createExpense);
router.post('/:id/receipt', auth, checkPermission('EXPENSES', 'UPDATE'), uploadReceipt.single('receipt'), controller.uploadReceipt);
router.get('/:id', auth, checkPermission('EXPENSES', 'READ'), controller.getExpense);
router.put('/:id', auth, checkPermission('EXPENSES', 'UPDATE'), controller.updateExpense);
router.delete('/:id', auth, checkPermission('EXPENSES', 'DELETE'), controller.deleteExpense);

router.patch('/:id/approve', auth, checkPermission('EXPENSES', 'UPDATE'), controller.approveExpense);
router.patch('/:id/reject', auth, checkPermission('EXPENSES', 'UPDATE'), controller.rejectExpense);
router.patch('/:id/reimburse', auth, checkPermission('EXPENSES', 'UPDATE'), controller.reimburseExpense);

module.exports = router;
