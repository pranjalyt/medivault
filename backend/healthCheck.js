// src/utils/healthCheck.js
// Run with: node src/utils/healthCheck.js
// Verifies DB, tables, and config are all working before you start dev

require("dotenv").config();
const { initDB, getDB } = require("../config/db");

console.log("\n🏥 MediVault Health Check\n" + "─".repeat(40));

// 1. Check env vars
const required = ["PORT", "DB_PATH"];
const optional = ["OPENROUTER_API_KEY", "OPENROUTER_MODEL"];

console.log("\n📋 Environment Variables:");
required.forEach(k => {
    const val = process.env[k];
    console.log(`  ${val ? "✅" : "❌"} ${k}: ${val || "NOT SET"}`);
});
optional.forEach(k => {
    const val = process.env[k];
    console.log(`  ${val && val !== "your_openrouter_api_key_here" ? "✅" : "⚠️ "} ${k}: ${val ? (k.includes("KEY") ? val.slice(0, 8) + "..." : val) : "not set (optional)"}`);
});

// 2. Check DB init
console.log("\n🗄️  Database:");
const db = initDB();
if (!db) {
    console.log("  ❌ DB failed to initialize. Check logs above.");
    process.exit(1);
}
console.log("  ✅ SQLite connected");

// 3. Check all tables exist
const tables = ["users", "patient_profiles", "doctor_profiles", "medical_records",
    "prescriptions", "medication_reminders", "qr_tokens", "vitals", "appointments"];
console.log("\n📊 Tables:");
tables.forEach(table => {
    const exists = db.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
    ).get(table);
    console.log(`  ${exists ? "✅" : "❌"} ${table}`);
});

// 4. Quick insert + read test
console.log("\n🧪 Write Test:");
try {
    db.prepare("CREATE TABLE IF NOT EXISTS _health_test (id TEXT)").run();
    db.prepare("INSERT INTO _health_test VALUES ('ok')").run();
    const row = db.prepare("SELECT * FROM _health_test").get();
    db.prepare("DROP TABLE _health_test").run();
    console.log(`  ✅ Read/write working (got: ${row.id})`);
} catch (e) {
    console.log(`  ❌ Read/write failed: ${e.message}`);
}

console.log("\n" + "─".repeat(40));
console.log("✅ Health check complete. Start server with: npm run dev\n");
process.exit(0);