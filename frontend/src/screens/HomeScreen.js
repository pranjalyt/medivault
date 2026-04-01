// src/screens/HomeScreen.js
import React, { useContext, useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { UsersAPI } from "../services/api";
import { Card, Button, Badge, colors, SectionHeader, Loader, ErrorBanner } from "../components/ui";
import { AppContext } from "../../App";

export default function HomeScreen({ navigation }) {
    const { currentUser, setCurrentUser } = useContext(AppContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "", role: "patient" });

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        setError(null);
        const res = await UsersAPI.getAll();
        if (res.success) setUsers(res.data);
        else setError(res.error);
        setLoading(false);
    }

    async function createUser() {
        if (!form.name || !form.email) return Alert.alert("Error", "Name and email are required");
        setLoading(true);
        const res = await UsersAPI.create(form);
        if (res.success) {
            Alert.alert("✅ Done", `${form.role} created!`);
            setShowCreate(false);
            setForm({ name: "", email: "", phone: "", role: "patient" });
            fetchUsers();
        } else {
            Alert.alert("Error", res.error);
        }
        setLoading(false);
    }

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Hero */}
                <View style={styles.hero}>
                    <Text style={styles.heroTitle}>MediVault 🏥</Text>
                    <Text style={styles.heroSub}>
                        {currentUser ? `Logged in as ${currentUser.name}` : "Select a user to get started"}
                    </Text>
                </View>

                {error && <ErrorBanner message={error} onRetry={fetchUsers} />}

                {/* Active user */}
                {currentUser && (
                    <Card style={{ borderLeftWidth: 4, borderLeftColor: colors.primary }}>
                        <Text style={styles.label}>Active User</Text>
                        <Text style={styles.userName}>{currentUser.name}</Text>
                        <Text style={styles.userMeta}>{currentUser.email} · {currentUser.role}</Text>
                        <Button title="Clear Selection" variant="ghost" size="sm"
                            onPress={() => setCurrentUser(null)} style={{ marginTop: 8, alignSelf: "flex-start" }} />
                    </Card>
                )}

                {/* Create User */}
                <Button
                    title={showCreate ? "Cancel" : "+ Create User"}
                    variant={showCreate ? "outline" : "primary"}
                    onPress={() => setShowCreate(!showCreate)}
                    style={{ marginBottom: 12 }}
                />

                {showCreate && (
                    <Card>
                        <SectionHeader title="New User" />
                        <TextInput style={styles.input} placeholder="Full Name *" value={form.name}
                            onChangeText={v => setForm({ ...form, name: v })} />
                        <TextInput style={styles.input} placeholder="Email *" value={form.email}
                            onChangeText={v => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
                        <TextInput style={styles.input} placeholder="Phone" value={form.phone}
                            onChangeText={v => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
                        <View style={styles.roleRow}>
                            {["patient", "doctor", "admin"].map(r => (
                                <TouchableOpacity key={r}
                                    style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
                                    onPress={() => setForm({ ...form, role: r })}>
                                    <Text style={[styles.roleBtnText, form.role === r && { color: colors.white }]}>{r}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Button title="Create User" onPress={createUser} loading={loading} style={{ marginTop: 8 }} />
                    </Card>
                )}

                {/* User List */}
                <SectionHeader title="All Users" subtitle={`${users.length} registered`} />
                {loading && !showCreate && <Loader />}
                {users.map(u => (
                    <Card key={u.id}>
                        <View style={styles.userRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.userName}>{u.name}</Text>
                                <Text style={styles.userMeta}>{u.email}</Text>
                            </View>
                            <Badge label={u.role}
                                type={u.role === "doctor" ? "info" : u.role === "patient" ? "success" : "warning"} />
                        </View>
                        <Button title="Select this user" variant="outline" size="sm"
                            onPress={() => { setCurrentUser(u); Alert.alert("✅", `${u.name} selected`); }}
                            style={{ marginTop: 8 }} />
                    </Card>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 16 },
    hero: { backgroundColor: colors.primary, borderRadius: 16, padding: 20, marginBottom: 20 },
    heroTitle: { fontSize: 26, fontWeight: "800", color: colors.white },
    heroSub: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 },
    label: { fontSize: 11, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 },
    userName: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: 2 },
    userMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    userRow: { flexDirection: "row", alignItems: "center" },
    input: {
        borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
        color: colors.text, backgroundColor: colors.white, marginBottom: 10,
    },
    roleRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
    roleBtn: {
        flex: 1, paddingVertical: 8, borderRadius: 8,
        borderWidth: 1.5, borderColor: colors.border, alignItems: "center",
    },
    roleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    roleBtnText: { fontSize: 13, fontWeight: "600", color: colors.text, textTransform: "capitalize" },
});