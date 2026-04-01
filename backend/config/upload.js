// src/config/upload.js
// File upload configuration using multer (local disk for now)
// Later can swap to Cloudinary by changing storage engine only

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "../../uploads");

// Make sure upload folder exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        cb(null, `${timestamp}-${safe}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf", "image/jpg"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, PNG, and PDF files are allowed"), false);
    }
};

const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "10");

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_MB * 1024 * 1024 },
});

module.exports = { upload, UPLOAD_DIR };