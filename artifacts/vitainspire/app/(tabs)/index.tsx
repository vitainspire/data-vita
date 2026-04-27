import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { FieldGroup, FieldStage, getFieldGroups } from "@/lib/storage";

const STAGE_ORDER: Array<{
  key: FieldStage;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}> = [
  { key: "standing", label: "Standing", icon: "feather" },
  { key: "cutting", label: "Cutting", icon: "scissors" },
  { key: "chopped", label: "Chopped", icon: "grid" },
];

function relTime(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export default function FieldCaptureTab() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<FieldGroup[]>([]);
  const [query, setQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getFieldGroups().then((g) => {
        if (alive) setGroups(g);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 8;
  const bottomPad = isWeb ? 100 : insets.bottom + 100;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.code.toLowerCase().includes(q));
  }, [groups, query]);

  const completedCount = (g: FieldGroup) =>
    (g.stages.standing ? 1 : 0) +
    (g.stages.cutting ? 1 : 0) +
    (g.stages.chopped ? 1 : 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: topPad,
        paddingBottom: bottomPad,
        paddingHorizontal: 20,
        gap: 18,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 6 }}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>
          FIELD CAPTURE
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Your fields
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Track each field through Standing, Cutting and Chopped stages.
        </Text>
      </View>

      <View
        style={[
          styles.searchRow,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by Field ID (e.g. AP-KNL-001)"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="characters"
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery("")} hitSlop={10}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={() => router.push("/field/new")}
        style={({ pressed }) => [
          styles.newBtn,
          {
            backgroundColor: colors.primary,
            borderRadius: colors.radius,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <Feather name="plus-circle" size={18} color={colors.primaryForeground} />
        <Text style={[styles.newBtnText, { color: colors.primaryForeground }]}>
          New Field
        </Text>
      </Pressable>

      <View style={{ gap: 10 }}>
        {filtered.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather
              name={query ? "search" : "map"}
              size={28}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {query ? "No matching fields" : "No fields yet"}
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              {query
                ? "Try a different Field ID or clear the search."
                : "Tap “New Field” above to register your first plot."}
            </Text>
          </View>
        ) : (
          filtered.map((g) => {
            const done = completedCount(g);
            return (
              <Pressable
                key={g.code}
                onPress={() => router.push(`/field/timeline/${g.code}`)}
                style={({ pressed }) => [
                  styles.fieldCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.94 : 1,
                  },
                ]}
              >
                <View style={styles.fieldHeader}>
                  <View
                    style={[
                      styles.fieldBadge,
                      {
                        backgroundColor: colors.muted,
                        borderRadius: colors.radius - 4,
                      },
                    ]}
                  >
                    <Feather name="map-pin" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.fieldCode, { color: colors.foreground }]}
                    >
                      {g.code}
                    </Text>
                    <Text
                      style={[
                        styles.fieldMeta,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {done}/3 stages · Updated {relTime(g.lastUpdated)}
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={20}
                    color={colors.mutedForeground}
                  />
                </View>

                <View style={styles.stageRow}>
                  {STAGE_ORDER.map((s) => {
                    const completed = !!g.stages[s.key];
                    return (
                      <View
                        key={s.key}
                        style={[
                          styles.stagePill,
                          {
                            backgroundColor: completed
                              ? colors.primary
                              : colors.muted,
                            borderRadius: colors.radius - 6,
                          },
                        ]}
                      >
                        <Feather
                          name={completed ? "check-circle" : "clock"}
                          size={13}
                          color={
                            completed
                              ? colors.primaryForeground
                              : colors.mutedForeground
                          }
                        />
                        <Text
                          style={[
                            styles.stagePillText,
                            {
                              color: completed
                                ? colors.primaryForeground
                                : colors.mutedForeground,
                            },
                          ]}
                        >
                          {s.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    height: "100%",
  },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
  },
  newBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    padding: 28,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  fieldCard: {
    padding: 16,
    gap: 14,
    borderWidth: 1,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fieldBadge: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldCode: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  fieldMeta: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  stageRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  stagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stagePillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
