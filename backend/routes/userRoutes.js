// src/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { dbGuard } = require("../middleware/dbGuard");
const { validate } = require("../middleware/validate");
const {
    createUser, getAllUsers, getUserById,
    updateUser, updatePatientProfile, deleteUser
} = require("../controllers/userController");

router.use(dbGuard);

router.post("/", validate(["name", "email", "role"]), createUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.patch("/:id/profile", updatePatientProfile);
router.delete("/:id", deleteUser);

module.exports = router;