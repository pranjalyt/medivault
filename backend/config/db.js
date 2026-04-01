// src/config/db.js
// Initializes SQLite database with all tables
// Uses better-sqlite3 (synchronous, no callback hell, great for dev)

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, "../../medivault.db");

let db;

function initDB() {
    try {
        db = new Database(DB_PATH, {
            // verbose: console.log, // uncomment to log all SQL queries
        });

        // Enable WAL mode for better performance
        db.pragma("journal_mode = WAL");
        db.pragma("foreign_keys = ON");

        // Run all table creation in a single transaction
        const createTables = db.transaction(() => {
            // ── USERS ──────────────────────────────────────────────────────────
            db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id          TEXT PRIMARY KEY,
          name        TEXT NOT NULL,
          email       TEXT UNIQUE NOT NULL,
          phone       TEXT,
          role        TEXT NOT NULL CHECK(role IN ('patient','doctor','admin')),
          created_at  TEXT DEFAULT (datetime('now')),
          updated_at  TEXT DEFAULT (datetime('now'))
        );
      `);

            // ── PATIENT PROFILES ───────────────────────────────────────────────
            db.exec(`
        CREATE TABLE IF NOT EXISTS patient_profiles (
          id               TEXT PRIMARY KEY,
          user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          blood_group      TEXT,
          date_of_birth    TEXT,
          gender           TEXT,
          height_cm        REAL,
          weight_kg        REAL,
          allergies        TEXT DEFAULT '[]',   -- JSON array
          emergency_contact_name  TEXT,
          emergency_contact_phone TEXT,
          current_meds     TEXT DEFAULT '[]',   -- JSON array
          conditions       TEXT DEFAULT '[]',   -- JSON array
          created_at       TEXT DEFAULT (datetime('now')),
          updated_at       TEXT DEFAULT (datetime('now'))
        );
      `);

            // ── DOCTOR PROFILES ────────────────────────────────────────────────
            db.exec(`
        CREATE TABLE IF NOT EXISTS doctor_profiles (
          id             TEXT PRIMARY KEY,
          user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          specialization TEXT,
          license_number TEXT,
          hospital       TEXT,
          created_at     TEXT DEFAULT (datetime('now'))
        );
      `);

            // ── MEDICAL RECORDS (reports uploaded by patients/doctors) ─────────
            db.exec(`
        CREATE TABLE IF NOT EXISTS medical_records (
          id             TEXT PRIMARY KEY,
          patient_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          uploaded_by    TEXT NOT NULL REFERENCES users(id),
          title          TEXT NOT NULL,
          description    TEXT,
          file_path      TEXT,
          file_type      TEXT,
          ai_summary     TEXT,           -- AI-generated plain-language summary
          ai_status      TEXT DEFAULT 'pending' CHECK(ai_status IN ('pending','processing','done','failed')),
          record_type    TEXT DEFAULT 'general',
          created_at     TEXT DEFAULT (datetime('now'))
        );
      `);

            // ── PRESCRIPTIONS ──────────────────────────────────────────────────
            db.exec(`
        CREATE TABLE IF NOT EXISTS prescriptions (
          id             TEXT PRIMARY KEY,
          patient_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          doctor_id      TEXT NOT NULL REFERENCES users(id),
          medicines      TEXT NOT NULL DEFAULT '[]',   -- JSON array
          notes          TEXT,
          diagnosis      TEXT,
          valid_until    TEXT,
          created_at     TEXT DEFAULT (datetime('now'))
        );
      `);

            // ── MEDICATION REMINDERS ───────────────────────────────────────────
            db.exec(`
        CREATE TABLE IF NOT EXISTS medication_reminders (
          id             TEXT PRIMARY KEY,
          patient_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          medicine_name  TEXT NOT NULL,
          dosage         TEXT,
          frequency      TEXT,                -- e.g. 'daily', 'twice_daily'
          reminder_times TEXT DEFAULT '[]',   -- JSON array of "HH:MM" strings
          is_active      INTEGER DEFAULT 1,
          created_at     TEXT DEFAULT (datetime('now'))
        );
      `);

            // ── QR ACCESS TOKENS (temporary emergency access) ──────────────────
            db.exec(`
        CREATE TABLE IF NOT EXISTS qr_tokens (
          id             TEXT PRIMARY KEY,
          patient_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token          TEXT UNIQUE NOT NULL,
          expires_at     TEXT NOT NULL,
          is_permanent   INTEGER DEFAULT 0,
          created_at     TEXT DEFAULT (datetime('now'))
        );
      `);

            // ── VITALS LOG ─────────────────────────────────────────────────────
            db.exec(`
        CREATE TABLE IF NOT EXISTS vitals (
          id             TEXT PRIMARY KEY,
          patient_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          bp_systolic    INTEGER,
          bp_diastolic   INTEGER,
          blood_sugar    REAL,
          weight_kg      REAL,
          heart_rate     INTEGER,
          spo2           REAL,
          temperature    REAL,
          notes          TEXT,
          recorded_at    TEXT DEFAULT (datetime('now'))
        );
      `);

            // ── APPOINTMENTS ───────────────────────────────────────────────────
            db.exec(`
        CREATE TABLE IF NOT EXISTS appointments (
          id             TEXT PRIMARY KEY,
          patient_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          doctor_id      TEXT NOT NULL REFERENCES users(id),
          scheduled_at   TEXT NOT NULL,
          status         TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','cancelled','done')),
          notes          TEXT,
          created_at     TEXT DEFAULT (datetime('now'))
        );
      `);
        });

        createTables();

        console.log(`✅ [DB] SQLite connected: ${DB_PATH}`);
        return db;
    } catch (err) {
        console.error("❌ [DB] Failed to initialize database:", err.message);
        // Don't crash — let the app run so you can see the error in logs
        // but flag db as null so routes can return proper errors
        db = null;
        return null;
    }
}

function getDB() {
    if (!db) {
        console.error("❌ [DB] Database not initialized. Call initDB() first.");
        return null;
    }
    return db;
}

module.exports = { initDB, getDB };