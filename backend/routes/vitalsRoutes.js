// src/routes/vitalsRoutes.js
const express = require("express");
const router = express.Router();
const { dbGuard } = require("../middlewares/dbGuard");
const { validate } = require("../middlewares/validate");
const { logVitals, getVitals, getLatestVitals, getVitalsSummary, deleteVital } = require("../controllers/vitalsController");

router.use(dbGuard);
router.post("/", validate(["patient_id"]), logVitals);
router.get("/", getVitals);
router.get("/latest/:patient_id", getLatestVitals);
router.get("/summary/:patient_id", getVitalsSummary);
router.delete("/:id", deleteVital);

module.exports = router;