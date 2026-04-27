import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { FieldGroup, FieldStage, getFieldGroup } from "@/lib/storage";

const STAGES: Array<{
  key: FieldStage;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  route: "/field/standing" | "/field/cutting" | "/field/chopped";
}> = [
  {
    key: "standing",
    title: "Standing Crop",
    description: "Capture plant, leaf and cob photos",
    icon: "feather",
    route: "/field/standing",
  },
  {
    key: "cutting",
    title: "Cutting Stage",
    description: "Guided walk across three field zones",
    icon: "scissors",
    route: "/field/cutting",
  },
  {
    key: "chopped",
    title: "Chopped Stage",
    description: "Record chopped material and quality",
    icon: "grid",
    route: "/field/chopped",
  },
];

function fmt(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FieldTimelineScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ code: string }>();
  const code = String(params.code || "");
  const [group, setGroup] = useState<FieldGroup | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getFieldGroup(code).then((g) => {
        if (alive) setGroup(g);
      });
      return () => {
        alive = false;
      };
    }, [code]),
  );

  const isWeb = Platform.OS === "web";

  const completedCount = group
    ? (group.stages.standing ? 1 : 0) +
      (group.stages.cutting ? 1 : 0) +
      (group.stages.chopped ? 1 : 0)
    : 0;
  const progress = (completedCount / 3) * 100;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: isWeb ? 60 : insets.bottom + 40,
        gap: 22,
      }}
    >
      <View style={{ gap: 6 }}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>
          FIELD ID
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {code}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {completedCount}/3 stages completed
        </Text>
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: colors.muted,
              borderRadius: 999,
            },
          ]}
        >
          <View
            style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: colors.primary,
              borderRadius: 999,
            }}
          />
        </View>
      </View>

      <View style={{ position: "relative" }}>
        <View
          style={[
            styles.timelineLine,
            { backgroundColor: colors.border },
          ]}
        />
        <View style={{ gap: 14 }}>
          {STAGES.map((s, idx) => {
            const record = group?.stages[s.key];
            const completed = !!record;
            return (
              <Pressable
                key={s.key}
                onPress={() =>
                  router.push({
                    pathname: s.route,
                    params: { fieldCode: code },
                  })
                }
                style={({ pressed }) => [
                  styles.stageRow,
                  { opacity: pressed ? 0.94 : 1 },
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: completed
                        ? colors.primary
                        : colors.background,
                      borderColor: completed ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={completed ? "check" : s.icon}
                    size={16}
                    color={
                      completed ? colors.primaryForeground : colors.mutedForeground
                    }
                  />
                </View>
                <View
                  style={[
                    styles.stageCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: completed ? colors.primary : colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <View style={styles.stageHeader}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text
                        style={[
                          styles.stageTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        {s.title}
                      </Text>
                      <Text
                        style={[
                          styles.stageDesc,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {s.description}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: completed
                            ? colors.primary
                            : colors.muted,
                          borderRadius: colors.radius - 6,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: completed
                              ? colors.primaryForeground
                              : colors.mutedForeground,
                          },
                        ]}
                      >
                        {completed ? "Completed" : "Pending"}
                      </Text>
                    </View>
                  </View>
                  {record ? (
                    <View
                      style={[
                        styles.metaRow,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      <Feather
                        name="clock"
                        size={13}
                        color={colors.mutedForeground}
                      />
                      <Text
                        style={[
                          styles.metaText,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        Captured {fmt(record.createdAt)}
                      </Text>
                      <View style={{ flex: 1 }} />
                      <Text
                        style={[
                          styles.metaAction,
                          { color: colors.primary },
                        ]}
                      >
                        Re-capture
                      </Text>
                      <Feather
                        name="chevron-right"
                        size={14}
                        color={colors.primary}
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.metaRow,
                        { borderTopColor: colors.border },
                      ]}
                    >
                      <View style={{ flex: 1 }} />
                      <Text
                        style={[
                          styles.metaAction,
                          { color: colors.primary },
                        ]}
                      >
                        Start capture
                      </Text>
                      <Feather
                        name="chevron-right"
                        size={14}
                        color={colors.primary}
                      />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
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
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    lineHeight: 36,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  progressTrack: {
    height: 6,
    overflow: "hidden",
    marginTop: 6,
  },
  timelineLine: {
    position: "absolute",
    left: 17,
    top: 18,
    bottom: 18,
    width: 2,
  },
  stageRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  stageCard: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  stageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stageTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  stageDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  metaAction: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
