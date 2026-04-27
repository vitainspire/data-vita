import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/PrimaryButton";
import { useToast } from "@/components/Toast";
import { useColors } from "@/hooks/useColors";
import { addField, getNextFieldCode } from "@/lib/storage";

export default function NewFieldScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const next = await getNextFieldCode();
      setCode(next);
    })();
  }, []);

  const isWeb = Platform.OS === "web";
  const trimmedLabel = label.trim();
  const valid = code.length > 0;

  const onCreate = async () => {
    if (!valid) return;
    setSaving(true);
    await addField({
      code,
      createdAt: Date.now(),
      label: trimmedLabel || undefined,
    });
    setSaving(false);
    toast.show(`Field #${code} created`);
    router.replace(`/field/timeline/${code}`);
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
      <View style={{ gap: 6 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Register a new field
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Each field gets a sequential number. Add an optional Field ID to
          remember it later.
        </Text>
      </View>

      <View
        style={[
          styles.numberCard,
          {
            backgroundColor: colors.primary,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Text
          style={[styles.numberLabel, { color: "rgba(255,255,255,0.85)" }]}
        >
          FIELD NUMBER
        </Text>
        <Text style={[styles.numberValue, { color: colors.primaryForeground }]}>
          #{code || "…"}
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Field ID
          </Text>
          <Text style={[styles.optional, { color: colors.mutedForeground }]}>
            optional
          </Text>
        </View>
        <TextInput
          value={label}
          onChangeText={setLabel}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="e.g. AP-KNL-001"
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
        <View style={styles.helperRow}>
          <Feather name="info" size={12} color={colors.mutedForeground} />
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>
            Used as a label only. The field number stays {`#${code || "…"}`}.
          </Text>
        </View>
      </View>

      <PrimaryButton
        title="Create Field"
        icon="plus-circle"
        loading={saving}
        disabled={!valid}
        onPress={onCreate}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  numberCard: {
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 4,
  },
  numberLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4,
  },
  numberValue: {
    fontSize: 44,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  optional: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  input: {
    height: 52,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.4,
    borderWidth: 1,
  },
  helperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  helper: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
