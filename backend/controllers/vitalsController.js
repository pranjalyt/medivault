// src/controllers/vitalsController.js
// Log and retrieve patient vitals (BP, sugar, weight, etc.)

const { v4: uuidv4 } = require("uuid");
const { sendSuccess, sendError, asyncWrap } = require("../middleware/errorHandler");

// POST /api/vitals — log a new vitals entry
const logVitals = asyncWrap(async (req, res) => {
    const db = req.db;
    const { patient_id, bp_systolic, bp_diastolic, blood_sugar, weight_kg, heart_rate, spo2, temperature, notes } = req.body;

    const patient = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'patient'").get(patient_id);
    if (!patient) return sendError(res, "Patient not found", 404);

    const id = uuidv4();
    db.prepare(`
    INSERT INTO vitals (id, patient_id, bp_systolic, bp_diastolic, blood_sugar, weight_kg, heart_rate, spo2, temperature, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, patient_id,
        bp_systolic || null, bp_diastolic || null, blood_sugar || null,
        weight_kg || null, heart_rate || null, spo2 || null, temperature || null,
        notes || null
    );

    const entry = db.prepare("SELECT * FROM vitals WHERE id = ?").get(id);
    return sendSuccess(res, entry, "Vitals logged", 201);
});

// GET /api/vitals?patient_id=xxx&limit=30 — get vitals history
const getVitals = asyncWrap(async (req, res) => {
    const db = req.db;
    const { patient_id, limit } = req.query;

    if (!patient_id) return sendError(res, "patient_id is required", 400);

    const patient = db.prepare("SELECT id FROM users WHERE id = ?").get(patient_id);
    if (!patient) return sendError(res, "Patient not found", 404);

    const cap = Math.min(parseInt(limit || "30"), 200);
    const vitals = db.prepare(`
    SELECT * FROM vitals WHERE patient_id = ?
    ORDER BY recorded_at DESC LIMIT ?
  `).all(patient_id, cap);

    return sendSuccess(res, vitals, `${vitals.length} vitals entries`);
});

// GET /api/vitals/latest/:patient_id — latest single reading
const getLatestVitals = asyncWrap(async (req, res) => {
    const db = req.db;
    const { patient_id } = req.params;

    const entry = db.prepare(`
    SELECT * FROM vitals WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 1
  `).get(patient_id);

    if (!entry) return sendError(res, "No vitals recorded yet", 404);
    return sendSuccess(res, entry);
});

// GET /api/vitals/summary/:patient_id — aggregated stats for dashboard
const getVitalsSummary = asyncWrap(async (req, res) => {
    const db = req.db;
    const { patient_id } = req.params;

    const patient = db.prepare("SELECT id FROM users WHERE id = ?").get(patient_id);
    if (!patient) return sendError(res, "Patient not found", 404);

    const summary = db.prepare(`
    SELECT
      COUNT(*) as total_entries,
      ROUND(AVG(bp_systolic),1) as avg_bp_systolic,
      ROUND(AVG(bp_diastolic),1) as avg_bp_diastolic,
      ROUND(AVG(blood_sugar),1) as avg_blood_sugar,
      ROUND(AVG(weight_kg),1) as avg_weight,
      ROUND(AVG(heart_rate),1) as avg_heart_rate,
      MIN(recorded_at) as first_entry,
      MAX(recorded_at) as last_entry
    FROM vitals WHERE patient_id = ?
  `).get(patient_id);

    // Last 7 entries for chart
    const trend = db.prepare(`
    SELECT * FROM vitals WHERE patient_id = ?
    ORDER BY recorded_at DESC LIMIT 7
  `).all(patient_id);

    return sendSuccess(res, { summary, trend: trend.reverse() });
});

// DELETE /api/vitals/:id
const deleteVital = asyncWrap(async (req, res) => {
    const db = req.db;
    const { id } = req.params;

    const entry = db.prepare("SELECT id FROM vitals WHERE id = ?").get(id);
    if (!entry) return sendError(res, "Vitals entry not found", 404);

    db.prepare("DELETE FROM vitals WHERE id = ?").run(id);
    return sendSuccess(res, { id }, "Entry deleted");
});

module.exports = { logVitals, getVitals, getLatestVitals, getVitalsSummary, deleteVital };