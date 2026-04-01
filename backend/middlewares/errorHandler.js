// src/middleware/errorHandler.js
// Central error handling — all unhandled errors land here
// This is your MAIN DEBUG TOOL when things break

/**
 * Wraps async route handlers to catch errors automatically
 * Usage: router.get('/path', asyncWrap(async (req, res) => { ... }))
 */
function asyncWrap(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Standard success response
 */
function sendSuccess(res, data, message = "Success", statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Standard error response
 */
function sendError(res, message = "Something went wrong", statusCode = 500, details = null) {
    const payload = {
        success: false,
        message,
        timestamp: new Date().toISOString(),
    };
    if (details && process.env.NODE_ENV === "development") {
        payload.details = details; // Only expose internals in dev
    }
    return res.status(statusCode).json(payload);
}

/**
 * Global error middleware (must have 4 params for Express to recognize it)
 */
function globalErrorHandler(err, req, res, next) {
    // Log everything — this is your first stop when debugging
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(`❌ [ERROR] ${req.method} ${req.originalUrl}`);
    console.error(`   Message : ${err.message}`);
    console.error(`   Stack   : ${err.stack}`);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Multer file size error
    if (err.code === "LIMIT_FILE_SIZE") {
        return sendError(res, `File too large. Max size: ${process.env.MAX_FILE_SIZE_MB || 10}MB`, 413);
    }

    // Multer file type error
    if (err.message?.includes("Only JPG")) {
        return sendError(res, err.message, 415);
    }

    // SQLite constraint errors
    if (err.message?.includes("UNIQUE constraint")) {
        return sendError(res, "A record with this value already exists", 409, err.message);
    }
    if (err.message?.includes("FOREIGN KEY constraint")) {
        return sendError(res, "Referenced record not found", 404, err.message);
    }
    if (err.message?.includes("NOT NULL constraint")) {
        return sendError(res, "Missing required field", 400, err.message);
    }

    // JSON parse errors
    if (err.type === "entity.parse.failed") {
        return sendError(res, "Invalid JSON in request body", 400);
    }

    // Default
    return sendError(res, err.message || "Internal server error", err.status || 500, err.stack);
}

/**
 * 404 handler — add after all routes
 */
function notFoundHandler(req, res) {
    return sendError(
        res,
        `Route not found: ${req.method} ${req.originalUrl}`,
        404
    );
}

module.exports = { asyncWrap, sendSuccess, sendError, globalErrorHandler, notFoundHandler };