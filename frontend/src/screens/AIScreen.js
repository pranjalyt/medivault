// src/screens/AIScreen.js
import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AIAPI } from "../services/api";
import { Card, Button, Badge, colors, SectionHeader } from "../components/ui";

const TABS = ["Medicine Info", "Symptom Triage"];

export default function AIScreen() {
    const [activeTab, setActiveTab] = useState(0);
    const [input, setInput] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function runAI() {
        if (!input.trim()) return;
        setLoading(true);
        setResult(null);
        setError(null);

        const res = activeTab === 0
            ? await AIAPI.explainMedicine(input.trim())
            : await AIAPI.triage(input.trim());

        if (res.success) setResult(res.data);
        else setError(res.error);
        setLoading(false);
    }

    function clear() { setInput(""); setResult(null); setError(null); }

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <SectionHeader title="AI Health Assistant" subtitle="Powered by OpenRouter" />

                    {/* Tab switcher */}
                    <View style={styles.tabs}>
                        {TABS.map((t, i) => (
                            <Button key={t} title={t} size="sm"
                                variant={activeTab === i ? "primary" : "outline"}
                                onPress={() => { setActiveTab(i); clear(); }}
                                style={{ flex: 1 }} />
                        ))}
                    </View>

                    <Card>
                        <Text style={styles.label}>
                            {activeTab === 0 ? "Enter medicine name" : "Describe your symptoms"}
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder={activeTab === 0 ? "e.g. Paracetamol, Metformin..." : "e.g. fever, headache, sore throat..."}
                            value={input}
                            onChangeText={setInput}
                            multiline={activeTab === 1}
                            numberOfLines={activeTab === 1 ? 3 : 1}
                            placeholderTextColor={colors.textSecondary}
                        />
                        <View style={styles.btnRow}>
                            <Button title="Ask AI" onPress={runAI} loading={loading} disabled={!input.trim()} style={{ flex: 1 }} />
                            {(result || error) && (
                                <Button title="Clear" variant="outline" onPress={clear} style={{ marginLeft: 8, width: 80 }} />
                            )}
                        </View>
                    </Card>

                    {error && (
                        <Card style={{ backgroundColor: colors.dangerLight }}>
                            <Text style={{ color: colors.danger, fontWeight: "600" }}>❌ Error</Text>
                            <Text style={{ color: colors.danger, marginTop: 4 }}>{error}</Text>
                            <Text style={{ color: colors.danger, fontSize: 12, marginTop: 8 }}>
                                Check your OPENROUTER_API_KEY in backend .env
                            </Text>
                        </Card>
                    )}

                    {result && (
                        <Card>
                            <View style={styles.resultHeader}>
                                <Text style={styles.resultTitle}>
                                    {activeTab === 0 ? "💊 Medicine Info" : "🩺 Triage Result"}
                                </Text>
                                {result.is_mock && <Badge label="Mock — set API key" type="warning" />}
                            </View>

                            {activeTab === 0 && result.medicine && (
                                <Text style={styles.medicineName}>{result.medicine}</Text>
                            )}

                            <Text style={styles.resultText}>
                                {activeTab === 0 ? result.explanation : result.triage}
                            </Text>

                            {activeTab === 1 && (
                                <View style={[styles.disclaimer]}>
                                    <Text style={styles.disclaimerText}>
                                        ⚠️ {result.disclaimer || "This is not a medical diagnosis. Always consult a doctor."}
                                    </Text>
                                </View>
                            )}
                        </Card>
                    )}

                    {/* Example prompts */}
                    {!result && !loading && (
                        <Card style={{ backgroundColor: colors.primaryLight }}>
                            <Text style={[styles.label, { color: colors.primary }]}>Try these examples</Text>
                            {(activeTab === 0
                                ? ["Metformin", "Ibuprofen", "Amoxicillin", "Atorvastatin"]
                                : ["Fever for 3 days with cough", "Sharp chest pain when breathing", "Persistent headache and dizziness"]
                            ).map(ex => (
                                <Button key={ex} title={ex} variant="ghost" size="sm"
                                    onPress={() => setInput(ex)}
                                    style={{ alignSelf: "flex-start", marginTop: 4 }} />
                            ))}
                        </Card>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 16 },
    tabs: { flexDirection: "row", gap: 8, marginBottom: 16 },
    label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 8 },
    input: {
        borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
        color: colors.text, backgroundColor: colors.white, marginBottom: 12,
        textAlignVertical: "top",
    },
    btnRow: { flexDirection: "row" },
    resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    resultTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    medicineName: { fontSize: 14, color: colors.primary, fontWeight: "600", marginBottom: 8 },
    resultText: { fontSize: 14, color: colors.text, lineHeight: 22 },
    disclaimer: { marginTop: 12, padding: 10, backgroundColor: colors.warningLight, borderRadius: 8 },
    disclaimerText: { fontSize: 12, color: colors.warning, lineHeight: 18 },
});