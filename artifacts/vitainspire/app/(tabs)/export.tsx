import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { isBackupConfigured } from "@/lib/backup";
import { triggerSync, useSyncState } from "@/lib/sync";

export default function ExportTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const sync = useSyncState();
  const configured = isBackupConfigured();

  const s = makeStyles(colors, insets);

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      <View style={s.header}>
        <View style={s.headerIcon}>
          {sync.syncing ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : (
            <Feather name="upload-cloud" size={28} color={colors.primary} />
          )}
        </View>
        <Text style={s.title}>Google Backup</Text>
        <Text style={s.subtitle}>
          {configured
            ? "Data syncs to Google Sheets and Drive every time you save a record."
            : "Set EXPO_PUBLIC_BACKUP_URL in your .env file to enable backup."}
        </Text>
      </View>

      <View style={[s.card, sync.lastError ? s.cardError : null]}>
        <View style={s.row}>
          {sync.syncing ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : sync.lastError ? (
            <Feather name="alert-circle" size={18} color="#e74c3c" />
          ) : sync.lastSyncAt ? (
            <Feather name="check-circle" size={18} color="#27ae60" />
          ) : (
            <Feather name="clock" size={18} color={colors.mutedForeground} />
          )}
          <Text style={[s.statusText, sync.lastError ? s.errorText : null]}>
            {sync.syncing
              ? "Syncing…"
              : sync.lastError
              ? sync.lastError
              : sync.lastSyncAt
              ? "Last synced: " + new Date(sync.lastSyncAt).toLocaleString()
              : configured
              ? "Save a record to trigger the first sync"
              : "Not configured"}
          </Text>
        </View>
      </View>

      {configured ? (
        <Pressable
          onPress={triggerSync}
          disabled={sync.syncing}
          style={({ pressed }) => [
            s.syncBtn,
            { backgroundColor: colors.primary, opacity: pressed || sync.syncing ? 0.7 : 1 },
          ]}
        >
          {sync.syncing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather name="refresh-cw" size={16} color="#fff" />
          )}
          <Text style={s.syncBtnText}>
            {sync.syncing ? "Syncing…" : "Sync Now"}
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>,
  insets: { top: number; bottom: number }
) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    container: {
      paddingTop: insets.top + 20,
      paddingBottom: insets.bottom + 100,
      paddingHorizontal: 16,
      gap: 16,
    },
    header: { alignItems: "center", paddingVertical: 12, gap: 8 },
    headerIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary + "18",
      alignItems: "center",
      justifyContent: "center",
    },
    title: { fontFamily: "Inter_700Bold", fontSize: 22, color: colors.foreground },
    subtitle: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: "center",
      lineHeight: 20,
      paddingHorizontal: 8,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    cardError: { borderColor: "#e74c3c55" },
    row: { flexDirection: "row", alignItems: "center", gap: 10 },
    statusText: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      color: colors.foreground,
      flex: 1,
    },
    errorText: { color: "#e74c3c" },
    syncBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 50,
      borderRadius: colors.radius,
    },
    syncBtnText: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
      color: "#fff",
    },
  });
}
