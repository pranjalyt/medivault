// src/middleware/dbGuard.js
// Checks DB is initialized before every route that needs it
// Prevents cryptic "cannot read property of null" errors

const { getDB } = require("../config/db");
const { sendError } = require("./errorHandler");

function dbGuard(req, res, next) {
    const db = getDB();
    if (!db) {
        return sendError(
            res,
            "Database is not available. Check server logs for DB initialization errors.",
            503
        );
    }
    req.db = db; // Attach db to request so controllers don't need to import it
    next();
}

module.exports = { dbGuard };