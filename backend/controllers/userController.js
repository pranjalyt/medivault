// src/controllers/userController.js
// Handles user CRUD — no auth for now, uses user_id from body/params

const { v4: uuidv4 } = require("uuid");
const { sendSuccess, sendError, asyncWrap } = require("../middleware/errorHandler");

// POST /api/users — create a new user
const createUser = asyncWrap(async (req, res) => {
    const { name, email, phone, role } = req.body;
    const db = req.db;

    const id = uuidv4();

    try {
        db.prepare(`
      INSERT INTO users (id, name, email, phone, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, name, email, phone || null, role);
    } catch (err) {
        if (err.message.includes("UNIQUE constraint")) {
            return sendError(res, "Email already registered", 409);
        }
        throw err;
    }

    // If patient, create empty profile too
    if (role === "patient") {
        db.prepare(`
      INSERT INTO patient_profiles (id, user_id) VALUES (?, ?)
    `).run(uuidv4(), id);
    }

    // If doctor, create empty profile
    if (role === "doctor") {
        db.prepare(`
      INSERT INTO doctor_profiles (id, user_id) VALUES (?, ?)
    `).run(uuidv4(), id);
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    return sendSuccess(res, user, "User created successfully", 201);
});

// GET /api/users — list all users (dev/admin use)
const getAllUsers = asyncWrap(async (req, res) => {
    const db = req.db;
    const { role } = req.query;

    let users;
    if (role) {
        users = db.prepare("SELECT * FROM users WHERE role = ? ORDER BY created_at DESC").all(role);
    } else {
        users = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
    }

    return sendSuccess(res, users, `${users.length} users found`);
});

// GET /api/users/:id — get single user with profile
const getUserById = asyncWrap(async (req, res) => {
    const db = req.db;
    const { id } = req.params;

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!user) return sendError(res, "User not found", 404);

    // Attach profile based on role
    let profile = null;
    if (user.role === "patient") {
        profile = db.prepare("SELECT * FROM patient_profiles WHERE user_id = ?").get(id);
        if (profile) {
            profile.allergies = JSON.parse(profile.allergies || "[]");
            profile.current_meds = JSON.parse(profile.current_meds || "[]");
            profile.conditions = JSON.parse(profile.conditions || "[]");
        }
    } else if (user.role === "doctor") {
        profile = db.prepare("SELECT * FROM doctor_profiles WHERE user_id = ?").get(id);
    }

    return sendSuccess(res, { ...user, profile });
});

// PATCH /api/users/:id — update user basic info
const updateUser = asyncWrap(async (req, res) => {
    const db = req.db;
    const { id } = req.params;
    const { name, phone } = req.body;

    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!user) return sendError(res, "User not found", 404);

    db.prepare(`
    UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone),
    updated_at = datetime('now') WHERE id = ?
  `).run(name || null, phone || null, id);

    const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    return sendSuccess(res, updated, "User updated");
});

// PATCH /api/users/:id/profile — update patient profile
const updatePatientProfile = asyncWrap(async (req, res) => {
    const db = req.db;
    const { id } = req.params;

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!user) return sendError(res, "User not found", 404);
    if (user.role !== "patient") return sendError(res, "User is not a patient", 400);

    const {
        blood_group, date_of_birth, gender, height_cm, weight_kg,
        allergies, emergency_contact_name, emergency_contact_phone,
        current_meds, conditions
    } = req.body;

    db.prepare(`
    UPDATE patient_profiles SET
      blood_group = COALESCE(?, blood_group),
      date_of_birth = COALESCE(?, date_of_birth),
      gender = COALESCE(?, gender),
      height_cm = COALESCE(?, height_cm),
      weight_kg = COALESCE(?, weight_kg),
      allergies = COALESCE(?, allergies),
      emergency_contact_name = COALESCE(?, emergency_contact_name),
      emergency_contact_phone = COALESCE(?, emergency_contact_phone),
      current_meds = COALESCE(?, current_meds),
      conditions = COALESCE(?, conditions),
      updated_at = datetime('now')
    WHERE user_id = ?
  `).run(
        blood_group || null,
        date_of_birth || null,
        gender || null,
        height_cm || null,
        weight_kg || null,
        allergies ? JSON.stringify(allergies) : null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        current_meds ? JSON.stringify(current_meds) : null,
        conditions ? JSON.stringify(conditions) : null,
        id
    );

    const profile = db.prepare("SELECT * FROM patient_profiles WHERE user_id = ?").get(id);
    profile.allergies = JSON.parse(profile.allergies || "[]");
    profile.current_meds = JSON.parse(profile.current_meds || "[]");
    profile.conditions = JSON.parse(profile.conditions || "[]");

    return sendSuccess(res, profile, "Profile updated");
});

// DELETE /api/users/:id
const deleteUser = asyncWrap(async (req, res) => {
    const db = req.db;
    const { id } = req.params;

    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
    if (!user) return sendError(res, "User not found", 404);

    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    return sendSuccess(res, { id }, "User deleted");
});

module.exports = { createUser, getAllUsers, getUserById, updateUser, updatePatientProfile, deleteUser };