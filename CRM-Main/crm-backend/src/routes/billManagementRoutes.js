const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const {
    createPurchaseBill,
    getBillsShopWise,
    getDashboardStats,
    getPurchaseBillById,
    updatePurchaseBill,
    deletePurchaseBill,
    getUdharBillsShopWise,
    markPurchaseBillAsPaid,
} = require("../controllers/billManagementController");

// Upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";
const uploadsDir = path.join(__dirname, "..", "..", UPLOAD_DIR);

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, "bill-" + unique + path.extname(file.originalname));
    },
});

// Allowed file types
const allowedMimes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
];

const { makeFileFilter } = require('../utils/fileValidation');

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: makeFileFilter((req, file, cb) => {
        if (allowedMimes.includes(file.mimetype)) cb(null, true);
        else cb(new Error("Invalid file type"));
    }),
});

// Routes
router.post("/create-bill", upload.single("bill"), createPurchaseBill);
router.get("/get-bills/shop", getBillsShopWise);
router.get("/get-udhar-bills/shop", getUdharBillsShopWise);
router.patch("/purchase-bills/:id/mark-paid", markPurchaseBillAsPaid);
router.get("/stats", getDashboardStats);
router.get("/view-bill/:id", getPurchaseBillById);
router.put("/update-bill/:id", upload.single("bill"), updatePurchaseBill);
router.put("/update/:id", upload.single("bill"), updatePurchaseBill);
router.delete("/delete-bill/:id", deletePurchaseBill);

module.exports = router;