// src/routes/prescriptionRoutes.js
const express = require("express");
const router = express.Router();
const { dbGuard } = require("../middlewares/dbGuard");
const { validate } = require("../middlewares/validate");
const {
    createPrescription, getPatientPrescriptions, getPrescriptionById,
    deletePrescription, explainMedicine, triageSymptom
} = require("../controllers/prescriptionController");

router.use(dbGuard);
router.post("/", validate(["patient_id", "doctor_id", "medicines"]), createPrescription);
router.get("/", getPatientPrescriptions);
router.get("/:id", getPrescriptionById);
router.delete("/:id", deletePrescription);

// AI routes live under /api/ai
router.post("/ai/medicine", validate(["medicine_name"]), explainMedicine);
router.post("/ai/triage", validate(["symptoms"]), triageSymptom);

module.exports = router;