// src/components/ui.js
// Shared reusable components — keeps screens clean

import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput } from "react-native";

// ── Colors ────────────────────────────────────────────────────────────────
export const colors = {
    primary: "#2563EB",
    primaryLight: "#EFF6FF",
    success: "#16A34A",
    successLight: "#DCFCE7",
    danger: "#DC2626",
    dangerLight: "#FEE2E2",
    warning: "#D97706",
    warningLight: "#FEF3C7",
    text: "#1E293B",
    textSecondary: "#64748B",
    border: "#E2E8F0",
    background: "#F8FAFC",
    white: "#FFFFFF",
};

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, style }) {
    return <View style={[styles.card, style]}>{children}</View>;
}

// ── Button ────────────────────────────────────────────────────────────────
export function Button({ title, onPress, loading, disabled, variant = "primary", size = "md", style }) {
    const bgColor = {
        primary: colors.primary,
        danger: colors.danger,
        success: colors.success,
        outline: "transparent",
        ghost: "transparent",
    }[variant] || colors.primary;

    const textColor = ["outline", "ghost"].includes(variant) ? colors.primary : colors.white;
    const borderColor = variant === "outline" ? colors.primary : "transparent";
    const padding = size === "sm" ? 8 : size === "lg" ? 16 : 12;
    const fontSize = size === "sm" ? 13 : size === "lg" ? 17 : 15;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[styles.button, { backgroundColor: bgColor, borderColor, borderWidth: 1.5, paddingVertical: padding, opacity: disabled ? 0.5 : 1 }, style]}
        >
            {loading
                ? <ActivityIndicator color={textColor} size="small" />
                : <Text style={[styles.buttonText, { color: textColor, fontSize }]}>{title}</Text>
            }
        </TouchableOpacity>
    );
}

// ── Input ─────────────────────────────────────────────────────────────────
export function Input({ label, error, ...props }) {
    return (
        <View style={{ marginBottom: 12 }}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[styles.input, error && { borderColor: colors.danger }]}
                placeholderTextColor={colors.textSecondary}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

// ── Badge ─────────────────────────────────────────────────────────────────
export function Badge({ label, type = "info" }) {
    const config = {
        info: { bg: colors.primaryLight, text: colors.primary },
        success: { bg: colors.successLight, text: colors.success },
        danger: { bg: colors.dangerLight, text: colors.danger },
        warning: { bg: colors.warningLight, text: colors.warning },
    }[type] || { bg: colors.primaryLight, text: colors.primary };

    return (
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
            <Text style={[styles.badgeText, { color: config.text }]}>{label}</Text>
        </View>
    );
}

// ── Section Header ────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle }) {
    return (
        <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
    );
}

// ── Loading Spinner ───────────────────────────────────────────────────────
export function Loader({ message = "Loading..." }) {
    return (
        <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loaderText}>{message}</Text>
        </View>
    );
}

// ── Empty State ───────────────────────────────────────────────────────────
export function EmptyState({ icon = "📭", title, subtitle }) {
    return (
        <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>{icon}</Text>
            <Text style={styles.emptyTitle}>{title}</Text>
            {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
        </View>
    );
}

// ── Error Banner ──────────────────────────────────────────────────────────
export function ErrorBanner({ message, onRetry }) {
    return (
        <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>❌ {message}</Text>
            {onRetry && (
                <TouchableOpacity onPress={onRetry}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    button: {
        borderRadius: 10,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: { fontWeight: "600", letterSpacing: 0.3 },
    label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 },
    input: {
        borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 11,
        fontSize: 15, color: colors.text, backgroundColor: colors.white,
    },
    errorText: { fontSize: 12, color: colors.danger, marginTop: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: "flex-start" },
    badgeText: { fontSize: 12, fontWeight: "600" },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
    sectionSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    loader: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    loaderText: { fontSize: 14, color: colors.textSecondary },
    empty: { alignItems: "center", padding: 40, gap: 8 },
    emptyTitle: { fontSize: 17, fontWeight: "600", color: colors.text },
    emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: "center" },
    errorBanner: {
        backgroundColor: colors.dangerLight, padding: 14, borderRadius: 10,
        margin: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center"
    },
    errorBannerText: { color: colors.danger, fontSize: 14, flex: 1 },
    retryText: { color: colors.primary, fontWeight: "600", marginLeft: 8 },
});