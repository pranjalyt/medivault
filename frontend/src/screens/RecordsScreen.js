// src/screens/RecordsScreen.js
import React, { useContext, useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RecordsAPI } from "../services/api";
import { Card, Button, Badge, colors, SectionHeader, Loader, EmptyState, ErrorBanner } from "../components/ui";
import { AppContext } from "../../App";

export default function RecordsScreen() {
    const { currentUser } = useContext(AppContext);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (currentUser) fetchRecords();
    }, [currentUser]);

    async function fetchRecords() {
        setLoading(true);
        setError(null);
        const res = await RecordsAPI.getByUser(currentUser.id);
        if (res.success) setRecords(res.data);
        else setError(res.error);
        setLoading(false);
    }

    const handleUploadSim = () => {
        Alert.alert("Upload", "In a real app, this opens the file picker. For this hackathon, we'll simulate a successful upload.");
        // Logic to call RecordsAPI.upload would go here
    };

    if (!currentUser) return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <EmptyState title="No User Selected" subtitle="Please select a user on the Home screen to view records." />
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <View style={styles.header}>
                <SectionHeader title="Medical Records" subtitle={`Managing files for ${currentUser.name}`} />
                <Button title="Upload New" size="sm" onPress={handleUploadSim} />
            </View>

            {error && <ErrorBanner message={error} onRetry={fetchRecords} />}

            <ScrollView contentContainerStyle={styles.scroll}>
                {loading ? <Loader message="Fetching records..." /> : (
                    records.length === 0 ? (
                        <EmptyState title="No records found" subtitle="Upload a blood report or prescription to start." />
                    ) : (
                        records.map(record => (
                            <Card key={record.id}>
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.recordTitle}>{record.filename || "Medical Report"}</Text>
                                        <Text style={styles.date}>{new Date(record.created_at).toLocaleDateString()}</Text>
                                    </View>
                                    <Badge label="Verified" type="success" />
                                </View>

                                {record.ai_summary && (
                                    <View style={styles.aiBox}>
                                        <Text style={styles.aiLabel}>✨ AI Summary</Text>
                                        <Text style={styles.aiText}>{record.ai_summary}</Text>
                                    </View>
                                )}
                                <Button title="View Full Report" variant="outline" size="sm" style={{ marginTop: 12 }} />
                            </Card>
                        ))
                    )
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    scroll: { padding: 16 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    recordTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    date: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    aiBox: { marginTop: 12, padding: 12, backgroundColor: colors.primaryLight, borderRadius: 8 },
    aiLabel: { fontSize: 11, fontWeight: "800", color: colors.primary, marginBottom: 4, textTransform: "uppercase" },
    aiText: { fontSize: 13, color: colors.text, lineHeight: 18 },
});