import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PhotoSlot } from "@/components/PhotoSlot";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StepHeader } from "@/components/StepHeader";
import { useToast } from "@/components/Toast";
import { useColors } from "@/hooks/useColors";
import { makeId, saveField, StandingField, ZoneData } from "@/lib/storage";
import { scheduleSync } from "@/lib/sync";

const EMPTY_ZONE: ZoneData = {
  plantPhoto: null,
  leafPhoto: null,
  cobPhoto: null,
  height: null,
  color: null,
  density: null,
};

const ZONES: Array<{ key: "A" | "B" | "C"; title: string; subtitle: string }> = [
  { key: "A", title: "Zone A", subtitle: "Best area of the field" },
  { key: "B", title: "Zone B", subtitle: "Average area of the field" },
  { key: "C", title: "Zone C", subtitle: "Weakest area of the field" },
];

export default function StandingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ fieldCode?: string }>();
  const fieldCode = String(params.fieldCode || "");
  const [step, setStep] = useState(0);
  const [zoneA, setZoneA] = useState<ZoneData>({ ...EMPTY_ZONE });
  const [zoneB, setZoneB] = useState<ZoneData>({ ...EMPTY_ZONE });
  const [zoneC, setZoneC] = useState<ZoneData>({ ...EMPTY_ZONE });
  const [saving, setSaving] = useState(false);

  const zones = [zoneA, zoneB, zoneC];
  const setters = [setZoneA, setZoneB, setZoneC];
  const current = zones[step];
  const setCurrent = setters[step];
  const meta = ZONES[step];

  const updateZone = (patch: Partial<ZoneData>) =>
    setCurrent({ ...current, ...patch });

  const onNext = async () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    if (!fieldCode) return;
    setSaving(true);
    try {
      const record: StandingField = {
        id: makeId(),
        fieldCode,
        stage: "standing",
        createdAt: Date.now(),
        zoneA,
        zoneB,
        zoneC,
      };
      await saveField(record);
      scheduleSync("standing");
      toast.show("Standing crop captured");
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
          Standing Crop Photos
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
          Capture three reference photos for this zone.
        </Text>
      </View>

      <PhotoSlot 
        label="Plant Photo" 
        uri={current.plantPhoto} 
        onChange={(uri) => updateZone({ plantPhoto: uri })} 
      />
      <PhotoSlot 
        label="Leaf Close-up" 
        uri={current.leafPhoto} 
        onChange={(uri) => updateZone({ leafPhoto: uri })} 
      />
      <PhotoSlot 
        label="Cob with Scale" 
        uri={current.cobPhoto} 
        onChange={(uri) => updateZone({ cobPhoto: uri })} 
      />

      <PrimaryButton
        title={step < 2 ? "Next Zone" : "Save Field"}
        onPress={onNext}
        disabled={false}
        loading={saving}
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
