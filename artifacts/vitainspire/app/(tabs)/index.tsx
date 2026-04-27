import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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
import { FieldRecord, getFields } from "@/lib/storage";

const STAGES: Array<{
  key: "standing" | "cutting" | "chopped";
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

function formatStage(stage: string) {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

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
  const [fields, setFields] = useState<FieldRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getFields().then((f) => {
        if (alive) setFields(f);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 8;
  const bottomPad = isWeb ? 100 : insets.bottom + 100;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: topPad,
        paddingBottom: bottomPad,
        paddingHorizontal: 20,
      }}
    >
      <View style={styles.headerWrap}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>
          FIELD CAPTURE
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          What are you capturing today?
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Choose the lifecycle stage to start a new capture.
        </Text>
      </View>

      <View style={styles.stages}>
        {STAGES.map((stage) => (
          <Pressable
            key={stage.key}
            onPress={() => router.push(stage.route)}
            style={({ pressed }) => [
              styles.stageCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
                opacity: pressed ? 0.92 : 1,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              },
            ]}
          >
            <View
              style={[
                styles.stageIcon,
                {
                  backgroundColor: colors.muted,
                  borderRadius: colors.radius - 4,
                },
              ]}
            >
              <Feather name={stage.icon} size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.stageTitle, { color: colors.foreground }]}>
                {stage.title}
              </Text>
              <Text
                style={[styles.stageDesc, { color: colors.mutedForeground }]}
              >
                {stage.description}
              </Text>
            </View>
            <Feather
              name="chevron-right"
              size={22}
              color={colors.mutedForeground}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.recentWrap}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Recent captures
        </Text>
        {fields.length === 0 ? (
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
            <Feather name="inbox" size={28} color={colors.mutedForeground} />
            <Text
              style={[styles.emptyTitle, { color: colors.foreground }]}
            >
              No captures yet
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              Pick a stage above to start your first field capture.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {fields.slice(0, 8).map((f) => (
              <View
                key={f.id}
                style={[
                  styles.recordCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <View
                  style={[
                    styles.recordIcon,
                    {
                      backgroundColor: colors.muted,
                      borderRadius: colors.radius - 4,
                    },
                  ]}
                >
                  <Feather
                    name={
                      f.stage === "standing"
                        ? "feather"
                        : f.stage === "cutting"
                          ? "scissors"
                          : "grid"
                    }
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.recordTitle, { color: colors.foreground }]}
                  >
                    {formatStage(f.stage)} capture
                  </Text>
                  <Text
                    style={[
                      styles.recordSub,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {relTime(f.createdAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerWrap: {
    gap: 6,
    marginBottom: 22,
  },
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
  stages: {
    gap: 12,
    marginBottom: 28,
  },
  stageCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderWidth: 1,
  },
  stageIcon: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  stageTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  stageDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  recentWrap: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  empty: {
    padding: 24,
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
  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  recordIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  recordTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  recordSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
