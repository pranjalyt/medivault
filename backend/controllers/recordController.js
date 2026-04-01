// src/controllers/recordController.js
// Handles medical record uploads + AI explanation via OpenRouter

const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const { sendSuccess, sendError, asyncWrap } = require("../middleware/errorHandler");
const { explainMedicalReport } = require("../config/ai");

// POST /api/records — upload a medical record
const uploadRecord = asyncWrap(async (req, res) => {
    const db = req.db;
    const { patient_id, uploaded_by, title, description, record_type } = req.body;

    // Verify patient exists
    const patient = db.prepare("SELECT id, role FROM users WHERE id = ?").get(patient_id);
    if (!patient) return sendError(res, "Patient not found", 404);
    if (patient.role !== "patient") return sendError(res, "Target user is not a patient", 400);

    // Verify uploader exists
    const uploader = db.prepare("SELECT id FROM users WHERE id = ?").get(uploaded_by);
    if (!uploader) return sendError(res, "Uploader user not found", 404);

    const file = req.file; // set by multer middleware
    const id = uuidv4();

    db.prepare(`
    INSERT INTO medical_records (id, patient_id, uploaded_by, title, description, file_path, file_type, record_type, ai_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).run(
        id,
        patient_id,
        uploaded_by,
        title,
        description || null,
        file ? file.filename : null,
        file ? file.mimetype : null,
        record_type || "general"
    );

    const record = db.prepare("SELECT * FROM medical_records WHERE id = ?").get(id);
    return sendSuccess(res, record, "Record uploaded. Use /api/records/:id/analyze to get AI summary.", 201);
});

// POST /api/records/:id/analyze — trigger AI analysis
const analyzeRecord = asyncWrap(async (req, res) => {
    const db = req.db;
    const { id } = req.params;
    const { report_text } = req.body; // optional: manual text if no file

    const record = db.prepare("SELECT * FROM medical_records WHERE id = ?").get(id);
    if (!record) return sendError(res, "Record not found", 404);

    // Set status to processing
    db.prepare("UPDATE medical_records SET ai_status = 'processing' WHERE id = ?").run(id);

    let textToAnalyze = report_text || description;

    // If there's a text file, read it
    if (!textToAnalyze && record.file_path && record.file_type === "text/plain") {
        try {
            const filePath = path.join(__dirname, "../../uploads", record.file_path);
            textToAnalyze = fs.readFileSync(filePath, "utf-8");
        } catch (e) {
            console.warn("⚠️  Could not read file for AI analysis:", e.message);
        }
    }

    if (!textToAnalyze) {
        // Use title + description as fallback
        textToAnalyze = `Report Title: ${record.title}\nDescription: ${record.description || "No description provided"}`;
    }

    const aiResult = await explainMedicalReport(textToAnalyze);

    if (aiResult.success) {
        db.prepare(`
      UPDATE medical_records SET ai_summary = ?, ai_status = 'done' WHERE id = ?
    `).run(aiResult.data, id);
    } else {
        db.prepare(`
      UPDATE medical_records SET ai_status = 'failed' WHERE id = ?
    `).run(id);
        return sendError(res, `AI analysis failed: ${aiResult.error}`, 502);
    }

    const updated = db.prepare("SELECT * FROM medical_records WHERE id = ?").get(id);
    return sendSuccess(res, updated, aiResult.mock ? "Mock AI summary (set API key for real)" : "AI analysis complete");
});

// GET /api/records?patient_id=xxx — list records for a patient
const getRecords = asyncWrap(async (req, res) => {
    const db = req.db;
    const { patient_id } = req.query;

    if (!patient_id) return sendError(res, "patient_id query param is required", 400);

    const patient = db.prepare("SELECT id FROM users WHERE id = ?").get(patient_id);
    if (!patient) return sendError(res, "Patient not found", 404);

    const records = db.prepare(`
    SELECT r.*, u.name as uploaded_by_name
    FROM medical_records r
    LEFT JOIN users u ON r.uploaded_by = u.id
    WHERE r.patient_id = ?
    ORDER BY r.created_at DESC
  `).all(patient_id);

    return sendSuccess(res, records, `${records.length} records found`);
});

// GET /api/records/:id — single record
const getRecordById = asyncWrap(async (req, res) => {
    const db = req.db;
    const { id } = req.params;

    const record = db.prepare(`
    SELECT r.*, u.name as uploaded_by_name, p.name as patient_name
    FROM medical_records r
    LEFT JOIN users u ON r.uploaded_by = u.id
    LEFT JOIN users p ON r.patient_id = p.id
    WHERE r.id = ?
  `).get(id);

    if (!record) return sendError(res, "Record not found", 404);
    return sendSuccess(res, record);
});

// DELETE /api/records/:id
const deleteRecord = asyncWrap(async (req, res) => {
    const db = req.db;
    const { id } = req.params;

    const record = db.prepare("SELECT * FROM medical_records WHERE id = ?").get(id);
    if (!record) return sendError(res, "Record not found", 404);

    // Delete file from disk if exists
    if (record.file_path) {
        const filePath = path.join(__dirname, "../../uploads", record.file_path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    db.prepare("DELETE FROM medical_records WHERE id = ?").run(id);
    return sendSuccess(res, { id }, "Record deleted");
});

module.exports = { uploadRecord, analyzeRecord, getRecords, getRecordById, deleteRecord };