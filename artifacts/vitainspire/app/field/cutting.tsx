import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChipGroup } from "@/components/ChipGroup";
import { PhotoSlot } from "@/components/PhotoSlot";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StepHeader } from "@/components/StepHeader";
import { useToast } from "@/components/Toast";
import { useColors } from "@/hooks/useColors";
import { CuttingField, makeId, saveField, ZoneData } from "@/lib/storage";

const EMPTY_ZONE: ZoneData = {
  plantPhoto: null,
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

export default function CuttingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
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
    setSaving(true);
    const record: CuttingField = {
      id: makeId(),
      stage: "cutting",
      createdAt: Date.now(),
      zoneA,
      zoneB,
      zoneC,
    };
    await saveField(record);
    setSaving(false);
    toast.show("Cutting capture saved");
    router.back();
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
      <StepHeader
        title={meta.title}
        subtitle={meta.subtitle}
        step={step + 1}
        totalSteps={3}
      />

      <View style={{ gap: 14 }}>
        <PhotoSlot
          label="Plant Photo"
          uri={current.plantPhoto}
          onChange={(uri) => updateZone({ plantPhoto: uri })}
        />
        <PhotoSlot
          label="Cob Photo"
          uri={current.cobPhoto}
          onChange={(uri) => updateZone({ cobPhoto: uri })}
        />
      </View>

      <View style={{ gap: 18 }}>
        <ChipGroup
          label="Height"
          options={["Tall", "Medium", "Short"]}
          value={current.height}
          onChange={(v) => updateZone({ height: v })}
        />
        <ChipGroup
          label="Color"
          options={["Dark", "Light", "Yellow"]}
          value={current.color}
          onChange={(v) => updateZone({ color: v })}
        />
        <ChipGroup
          label="Density"
          options={["Dense", "Normal", "Sparse"]}
          value={current.density}
          onChange={(v) => updateZone({ density: v })}
        />
      </View>

      <View style={styles.footer}>
        {step > 0 ? (
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title="Back"
              onPress={() => setStep(step - 1)}
              variant="ghost"
              icon="chevron-left"
              iconPosition="left"
            />
          </View>
        ) : null}
        <View style={{ flex: 1.6 }}>
          <PrimaryButton
            title={step < 2 ? `Next: Zone ${ZONES[step + 1].key}` : "Save Field"}
            onPress={onNext}
            loading={saving}
            icon={step < 2 ? "chevron-right" : "check"}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    gap: 10,
  },
});
