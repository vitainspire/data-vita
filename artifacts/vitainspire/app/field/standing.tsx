import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PhotoSlot } from "@/components/PhotoSlot";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useToast } from "@/components/Toast";
import { useColors } from "@/hooks/useColors";
import { makeId, saveField, StandingField } from "@/lib/storage";

export default function StandingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [plant, setPlant] = useState<string | null>(null);
  const [leaf, setLeaf] = useState<string | null>(null);
  const [cob, setCob] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = !!plant || !!leaf || !!cob;

  const onSave = async () => {
    setSaving(true);
    const record: StandingField = {
      id: makeId(),
      stage: "standing",
      createdAt: Date.now(),
      plantPhoto: plant,
      leafPhoto: leaf,
      cobPhoto: cob,
    };
    await saveField(record);
    setSaving(false);
    toast.show("Standing crop captured");
    router.back();
  };

  const isWeb = Platform.OS === "web";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: isWeb ? 60 : insets.bottom + 40,
        gap: 20,
      }}
    >
      <View style={styles.headerWrap}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Standing Crop
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Capture three reference photos for this field.
        </Text>
      </View>

      <PhotoSlot label="Plant Photo" uri={plant} onChange={setPlant} />
      <PhotoSlot label="Leaf Close-up" uri={leaf} onChange={setLeaf} />
      <PhotoSlot label="Cob with Scale" uri={cob} onChange={setCob} />

      <PrimaryButton
        title="Save Field"
        onPress={onSave}
        disabled={!canSave}
        loading={saving}
        icon="check"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerWrap: { gap: 6 },
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
