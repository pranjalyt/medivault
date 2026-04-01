// src/routes/recordRoutes.js
const express = require("express");
const router = express.Router();
const { dbGuard } = require("../middlewares/dbGuard");
const { validate } = require("../middlewares/validate");
const { upload } = require("../config/upload");
const {
    uploadRecord, analyzeRecord, getRecords, getRecordById, deleteRecord
} = require("../controllers/recordController");

router.use(dbGuard);

// upload.single('file') — field name must be "file" in form-data
router.post("/", upload.single("file"), validate(["patient_id", "uploaded_by", "title"]), uploadRecord);
router.post("/:id/analyze", analyzeRecord);
router.get("/", getRecords);
router.get("/:id", getRecordById);
router.delete("/:id", deleteRecord);

module.exports = router;