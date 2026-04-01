// src/services/api.js
// ALL backend calls go through here — change BASE_URL once, works everywhere

import axios from "axios";

// ⚠️ Change this to your machine's local IP when testing on a physical device
// For emulator: http://10.0.2.2:3000 (Android) or http://localhost:3000 (iOS sim)
const BASE_URL = "http://10.0.2.2:3000";  // Android emulator default

const client = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
});

// ── Request/Response interceptors for logging ─────────────────────────────
client.interceptors.request.use(
    (config) => {
        console.log(`📡 [API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error("📡 [API] Request error:", error.message);
        return Promise.reject(error);
    }
);

client.interceptors.response.use(
    (response) => response,
    (error) => {
        const msg = error?.response?.data?.message || error.message || "Network error";
        console.error(`📡 [API] Error ${error?.response?.status}: ${msg}`);
        // Re-throw with a clean message
        const err = new Error(msg);
        err.status = error?.response?.status;
        err.data = error?.response?.data;
        return Promise.reject(err);
    }
);

// ── Generic helper ────────────────────────────────────────────────────────
async function apiCall(method, url, data = null, params = null) {
    try {
        const res = await client.request({ method, url, data, params });
        return { success: true, data: res.data.data, message: res.data.message };
    } catch (err) {
        return { success: false, error: err.message, status: err.status };
    }
}

// ── Users ─────────────────────────────────────────────────────────────────
export const UsersAPI = {
    create: (body) => apiCall("POST", "/api/users", body),
    getAll: (role) => apiCall("GET", "/api/users", null, role ? { role } : null),
    getById: (id) => apiCall("GET", `/api/users/${id}`),
    update: (id, body) => apiCall("PATCH", `/api/users/${id}`, body),
    updateProfile: (id, body) => apiCall("PATCH", `/api/users/${id}/profile`, body),
    delete: (id) => apiCall("DELETE", `/api/users/${id}`),
};

// ── Medical Records ───────────────────────────────────────────────────────
export const RecordsAPI = {
    upload: async (formData) => {
        try {
            const res = await client.post("/api/records", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return { success: true, data: res.data.data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },
    analyze: (id, report_text) => apiCall("POST", `/api/records/${id}/analyze`, { report_text }),
    getByPatient: (patient_id) => apiCall("GET", "/api/records", null, { patient_id }),
    // ADD THIS LINE FOR THE RECORDS SCREEN
    getByUser: (userId) => apiCall("GET", "/api/records", null, { patient_id: userId }),
    getById: (id) => apiCall("GET", `/api/records/${id}`),
    delete: (id) => apiCall("DELETE", `/api/records/${id}`),
};

// ── QR / Emergency Access ─────────────────────────────────────────────────
export const QRAPI = {
    generate: (patient_id, is_permanent = false, expires_in_minutes = 5) =>
        apiCall("POST", "/api/qr/generate", { patient_id, is_permanent, expires_in_minutes }),
    getEmergencyProfile: (token) => apiCall("GET", `/api/qr/access/${token}`),
    getTokens: (patient_id) => apiCall("GET", `/api/qr/tokens/${patient_id}`),
    revoke: (token_id) => apiCall("DELETE", `/api/qr/tokens/${token_id}`),
};

// ── Vitals ────────────────────────────────────────────────────────────────
export const VitalsAPI = {
    log: (body) => apiCall("POST", "/api/vitals", body),
    getByPatient: (patient_id, limit = 30) =>
        apiCall("GET", "/api/vitals", null, { patient_id, limit }),
    getLatest: (patient_id) => apiCall("GET", `/api/vitals/latest/${patient_id}`),
    getSummary: (patient_id) => apiCall("GET", `/api/vitals/summary/${patient_id}`),
    delete: (id) => apiCall("DELETE", `/api/vitals/${id}`),
};

// ── Prescriptions ─────────────────────────────────────────────────────────
export const PrescriptionsAPI = {
    create: (body) => apiCall("POST", "/api/prescriptions", body),
    getByPatient: (patient_id) =>
        apiCall("GET", "/api/prescriptions", null, { patient_id }),
    getByDoctor: (doctor_id) =>
        apiCall("GET", "/api/prescriptions", null, { doctor_id }),
    getById: (id) => apiCall("GET", `/api/prescriptions/${id}`),
    delete: (id) => apiCall("DELETE", `/api/prescriptions/${id}`),
};

// ── AI ─────────────────────────────────────────────────────────────────────
export const AIAPI = {
    explainMedicine: (medicine_name) =>
        apiCall("POST", "/api/prescriptions/ai/medicine", { medicine_name }),
    triage: (symptoms) =>
        apiCall("POST", "/api/prescriptions/ai/triage", { symptoms }),
};

export default client;