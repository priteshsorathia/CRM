const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
    getSettings,
    updateSettings,
    getShopSettings,
    updateShopSettings,
    getInvoiceSettings,
    updateInvoiceSettings,
    getOrderSettings,
    updateOrderSettings,
    getProjectSettings,
    updateProjectSettings,
    getClientSettings,
    updateClientSettings,
    changePassword // âœ… Import this
} = require('../controllers/settingsController');

// Multer Setup
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use process.cwd() to target the project root 'uploads' folder reliably
const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure directory exists
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Unique filename: shop-logo-[timestamp]-[random].ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'shop-logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const { makeFileFilter } = require('../utils/fileValidation');

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: makeFileFilter((req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    })
});

// Protect all routes
router.use(authenticateToken);

// User Profile Settings
router.get('/', getSettings);
router.put('/', updateSettings);

// Shop (Company) Settings
router.get('/shop', getShopSettings);
router.put('/shop', upload.single('logo'), updateShopSettings);

// Invoice Settings Routes
router.get('/invoice', getInvoiceSettings);
router.put('/invoice', updateInvoiceSettings);

// Order Settings Routes
router.get('/order', getOrderSettings);
router.put('/order', updateOrderSettings);

// Project Settings Routes
router.get('/project', getProjectSettings);
router.put('/project', updateProjectSettings);

// Client Settings Routes
router.get('/client', getClientSettings);
router.put('/client', updateClientSettings);

// âœ… Added: Change Password Route
router.post('/change-password', changePassword);

module.exports = router;

