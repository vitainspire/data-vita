import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChipGroup } from "@/components/ChipGroup";
import { PhotoSlot } from "@/components/PhotoSlot";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StepHeader } from "@/components/StepHeader";
import { useToast } from "@/components/Toast";
import { useColors } from "@/hooks/useColors";
import { ChoppedField, ChoppedZoneData, makeId, saveField } from "@/lib/storage";
import { scheduleSync } from "@/lib/sync";

const EMPTY_ZONE: ChoppedZoneData = {
  photo: null,
  chopLength: null,
  uniformity: null,
  materialQuality: null,
  moisture: null,
};

const ZONES: Array<{ key: "A" | "B" | "C"; title: string; subtitle: string }> = [
  { key: "A", title: "Zone A", subtitle: "Best area of the field" },
  { key: "B", title: "Zone B", subtitle: "Average area of the field" },
  { key: "C", title: "Zone C", subtitle: "Weakest area of the field" },
];

export default function ChoppedScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ fieldCode?: string }>();
  const fieldCode = String(params.fieldCode || "");
  const [step, setStep] = useState(0);
  const [zoneA, setZoneA] = useState<ChoppedZoneData>({ ...EMPTY_ZONE });
  const [zoneB, setZoneB] = useState<ChoppedZoneData>({ ...EMPTY_ZONE });
  const [zoneC, setZoneC] = useState<ChoppedZoneData>({ ...EMPTY_ZONE });
  const [saving, setSaving] = useState(false);

  const zones = [zoneA, zoneB, zoneC];
  const setters = [setZoneA, setZoneB, setZoneC];
  const current = zones[step];
  const setCurrent = setters[step];
  const meta = ZONES[step];

  const updateZone = (patch: Partial<ChoppedZoneData>) =>
    setCurrent({ ...current, ...patch });

  const onNext = async () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    if (!fieldCode) return;
    setSaving(true);
    try {
      const record: ChoppedField = {
        id: makeId(),
        fieldCode,
        stage: "chopped",
        createdAt: Date.now(),
        zoneA,
        zoneB,
        zoneC,
      };
      await saveField(record);
      scheduleSync("chopped");
      toast.show("Chopped capture saved");
      router.back();
    } catch (e) {
      toast.show("Save failed – please try again");
    } finally {
      setSaving(false);
    }
  };

  const isWeb = Platform.OS === "web";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: isWeb ? 60 : insets.bottom + 40,
        gap: 22,
      }}
    >
      {fieldCode ? (
        <Text style={[styles.eyebrow, { color: colors.accent }]}>
          {fieldCode}
        </Text>
      ) : null}

      <StepHeader
        step={step + 1}
        total={3}
        title={meta.title}
        subtitle={meta.subtitle}
      />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Chopped Material
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
          Photograph chopped material and rate quality for this zone.
        </Text>
      </View>

      <PhotoSlot
        label="Chopped Material Photo"
        uri={current.photo}
        onChange={(uri) => updateZone({ photo: uri })}
      />

      <View style={{ gap: 18 }}>
        <ChipGroup
          label="Chop Length"
          options={["Fine", "Medium", "Coarse"]}
          value={current.chopLength}
          onChange={(val) => updateZone({ chopLength: val })}
        />
        <ChipGroup
          label="Uniformity"
          options={["Uniform", "Mixed", "Uneven"]}
          value={current.uniformity}
          onChange={(val) => updateZone({ uniformity: val })}
        />
        <ChipGroup
          label="Material Quality"
          options={["Good", "Fair", "Poor"]}
          value={current.materialQuality}
          onChange={(val) => updateZone({ materialQuality: val })}
        />
        <ChipGroup
          label="Moisture"
          options={["Dry", "Normal", "Wet"]}
          value={current.moisture}
          onChange={(val) => updateZone({ moisture: val })}
        />
      </View>

      <PrimaryButton
        title={step < 2 ? "Next Zone" : "Save Capture"}
        onPress={onNext}
        loading={saving}
        disabled={false}
        icon={step < 2 ? "arrow-right" : "check"}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  section: { gap: 4 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
