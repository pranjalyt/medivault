// src/middleware/validate.js
// Simple field validation — no external lib needed

const { sendError } = require("./errorHandler");

/**
 * Validate that required fields exist in req.body
 * Usage: validate(['name','email','role'])
 */
function validate(requiredFields = []) {
    return (req, res, next) => {
        const missing = requiredFields.filter(
            (field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === ""
        );
        if (missing.length > 0) {
            return sendError(res, `Missing required fields: ${missing.join(", ")}`, 400);
        }
        next();
    };
}

/**
 * Validate that a param (e.g. :id) is a non-empty string
 */
function validateParam(paramName) {
    return (req, res, next) => {
        if (!req.params[paramName]) {
            return sendError(res, `Missing URL parameter: ${paramName}`, 400);
        }
        next();
    };
}

module.exports = { validate, validateParam };