// src/config/ai.js
// All OpenRouter API calls go through here — single point of failure/debug

const axios = require("axios");

const BASE_URL =
    process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";
const API_KEY = process.env.OPENROUTER_API_KEY || "";

/**
 * Send a prompt to OpenRouter and get a text response back.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} options - override model, max_tokens etc.
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
async function callAI(systemPrompt, userPrompt, options = {}) {
    if (!API_KEY || API_KEY === "your_openrouter_api_key_here") {
        console.warn("⚠️  [AI] OPENROUTER_API_KEY not set. Returning mock response.");
        return {
            success: true,
            data: "[AI_MOCK] AI summary unavailable — please set OPENROUTER_API_KEY in .env",
            mock: true,
        };
    }

    try {
        const response = await axios.post(
            `${BASE_URL}/chat/completions`,
            {
                model: options.model || MODEL,
                max_tokens: options.max_tokens || 1024,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://medivault.app",
                    "X-Title": "MediVault",
                },
                timeout: 30000, // 30s timeout
            }
        );

        const text = response.data?.choices?.[0]?.message?.content;
        if (!text) {
            throw new Error("Empty response from AI");
        }

        return { success: true, data: text };
    } catch (err) {
        const errMsg =
            err?.response?.data?.error?.message || err.message || "Unknown AI error";
        console.error("❌ [AI] OpenRouter call failed:", errMsg);
        return { success: false, error: errMsg };
    }
}

// Pre-built AI helpers used across controllers

async function explainMedicalReport(reportText) {
    return callAI(
        `You are a friendly medical assistant. Explain medical reports in simple, 
     easy-to-understand language that a non-medical person can understand. 
     Be empathetic, clear, and highlight anything that needs attention. 
     Use bullet points. Keep it under 300 words.`,
        `Please explain this medical report in simple terms:\n\n${reportText}`
    );
}

async function analyzeMedicineSideEffects(medicineName) {
    return callAI(
        `You are a pharmacist assistant. Give clear, concise information about medicines. 
     Use bullet points. Keep response under 250 words.`,
        `What are the common side effects and precautions for: ${medicineName}`
    );
}

async function triageSymptoms(symptoms) {
    return callAI(
        `You are a basic health triage assistant. Based on symptoms, suggest possible 
     conditions and whether the person should see a doctor urgently, soon, or can 
     monitor at home. Always recommend consulting a real doctor. 
     NEVER diagnose definitively. Keep under 250 words.`,
        `Patient symptoms: ${symptoms}`
    );
}

module.exports = { callAI, explainMedicalReport, analyzeMedicineSideEffects, triageSymptoms };