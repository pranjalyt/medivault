// src/screens/QRScreen.js
import React, { useContext, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { QRAPI } from "../services/api";
import { Card, Button, Badge, colors, SectionHeader, EmptyState } from "../components/ui";
import { AppContext } from "../../App";

export default function QRScreen() {
    const { currentUser } = useContext(AppContext);
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isPermanent, setIsPermanent] = useState(false);

    async function generateQR() {
        if (!currentUser || currentUser.role !== "patient") {
            return Alert.alert("⚠️", "Select a patient user from Home tab first");
        }
        setLoading(true);
        const res = await QRAPI.generate(currentUser.id, isPermanent, 5);
        if (res.success) {
            setQrData(res.data);
        } else {
            Alert.alert("Error", res.error);
        }
        setLoading(false);
    }

    async function revokeQR() {
        if (!qrData) return;
        Alert.alert("Revoke Token", "Are you sure?", [
            { text: "Cancel" },
            {
                text: "Revoke", style: "destructive",
                onPress: async () => {
                    const res = await QRAPI.revoke(qrData.token_id);
                    if (res.success) { setQrData(null); Alert.alert("✅", "Token revoked"); }
                    else Alert.alert("Error", res.error);
                }
            }
        ]);
    }

    if (!currentUser) {
        return (
            <SafeAreaView style={styles.container} edges={["bottom"]}>
                <EmptyState icon="🔐" title="No user selected" subtitle="Go to Home tab and select a patient" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <SectionHeader title="Emergency QR Access" subtitle="Scan to view emergency medical profile" />

                <Card>
                    <Text style={styles.label}>Patient</Text>
                    <Text style={styles.name}>{currentUser.name}</Text>
                    <Text style={styles.meta}>{currentUser.email}</Text>

                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Permanent QR (no expiry)</Text>
                        <Switch value={isPermanent} onValueChange={setIsPermanent} trackColor={{ true: colors.primary }} />
                    </View>
                    {!isPermanent && (
                        <Text style={styles.note}>⏱ Temporary token expires in 5 minutes — good for emergency situations</Text>
                    )}

                    <Button title="Generate QR Code" onPress={generateQR} loading={loading} style={{ marginTop: 12 }} />
                </Card>

                {qrData && (
                    <Card style={{ alignItems: "center" }}>
                        <Text style={styles.qrTitle}>Scan in Emergency</Text>
                        <View style={styles.qrBox}>
                            <QRCode value={qrData.qr_url} size={200} color={colors.text} backgroundColor="white" />
                        </View>
                        <Badge label={qrData.is_permanent ? "Permanent" : "Expires in 5 min"}
                            type={qrData.is_permanent ? "success" : "warning"} />
                        <Text style={styles.qrUrl} numberOfLines={1}>{qrData.qr_url}</Text>
                        <Text style={styles.expiryText}>Expires: {new Date(qrData.expires_at).toLocaleString()}</Text>
                        <Button title="Revoke Token" variant="danger" size="sm" onPress={revokeQR} style={{ marginTop: 12 }} />
                    </Card>
                )}

                <Card style={{ backgroundColor: colors.warningLight, borderWidth: 0 }}>
                    <Text style={{ color: colors.warning, fontWeight: "700", marginBottom: 4 }}>⚡ How it works</Text>
                    <Text style={{ color: colors.warning, fontSize: 13, lineHeight: 20 }}>
                        1. Generate a QR code{"\n"}
                        2. Save it on your phone or print it on a medical card{"\n"}
                        3. First responders scan it → instantly see blood group, allergies, emergency contacts{"\n"}
                        4. No app needed — it opens in any browser
                    </Text>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 16 },
    label: { fontSize: 11, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 },
    name: { fontSize: 17, fontWeight: "700", color: colors.text, marginTop: 2 },
    meta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14 },
    switchLabel: { fontSize: 14, color: colors.text, fontWeight: "500" },
    note: { fontSize: 12, color: colors.textSecondary, marginTop: 6, lineHeight: 18 },
    qrTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 16 },
    qrBox: {
        padding: 16, backgroundColor: "white", borderRadius: 12, marginBottom: 14,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3
    },
    qrUrl: { fontSize: 11, color: colors.textSecondary, marginTop: 8, maxWidth: 260, textAlign: "center" },
    expiryText: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});