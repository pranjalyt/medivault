// src/screens/VitalsScreen.js
import React, { useContext, useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { VitalsAPI } from "../services/api";
import { Card, Button, Input, colors, SectionHeader, EmptyState, Loader, ErrorBanner } from "../components/ui";
import { AppContext } from "../../App";

export default function VitalsScreen() {
    const { currentUser } = useContext(AppContext);
    const [vitals, setVitals] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ bp_systolic: "", bp_diastolic: "", blood_sugar: "", weight_kg: "", heart_rate: "", notes: "" });

    useEffect(() => { if (currentUser?.role === "patient") { fetchVitals(); fetchSummary(); } }, [currentUser]);

    async function fetchVitals() {
        setLoading(true); setError(null);
        const res = await VitalsAPI.getByPatient(currentUser.id, 10);
        if (res.success) setVitals(res.data); else setError(res.error);
        setLoading(false);
    }

    async function fetchSummary() {
        const res = await VitalsAPI.getSummary(currentUser.id);
        if (res.success) setSummary(res.data);
    }

    async function logVitals() {
        setLoading(true);
        const body = { patient_id: currentUser.id, ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || undefined])) };
        const res = await VitalsAPI.log(body);
        if (res.success) { Alert.alert("✅", "Vitals logged!"); setShowForm(false); setForm({ bp_systolic: "", bp_diastolic: "", blood_sugar: "", weight_kg: "", heart_rate: "", notes: "" }); fetchVitals(); fetchSummary(); }
        else Alert.alert("Error", res.error);
        setLoading(false);
    }

    if (!currentUser || currentUser.role !== "patient") {
        return <SafeAreaView style={s.container} edges={["bottom"]}><EmptyState icon="📈" title="Select a patient" subtitle="Go to Home tab and select a patient user" /></SafeAreaView>;
    }

    return (
        <SafeAreaView style={s.container} edges={["bottom"]}>
            <ScrollView contentContainerStyle={s.scroll}>
                <SectionHeader title="Vitals Tracker" subtitle={currentUser.name} />
                {error && <ErrorBanner message={error} onRetry={fetchVitals} />}

                {summary?.summary && (
                    <Card>
                        <Text style={s.cardTitle}>📊 Summary (All Time)</Text>
                        <View style={s.summaryGrid}>
                            {[
                                ["Avg BP", summary.summary.avg_bp_systolic ? `${summary.summary.avg_bp_systolic}/${summary.summary.avg_bp_diastolic}` : "—"],
                                ["Avg Sugar", summary.summary.avg_blood_sugar ? `${summary.summary.avg_blood_sugar} mg/dL` : "—"],
                                ["Avg Weight", summary.summary.avg_weight ? `${summary.summary.avg_weight} kg` : "—"],
                                ["Avg HR", summary.summary.avg_heart_rate ? `${summary.summary.avg_heart_rate} bpm` : "—"],
                            ].map(([label, val]) => (
                                <View key={label} style={s.summaryItem}>
                                    <Text style={s.summaryVal}>{val}</Text>
                                    <Text style={s.summaryLabel}>{label}</Text>
                                </View>
                            ))}
                        </View>
                    </Card>
                )}

                <Button title={showForm ? "Cancel" : "+ Log Vitals"} variant={showForm ? "outline" : "primary"}
                    onPress={() => setShowForm(!showForm)} style={{ marginBottom: 12 }} />

                {showForm && (
                    <Card>
                        <Text style={s.cardTitle}>New Entry</Text>
                        <View style={s.row}>
                            <Input label="BP Systolic" placeholder="120" value={form.bp_systolic} onChangeText={v => setForm({ ...form, bp_systolic: v })} keyboardType="numeric" style={{ flex: 1, marginRight: 8 }} />
                            <Input label="BP Diastolic" placeholder="80" value={form.bp_diastolic} onChangeText={v => setForm({ ...form, bp_diastolic: v })} keyboardType="numeric" style={{ flex: 1 }} />
                        </View>
                        <View style={s.row}>
                            <Input label="Blood Sugar (mg/dL)" placeholder="90" value={form.blood_sugar} onChangeText={v => setForm({ ...form, blood_sugar: v })} keyboardType="numeric" style={{ flex: 1, marginRight: 8 }} />
                            <Input label="Weight (kg)" placeholder="70" value={form.weight_kg} onChangeText={v => setForm({ ...form, weight_kg: v })} keyboardType="numeric" style={{ flex: 1 }} />
                        </View>
                        <Input label="Heart Rate (bpm)" placeholder="72" value={form.heart_rate} onChangeText={v => setForm({ ...form, heart_rate: v })} keyboardType="numeric" />
                        <Input label="Notes" placeholder="Any notes..." value={form.notes} onChangeText={v => setForm({ ...form, notes: v })} multiline />
                        <Button title="Save Vitals" onPress={logVitals} loading={loading} />
                    </Card>
                )}

                <SectionHeader title="Recent Entries" subtitle="Last 10 records" />
                {loading && <Loader />}
                {!loading && vitals.length === 0 && <EmptyState icon="📋" title="No vitals logged yet" subtitle="Tap Log Vitals to add your first entry" />}
                {vitals.map(v => (
                    <Card key={v.id}>
                        <Text style={s.date}>{new Date(v.recorded_at).toLocaleString()}</Text>
                        <View style={s.vitalRow}>
                            {v.bp_systolic && <VitalChip label="BP" value={`${v.bp_systolic}/${v.bp_diastolic}`} />}
                            {v.blood_sugar && <VitalChip label="Sugar" value={`${v.blood_sugar}`} />}
                            {v.weight_kg && <VitalChip label="Weight" value={`${v.weight_kg}kg`} />}
                            {v.heart_rate && <VitalChip label="HR" value={`${v.heart_rate}bpm`} />}
                        </View>
                        {v.notes && <Text style={s.notes}>{v.notes}</Text>}
                    </Card>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

function VitalChip({ label, value }) {
    return (
        <View style={{ backgroundColor: colors.primaryLight, borderRadius: 8, padding: 8, marginRight: 8, marginTop: 6 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{label}</Text>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>{value}</Text>
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 16 },
    cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 12 },
    summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    summaryItem: { flex: 1, minWidth: "40%", backgroundColor: colors.background, borderRadius: 10, padding: 12, alignItems: "center" },
    summaryVal: { fontSize: 18, fontWeight: "800", color: colors.primary },
    summaryLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    row: { flexDirection: "row" },
    date: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
    vitalRow: { flexDirection: "row", flexWrap: "wrap" },
    notes: { fontSize: 13, color: colors.textSecondary, marginTop: 8, fontStyle: "italic" },
});