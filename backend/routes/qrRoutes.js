// src/routes/qrRoutes.js
const express = require("express");
const router = express.Router();
const { dbGuard } = require("../middleware/dbGuard");
const { validate } = require("../middleware/validate");
const { generateQRToken, getEmergencyProfile, getPatientTokens, revokeToken } = require("../controllers/qrController");

router.use(dbGuard);
router.post("/generate", validate(["patient_id"]), generateQRToken);
router.get("/access/:token", getEmergencyProfile);   // PUBLIC — no guard needed but dbGuard is fine
router.get("/tokens/:patient_id", getPatientTokens);
router.delete("/tokens/:token_id", revokeToken);

module.exports = router;