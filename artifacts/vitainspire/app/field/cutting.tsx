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
import { CuttingField, makeId, saveField, ZoneData } from "@/lib/storage";
import { scheduleSync } from "@/lib/sync";

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
  const params = useLocalSearchParams<{ fieldCode?: string }>();
  const fieldCode = String(params.fieldCode || "");
  const [step, setStep] = useState(0);
  const [zoneA, setZoneA] = useState<ZoneData>({ ...EMPTY_ZONE });
  const [zoneB, setZoneB] = useState<ZoneData>({ ...EMPTY_ZONE });
  const [zoneC, setZoneC] = useState<ZoneData>({ ...EMPTY_ZONE });
  const [harvestMethod, setHarvestMethod] = useState<string | null>(null);
  const [cropCondition, setCropCondition] = useState<string | null>(null);
  const [cuttingHeight, setCuttingHeight] = useState<string | null>(null);
  const [lodging, setLodging] = useState<string | null>(null);
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
      const record: CuttingField = {
        id: makeId(),
        fieldCode,
        stage: "cutting",
        createdAt: Date.now(),
        zoneA,
        zoneB,
        zoneC,
        harvestMethod,
        cropCondition,
        cuttingHeight,
        lodging,
      };
      await saveField(record);
      scheduleSync("cutting");
      toast.show("Cutting capture saved");
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

      {/* General cutting data - shown on all zones */}
      <View style={{ gap: 18 }}>
        <ChipGroup
          label="Harvest Method"
          options={["Manual", "Machine"]}
          value={harvestMethod}
          onChange={setHarvestMethod}
        />
        <ChipGroup
          label="Crop Condition at Cut"
          options={["Green", "Dry", "Mixed"]}
          value={cropCondition}
          onChange={setCropCondition}
        />
        <ChipGroup
          label="Cutting Height"
          options={["Low", "Medium", "High"]}
          value={cuttingHeight}
          onChange={setCuttingHeight}
        />
        <ChipGroup
          label="Lodging"
          options={["None", "Some", "Heavy"]}
          value={lodging}
          onChange={setLodging}
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
  eyebrow: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
  },
});
