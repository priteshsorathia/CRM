const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const prisma = require('./lib/prisma');

const app = express();

// ---------------- ENV DATA ----------------
const PORT = process.env.PORT || 8001;
const CLIENT_URL = process.env.CLIENT_URL;
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

const parseAllowedOrigins = (value) => {
  return String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins(CLIENT_URL);

// ---------------- MIDDLEWARE ----------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------- CORS ----------------
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is localhost or 127.0.0.1
    const isLocalhost =
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1') ||
      origin.startsWith('https://localhost') ||
      origin.startsWith('https://127.0.0.1');

    // Matches http(s)://192.168.x.x:port, http(s)://10.x.x.x:port, http(s)://172.16-31.x.x:port
    const lanPattern = /^https?:\/\/(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(?::\d+)?$/;
    const isLan = lanPattern.test(origin);

    // In dev, allow localhost and LAN origins
    if (process.env.NODE_ENV !== 'production' || isLocalhost || isLan) {
      return callback(null, true);
    }

    if (allowedOrigins.length === 0 || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Shop-Id', 'Cache-Control'],
}));

// ---------------- CREATE UPLOAD FOLDER ----------------
// __dirname points to 'src' folder, so go up one level to project root
const uploadsDir = path.join(__dirname, '..', UPLOAD_DIR);

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory:", uploadsDir);
} else {
  console.log("Using uploads directory:", uploadsDir);
}

// ---------------- STATIC FILES ---------------- 
// Serve uploads at both /uploads and /api/uploads with CORS support
app.use("/uploads", cors(), express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    // Set proper content-type for images
    if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (filePath.endsWith('.ico')) {
      res.setHeader('Content-Type', 'image/x-icon');
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

app.use("/api/uploads", cors(), express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    // Set proper content-type for images
    if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    } else if (filePath.endsWith('.ico')) {
      res.setHeader('Content-Type', 'image/x-icon');
    }
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

// ---------------- MULTER UPLOAD ----------------
const { makeFileFilter } = require('./utils/fileValidation');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "item-" + unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: makeFileFilter((req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  })
});

// ---------------- ROUTES IMPORT ----------------
app.use("/auth", require("./routes/authRoutes"));
app.use("/shops", require("./routes/shopRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use("/email", require("./routes/emailRoutes"));
app.use("/db", require("./routes/dbRoutes"));
app.use("/api/password", require("./routes/passwordRoutes"));
app.use("/auth", require("./routes/forgotPasswordRoutes"));
app.use("/api/units", require("./routes/unitRoutes"));
app.use("/api/inventory", require("./routes/inventoryRoutes"));
app.use("/api/stock", require("./routes/stockRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/draft-invoices", require("./routes/draftInvoiceRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/hrms", require("./routes/hrmsRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/logs", require("./routes/logRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/support", require("./routes/supportRoutes"));
app.use("/api/get-started", require("./routes/getStartedRoutes"));
app.use("/api/bill", require("./routes/billManagementRoutes"));
app.use("/api/restaurant", require("./routes/restaurantRoutes"));
app.use("/api/services/clients", require("./routes/serviceClientRoutes"));
app.use("/api/services/projects", require("./routes/serviceProjectRoutes"));
app.use("/api/assets", require("./routes/assetRoutes"));
app.use("/api/services/invoices", require("./routes/serviceInvoiceRoutes"));
app.use("/api/services/expenses", require("./routes/serviceExpenseRoutes"));
app.use("/api/services/reports", require("./routes/serviceReportsRoutes"));
app.use("/api/services/dashboard", require("./routes/serviceDashboardRoutes"));
app.use("/api/services/notifications", require("./routes/serviceNotificationRoutes"));
app.use("/api/services/accounting", require("./routes/serviceAccountingRoutes"));
app.use("/api/roles/permissions", require("./routes/rolePermissionRoutes"));
app.use("/api/barcode", require("./routes/barcodeRoutes"));
app.use("/api/products", require("./routes/barcodeRoutes"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/version", require("./routes/versionRoutes"));



// ---------------- IMAGE UPLOAD API ----------------
app.post("/api/inventory/upload-image", upload.single("image"), async (req, res) => {
  try {
    const { itemId, shopId } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: "Image required" });

    const updated = await prisma.inventoryItem.update({
      where: {
        id: Number(itemId),
        shopId: Number(shopId),
      },
      data: { item_image: `/uploads/${req.file.filename}` }
    });

    res.json({
      success: true,
      data: {
        imageUrl: `/uploads/${req.file.filename}`,
        item: updated
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- HEALTH CHECK WITH DB STATUS ----------------
app.get("/api/health", async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: "Server running",
      port: PORT,
      database: "connected"
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Server running but database disconnected",
      port: PORT,
      database: "disconnected",
      error: error.message
    });
  }
});

// ---------------- 404 ----------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// ---------------- ERROR HANDLER ----------------
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  const isLimit = err.code === 'LIMIT_FILE_SIZE';
  const isValidationError = isLimit || (err.message && (
    err.message.includes('not allowed') || 
    err.message.includes('Invalid file') || 
    err.message.includes('Only images allowed') || 
    err.message.includes('Only PDF or image')
  ));
  const status = isValidationError ? 400 : 500;
  const friendlyMessage = isLimit ? 'Image size must be less than 10MB' : err.message;
  res.status(status).json({
    success: false,
    error: status === 400 ? "Bad Request" : "Internal Server Error",
    message: friendlyMessage
  });
});

module.exports = app;
