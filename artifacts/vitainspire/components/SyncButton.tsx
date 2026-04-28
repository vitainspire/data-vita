import { Feather } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { triggerSync, useSyncState } from "@/lib/sync";

export function SyncButton() {
  const colors = useColors();
  const { syncing, lastSyncAt, lastError } = useSyncState();

  const dotColor = lastError
    ? colors.destructive
    : lastSyncAt
      ? colors.success
      : colors.mutedForeground;

  const iconColor = lastError
    ? colors.destructive
    : syncing
      ? colors.primary
      : lastSyncAt
        ? colors.primary
        : colors.mutedForeground;

  const label = syncing
    ? "Syncing…"
    : lastError
      ? "Sync failed"
      : lastSyncAt
        ? "Synced"
        : "Sync";

  return (
    <Pressable
      onPress={() => !syncing && triggerSync("full")}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius / 1.5,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityLabel="Sync data to Google Drive and Sheets"
    >
      <View style={styles.inner}>
        {syncing ? (
          <ActivityIndicator size={16} color={colors.primary} />
        ) : (
          <Feather name="upload-cloud" size={16} color={iconColor} />
        )}
        <Text style={[styles.label, { color: iconColor }]}>{label}</Text>
        {!syncing && (
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
