// src/controllers/prescriptionController.js
// Doctor creates prescriptions; AI explains medicines

const { v4: uuidv4 } = require("uuid");
const { sendSuccess, sendError, asyncWrap } = require("../middlewares/errorHandler");
const { analyzeMedicineSideEffects, triageSymptoms } = require("../config/ai");

// POST /api/prescriptions — doctor creates prescription
const createPrescription = asyncWrap(async (req, res) => {
    const db = req.db;
    const { patient_id, doctor_id, medicines, notes, diagnosis, valid_until } = req.body;

    const patient = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'patient'").get(patient_id);
    if (!patient) return sendError(res, "Patient not found", 404);

    const doctor = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'doctor'").get(doctor_id);
    if (!doctor) return sendError(res, "Doctor not found", 404);

    if (!Array.isArray(medicines) || medicines.length === 0) {
        return sendError(res, "medicines must be a non-empty array", 400);
    }

    const id = uuidv4();
    db.prepare(`
    INSERT INTO prescriptions (id, patient_id, doctor_id, medicines, notes, diagnosis, valid_until)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, patient_id, doctor_id, JSON.stringify(medicines), notes || null, diagnosis || null, valid_until || null);

    const prescription = db.prepare(`
    SELECT p.*, u.name as doctor_name, pt.name as patient_name
    FROM prescriptions p
    LEFT JOIN users u ON p.doctor_id = u.id
    LEFT JOIN users pt ON p.patient_id = pt.id
    WHERE p.id = ?
  `).get(id);

    prescription.medicines = JSON.parse(prescription.medicines);
    return sendSuccess(res, prescription, "Prescription created", 201);
});

// GET /api/prescriptions?patient_id=xxx
const getPatientPrescriptions = asyncWrap(async (req, res) => {
    const db = req.db;
    const { patient_id, doctor_id } = req.query;

    if (!patient_id && !doctor_id) {
        return sendError(res, "patient_id or doctor_id query param required", 400);
    }

    let rows;
    if (patient_id) {
        rows = db.prepare(`
      SELECT p.*, u.name as doctor_name
      FROM prescriptions p LEFT JOIN users u ON p.doctor_id = u.id
      WHERE p.patient_id = ? ORDER BY p.created_at DESC
    `).all(patient_id);
    } else {
        rows = db.prepare(`
      SELECT p.*, u.name as patient_name
      FROM prescriptions p LEFT JOIN users u ON p.patient_id = u.id
      WHERE p.doctor_id = ? ORDER BY p.created_at DESC
    `).all(doctor_id);
    }

    rows = rows.map(r => ({ ...r, medicines: JSON.parse(r.medicines || "[]") }));
    return sendSuccess(res, rows, `${rows.length} prescriptions`);
});

// GET /api/prescriptions/:id
const getPrescriptionById = asyncWrap(async (req, res) => {
    const db = req.db;
    const p = db.prepare(`
    SELECT p.*, u.name as doctor_name, pt.name as patient_name
    FROM prescriptions p
    LEFT JOIN users u ON p.doctor_id = u.id
    LEFT JOIN users pt ON p.patient_id = pt.id
    WHERE p.id = ?
  `).get(req.params.id);

    if (!p) return sendError(res, "Prescription not found", 404);
    p.medicines = JSON.parse(p.medicines || "[]");
    return sendSuccess(res, p);
});

// DELETE /api/prescriptions/:id
const deletePrescription = asyncWrap(async (req, res) => {
    const db = req.db;
    const p = db.prepare("SELECT id FROM prescriptions WHERE id = ?").get(req.params.id);
    if (!p) return sendError(res, "Prescription not found", 404);
    db.prepare("DELETE FROM prescriptions WHERE id = ?").run(req.params.id);
    return sendSuccess(res, { id: req.params.id }, "Prescription deleted");
});

// POST /api/ai/medicine — AI explains medicine side effects
const explainMedicine = asyncWrap(async (req, res) => {
    const { medicine_name } = req.body;
    if (!medicine_name) return sendError(res, "medicine_name is required", 400);

    const result = await analyzeMedicineSideEffects(medicine_name);
    if (!result.success) return sendError(res, `AI failed: ${result.error}`, 502);

    return sendSuccess(res, {
        medicine: medicine_name,
        explanation: result.data,
        is_mock: !!result.mock,
    });
});

// POST /api/ai/triage — AI symptom triage
const triageSymptom = asyncWrap(async (req, res) => {
    const { symptoms } = req.body;
    if (!symptoms) return sendError(res, "symptoms is required", 400);

    const result = await triageSymptoms(symptoms);
    if (!result.success) return sendError(res, `AI failed: ${result.error}`, 502);

    return sendSuccess(res, {
        symptoms,
        triage: result.data,
        is_mock: !!result.mock,
        disclaimer: "This is not a medical diagnosis. Always consult a qualified doctor.",
    });
});

module.exports = {
    createPrescription, getPatientPrescriptions, getPrescriptionById,
    deletePrescription, explainMedicine, triageSymptom
};