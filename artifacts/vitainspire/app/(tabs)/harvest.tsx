import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionCard } from "@/components/ActionCard";
import { PhotoSlot } from "@/components/PhotoSlot";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SyncButton } from "@/components/SyncButton";
import { useColors } from "@/hooks/useColors";
import {
  getFarmerPhoto,
  getHarvestFields,
  getHarvestRecords,
  HarvestField,
  HarvestRecord,
  setFarmerPhoto,
} from "@/lib/storage";

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

export default function HarvestTab() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [farmerPhoto, setFarmerPhotoState] = useState<string | null>(null);
  const [hasContinued, setHasContinued] = useState(false);
  const [fields, setFields] = useState<HarvestField[]>([]);
  const [records, setRecords] = useState<HarvestRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([
        getFarmerPhoto(),
        getHarvestFields(),
        getHarvestRecords(),
      ]).then(([fp, hf, hr]) => {
        if (!alive) return;
        setFarmerPhotoState(fp);
        setFields(hf);
        setRecords(hr);
        if (fp) setHasContinued(true);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 8;
  const bottomPad = isWeb ? 100 : insets.bottom + 100;

  const onSavePhoto = async (uri: string | null) => {
    setFarmerPhotoState(uri);
    await setFarmerPhoto(uri);
  };

  if (!hasContinued) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingBottom: bottomPad,
          paddingHorizontal: 20,
          gap: 22,
        }}
      >
        <View style={{ gap: 6 }}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            HARVEST
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Capture the farmer
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Take a quick photo to associate this session with the farmer in the
            field.
          </Text>
        </View>

        <PhotoSlot
          label="Capture Farmer Photo"
          uri={farmerPhoto}
          onChange={onSavePhoto}
        />

        <PrimaryButton
          title="Continue"
          icon="arrow-right"
          disabled={!farmerPhoto}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            setHasContinued(true);
          }}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: topPad,
        paddingBottom: bottomPad,
        paddingHorizontal: 20,
        gap: 22,
      }}
    >
      <View style={styles.farmerHeader}>
        <Pressable
          onPress={() => setHasContinued(false)}
          style={({ pressed }) => [
            styles.farmerAvatar,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
              borderRadius: 30,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {farmerPhoto ? (
            <Image
              source={{ uri: farmerPhoto }}
              style={{ width: 60, height: 60, borderRadius: 30 }}
            />
          ) : (
            <Feather name="user" size={26} color={colors.mutedForeground} />
          )}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.farmerLabel, { color: colors.mutedForeground }]}>
            Today&apos;s session
          </Text>
          <Text style={[styles.farmerName, { color: colors.foreground }]}>
            Field visit in progress
          </Text>
        </View>
        <SyncButton />
      </View>

      <View style={{ gap: 12 }}>
        <ActionCard
          icon="map-pin"
          title="Start New Field Visit"
          description="Setup, health check and photo capture"
          variant="primary"
          onPress={() => router.push("/harvest/new-visit")}
        />
        <ActionCard
          icon="bar-chart-2"
          title="Record Harvest Data"
          description="Log harvest weight and output type"
          onPress={() => router.push("/harvest/record")}
        />
      </View>

      <View style={{ gap: 12 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Recent fields
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
            <Feather name="map" size={26} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No fields yet
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              Start a new field visit to record your first plot.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {fields.slice(0, 6).map((f) => {
              const matchingRecord = records.find(
                (r) => r.harvestFieldId === f.id,
              );
              return (
                <View
                  key={f.id}
                  style={[
                    styles.fieldCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.fieldIcon,
                      {
                        backgroundColor: colors.muted,
                        borderRadius: colors.radius - 4,
                      },
                    ]}
                  >
                    <Feather
                      name="map-pin"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.fieldTitle, { color: colors.foreground }]}
                    >
                      {f.cropType || "Untitled crop"} · {f.fieldArea || "—"} acres
                    </Text>
                    <Text
                      style={[styles.fieldSub, { color: colors.mutedForeground }]}
                    >
                      {relTime(f.createdAt)}
                      {matchingRecord
                        ? ` · ${matchingRecord.weightKg} kg ${matchingRecord.output}`
                        : ""}
                    </Text>
                  </View>
                  <Feather
                    name={matchingRecord ? "check-circle" : "circle"}
                    size={18}
                    color={matchingRecord ? colors.success : colors.border}
                  />
                </View>
              );
            })}
          </View>
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
  farmerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  farmerAvatar: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
  },
  farmerLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  farmerName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
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
  fieldCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  fieldIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  fieldSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
