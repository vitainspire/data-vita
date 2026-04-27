import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChipGroup } from "@/components/ChipGroup";
import { PhotoSlot } from "@/components/PhotoSlot";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useToast } from "@/components/Toast";
import { useColors } from "@/hooks/useColors";
import { ChoppedField, makeId, saveField } from "@/lib/storage";

export default function ChoppedScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const params = useLocalSearchParams<{ fieldCode?: string }>();
  const fieldCode = String(params.fieldCode || "");
  const [photo, setPhoto] = useState<string | null>(null);
  const [chopSize, setChopSize] = useState<string | null>(null);
  const [moisture, setMoisture] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = !!fieldCode && (!!photo || !!chopSize || !!moisture);

  const onSave = async () => {
    if (!fieldCode) return;
    setSaving(true);
    const record: ChoppedField = {
      id: makeId(),
      fieldCode,
      stage: "chopped",
      createdAt: Date.now(),
      photo,
      chopSize,
      moisture,
    };
    await saveField(record);
    setSaving(false);
    toast.show("Chopped capture saved");
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
      <View style={styles.headerWrap}>
        {fieldCode ? (
          <Text style={[styles.eyebrow, { color: colors.accent }]}>
            {fieldCode}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: colors.foreground }]}>
          Chopped Stage
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Photograph chopped material and rate quality (optional).
        </Text>
      </View>

      <PhotoSlot
        label="Chopped Material Photo"
        uri={photo}
        onChange={setPhoto}
      />

      <View style={{ gap: 18 }}>
        <ChipGroup
          label="Chop Size"
          options={["Small", "Medium", "Large"]}
          value={chopSize}
          onChange={setChopSize}
        />
        <ChipGroup
          label="Moisture"
          options={["Dry", "Normal", "Wet"]}
          value={moisture}
          onChange={setMoisture}
        />
      </View>

      <PrimaryButton
        title="Save Capture"
        onPress={onSave}
        loading={saving}
        disabled={!canSave}
        icon="check"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerWrap: { gap: 6 },
  eyebrow: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
