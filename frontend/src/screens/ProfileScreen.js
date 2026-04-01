// src/screens/ProfileScreen.js
import React, { useContext } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Button, colors, SectionHeader, Badge } from "../components/ui";
import { AppContext } from "../../App";

export default function ProfileScreen() {
    const { currentUser, setCurrentUser } = useContext(AppContext);

    if (!currentUser) return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <View style={styles.center}>
                <Text style={styles.emptyText}>No profile data available.</Text>
                <Text style={styles.emptySub}>Switch to Home to select a user.</Text>
            </View>
        </SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarTxt}>{currentUser.name[0]}</Text>
                    </View>
                    <Text style={styles.name}>{currentUser.name}</Text>
                    <Badge label={currentUser.role.toUpperCase()} type="info" />
                </View>

                <SectionHeader title="Account Information" />
                <Card>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{currentUser.email}</Text>
                    </View>
                    <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                        <Text style={styles.infoLabel}>Phone</Text>
                        <Text style={styles.infoValue}>{currentUser.phone || "Not provided"}</Text>
                    </View>
                </Card>

                <SectionHeader title="Security & Preferences" />
                <Card>
                    <Button title="Emergency Contacts" variant="outline" style={styles.menuBtn} />
                    <Button title="Notification Settings" variant="outline" style={styles.menuBtn} />
                    <Button title="Data Privacy" variant="outline" style={styles.menuBtn} />
                </Card>

                <Button
                    title="Logout / Switch User"
                    variant="danger"
                    onPress={() => setCurrentUser(null)}
                    style={{ marginTop: 20 }}
                />

                <Text style={styles.footer}>MediVault v1.0.0 Build 2026</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    avatarContainer: { alignItems: 'center', marginBottom: 30 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarTxt: { color: colors.white, fontSize: 32, fontWeight: 'bold' },
    name: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 6 },
    infoRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' },
    infoLabel: { fontSize: 14, color: colors.textSecondary },
    infoValue: { fontSize: 14, fontWeight: '600', color: colors.text },
    menuBtn: { marginBottom: 8, justifyContent: 'flex-start', paddingLeft: 10 },
    emptyText: { fontSize: 18, fontWeight: '700', color: colors.text },
    emptySub: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
    footer: { textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: 40, marginBottom: 20 }
});