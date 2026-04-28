import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

import { ChipGroup } from "@/components/ChipGroup";
import { PhotoSlot } from "@/components/PhotoSlot";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StepHeader } from "@/components/StepHeader";
import { useToast } from "@/components/Toast";
import { useColors } from "@/hooks/useColors";
import {
  getFarmerPhoto,
  HarvestField,
  makeId,
  saveHarvestField,
} from "@/lib/storage";
import { scheduleSync } from "@/lib/sync";

const CROP_TYPES = ["Maize", "Rice", "Wheat", "Sugarcane", "Cotton"];

export default function NewVisitScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [step, setStep] = useState(0);

  const [fieldArea, setFieldArea] = useState("");
  const [cropType, setCropType] = useState<string | null>(null);

  const [plantStand, setPlantStand] = useState<string | null>(null);
  const [pest, setPest] = useState<string | null>(null);
  const [disease, setDisease] = useState<string | null>(null);
  const [rainfall, setRainfall] = useState<string | null>(null);

  const [overview, setOverview] = useState<string | null>(null);
  const [leaf, setLeaf] = useState<string | null>(null);
  const [cob, setCob] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const isWeb = Platform.OS === "web";

  const onAcreWalker = () => {
    const value = (Math.random() * 3 + 0.8).toFixed(1);
    setFieldArea(value);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    toast.show(`Acre walker captured: ${value} acres`);
  };

  const canNext1 = fieldArea.trim().length > 0 && !!cropType;
  const canSave = !!plantStand || !!pest || !!disease || !!rainfall;

  const onSave = async () => {
    setSaving(true);
    try {
      const farmerPhoto = await getFarmerPhoto();
      const record: HarvestField = {
        id: makeId(),
        createdAt: Date.now(),
        fieldArea,
        cropType: cropType || "",
        health: { plantStand, pest, disease, rainfall },
        photos: { overview, leaf, cob },
        farmerPhoto,
      };
      await saveHarvestField(record);
      scheduleSync("harvestField");
      toast.show("Field saved");
      router.back();
    } catch (e) {
      toast.show("Save failed – please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: isWeb ? 60 : insets.bottom + 40,
        gap: 22,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <StepHeader
        title={
          step === 0
            ? "Field setup"
            : step === 1
              ? "Field health"
              : "Photo checklist"
        }
        subtitle={
          step === 0
            ? "Tell us about the plot you're walking"
            : step === 1
              ? "Quick assessment of overall conditions"
              : "Capture three reference photos"
        }
        step={step + 1}
        totalSteps={3}
      />

      {step === 0 ? (
        <View style={{ gap: 18 }}>
          <View style={{ gap: 8 }}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Field Area (acres)
            </Text>
            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={fieldArea}
                  onChangeText={setFieldArea}
                  keyboardType="decimal-pad"
                  placeholder="e.g. 2.5"
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                      borderRadius: colors.radius,
                    },
                  ]}
                />
              </View>
              <Pressable
                onPress={onAcreWalker}
                style={({ pressed }) => [
                  styles.walkerBtn,
                  {
                    backgroundColor: colors.secondary,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Feather name="navigation" size={16} color={colors.primary} />
                <Text
                  style={[
                    styles.walkerText,
                    { color: colors.secondaryForeground },
                  ]}
                >
                  Acre Walker
                </Text>
              </Pressable>
            </View>
          </View>

          <ChipGroup
            label="Crop Type"
            options={CROP_TYPES}
            value={cropType}
            onChange={setCropType}
          />
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ gap: 18 }}>
          <ChipGroup
            label="Plant Stand"
            options={["Good", "Medium", "Poor"]}
            value={plantStand}
            onChange={setPlantStand}
          />
          <ChipGroup
            label="Pest Pressure"
            options={["None", "Mild", "Severe"]}
            value={pest}
            onChange={setPest}
          />
          <ChipGroup
            label="Disease Present"
            options={["Yes", "No"]}
            value={disease}
            onChange={setDisease}
          />
          <ChipGroup
            label="Rainfall"
            options={["Adequate", "Low", "Excess"]}
            value={rainfall}
            onChange={setRainfall}
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={{ gap: 14 }}>
          <PhotoSlot
            label="Field Overview"
            uri={overview}
            onChange={setOverview}
          />
          <PhotoSlot label="Leaf Close-up" uri={leaf} onChange={setLeaf} />
          <PhotoSlot label="Cob with Scale" uri={cob} onChange={setCob} />
        </View>
      ) : null}

      <View style={styles.footer}>
        {step > 0 ? (
          <View style={{ flex: 1 }}>
            <PrimaryButton
              title="Back"
              variant="ghost"
              icon="chevron-left"
              iconPosition="left"
              onPress={() => setStep(step - 1)}
            />
          </View>
        ) : null}
        <View style={{ flex: 1.6 }}>
          {step < 2 ? (
            <PrimaryButton
              title="Next"
              icon="chevron-right"
              disabled={step === 0 ? !canNext1 : false}
              onPress={() => setStep(step + 1)}
            />
          ) : (
            <PrimaryButton
              title="Save Field"
              icon="check"
              loading={saving}
              disabled={!canSave}
              onPress={onSave}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    borderWidth: 1,
  },
  walkerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 48,
  },
  walkerText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
  },
});
