// src/controllers/qrController.js
// QR code emergency access — generates tokens, serves emergency profile

const { v4: uuidv4 } = require("uuid");
const { sendSuccess, sendError, asyncWrap } = require("../middlewares/errorHandler");

// POST /api/qr/generate — generate a QR token for a patient
const generateQRToken = asyncWrap(async (req, res) => {
    const db = req.db;
    const { patient_id, is_permanent, expires_in_minutes } = req.body;

    const patient = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'patient'").get(patient_id);
    if (!patient) return sendError(res, "Patient not found", 404);

    const token = uuidv4();
    const id = uuidv4();
    const permanent = is_permanent ? 1 : 0;

    // Default: 5 min expiry for temp tokens, 1 year for permanent
    const expiryMinutes = permanent ? 525600 : (expires_in_minutes || 5);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

    db.prepare(`
    INSERT INTO qr_tokens (id, patient_id, token, expires_at, is_permanent)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, patient_id, token, expiresAt, permanent);

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

    return sendSuccess(res, {
        token_id: id,
        token,
        patient_id,
        expires_at: expiresAt,
        is_permanent: !!permanent,
        qr_url: `${baseUrl}/api/qr/access/${token}`,  // scan this URL
    }, "QR token generated");
});

// GET /api/qr/access/:token — public emergency profile (no auth needed)
const getEmergencyProfile = asyncWrap(async (req, res) => {
    const db = req.db;
    const { token } = req.params;

    const qrRecord = db.prepare("SELECT * FROM qr_tokens WHERE token = ?").get(token);
    if (!qrRecord) return sendError(res, "Invalid QR token", 404);

    // Check expiry
    if (new Date(qrRecord.expires_at) < new Date()) {
        db.prepare("DELETE FROM qr_tokens WHERE token = ?").run(token); // cleanup expired
        return sendError(res, "QR token has expired", 410);
    }

    const user = db.prepare("SELECT id, name, phone FROM users WHERE id = ?").get(qrRecord.patient_id);
    if (!user) return sendError(res, "Patient not found", 404);

    const profile = db.prepare("SELECT * FROM patient_profiles WHERE user_id = ?").get(qrRecord.patient_id);

    // Parse JSON fields
    const allergies = JSON.parse(profile?.allergies || "[]");
    const current_meds = JSON.parse(profile?.current_meds || "[]");
    const conditions = JSON.parse(profile?.conditions || "[]");

    // Only return what a first responder NEEDS
    return sendSuccess(res, {
        patient_name: user.name,
        phone: user.phone,
        blood_group: profile?.blood_group || "Unknown",
        allergies,
        current_medications: current_meds,
        known_conditions: conditions,
        emergency_contact_name: profile?.emergency_contact_name || null,
        emergency_contact_phone: profile?.emergency_contact_phone || null,
        token_expires_at: qrRecord.expires_at,
        is_permanent: !!qrRecord.is_permanent,
    }, "Emergency profile retrieved");
});

// GET /api/qr/tokens/:patient_id — list all tokens for a patient
const getPatientTokens = asyncWrap(async (req, res) => {
    const db = req.db;
    const { patient_id } = req.params;

    const tokens = db.prepare(`
    SELECT id, token, expires_at, is_permanent, created_at
    FROM qr_tokens WHERE patient_id = ?
    ORDER BY created_at DESC
  `).all(patient_id);

    // Mark expired ones
    const now = new Date();
    const withStatus = tokens.map(t => ({
        ...t,
        is_expired: new Date(t.expires_at) < now,
    }));

    return sendSuccess(res, withStatus, `${tokens.length} tokens`);
});

// DELETE /api/qr/tokens/:token_id — revoke a token
const revokeToken = asyncWrap(async (req, res) => {
    const db = req.db;
    const { token_id } = req.params;

    const token = db.prepare("SELECT id FROM qr_tokens WHERE id = ?").get(token_id);
    if (!token) return sendError(res, "Token not found", 404);

    db.prepare("DELETE FROM qr_tokens WHERE id = ?").run(token_id);
    return sendSuccess(res, { token_id }, "Token revoked");
});

module.exports = { generateQRToken, getEmergencyProfile, getPatientTokens, revokeToken };