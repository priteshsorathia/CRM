const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const envAllowedOriginsRaw = process.env.CORS_ALLOWED_ORIGINS || "";
const envAllowedOrigins = envAllowedOriginsRaw
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([CLIENT_URL, ...envAllowedOrigins]));

// Trust proxy (for load balancers / HTTPS behind proxy)
app.set("trust proxy", 1);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, Postman)
      // In development, we can be more permissive if troubleshooting Network Errors
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Logging
app.use(morgan("dev"));

// Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Static Uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api", require("./modules"));

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "CRM Seller API Running ✅",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 for all not-matched routes (Express v5 safe)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Central Error Handler
app.use((error, req, res, next) => {
  console.error("🔥 Error:", error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

module.exports = app;
