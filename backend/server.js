// src/server.js
// Main entry point — keep this clean, all config is in /config and /routes

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const { initDB } = require("./config/db");
const { globalErrorHandler, notFoundHandler, sendSuccess } = require("./middleware/errorHandler");

// ── Routes ──────────────────────────────────────────────────────────────────
const userRoutes = require("./routes/userRoutes");
const recordRoutes = require("./routes/recordRoutes");
const qrRoutes = require("./routes/qrRoutes");
const vitalsRoutes = require("./routes/vitalsRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logger — shows method, url, status, response time
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Static file serving for uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Database Init ────────────────────────────────────────────────────────────
// DB initializes synchronously — if it fails, routes will return 503 via dbGuard
const db = initDB();
if (!db) {
    console.error("⚠️  [Server] DB failed to initialize. API will return 503 on DB routes.");
}

// ── Health Check Route (no DB needed) ───────────────────────────────────────
app.get("/", (req, res) => {
    return sendSuccess(res, {
        app: process.env.APP_NAME || "MediVault",
        version: "1.0.0",
        status: "running",
        db: db ? "connected" : "disconnected",
        env: process.env.NODE_ENV || "development",
        uptime_seconds: Math.floor(process.uptime()),
        endpoints: {
            users: "/api/users",
            records: "/api/records",
            qr: "/api/qr",
            vitals: "/api/vitals",
            prescriptions: "/api/prescriptions",
            ai_medicine: "/api/prescriptions/ai/medicine",
            ai_triage: "/api/prescriptions/ai/triage",
        }
    }, "MediVault API is running 🏥");
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/users", userRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/vitals", vitalsRoutes);
app.use("/api/prescriptions", prescriptionRoutes);

// ── 404 + Global Error Handler ───────────────────────────────────────────────
// IMPORTANT: These must be LAST
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log("\n" + "═".repeat(50));
    console.log(`🏥  MediVault API running on http://localhost:${PORT}`);
    console.log(`📋  Health check: http://localhost:${PORT}/`);
    console.log(`🗄️   DB status: ${db ? "✅ connected" : "❌ disconnected"}`);
    console.log(`🌍  Environment: ${process.env.NODE_ENV || "development"}`);
    console.log("═".repeat(50) + "\n");
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
process.on("SIGINT", () => {
    console.log("\n👋 Shutting down gracefully...");
    process.exit(0);
});

process.on("uncaughtException", (err) => {
    console.error("💥 [UNCAUGHT EXCEPTION]:", err.message);
    console.error(err.stack);
    // Don't exit — keep server running so you can debug
});

process.on("unhandledRejection", (reason) => {
    console.error("💥 [UNHANDLED REJECTION]:", reason);
    // Don't exit
});

module.exports = app;