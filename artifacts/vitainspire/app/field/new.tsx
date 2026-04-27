import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

import { PrimaryButton } from "@/components/PrimaryButton";
import { useToast } from "@/components/Toast";
import { useColors } from "@/hooks/useColors";
import { addField, getFieldList, getNextFieldCode } from "@/lib/storage";

export default function NewFieldScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [taken, setTaken] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const next = await getNextFieldCode();
      const list = await getFieldList();
      setSuggestion(next);
      setTaken(list.map((f) => f.code.toLowerCase()));
      if (!code) setCode(next);
    })();
  }, []);

  const isWeb = Platform.OS === "web";
  const trimmed = code.trim();
  const isDup = taken.includes(trimmed.toLowerCase());
  const valid = trimmed.length >= 3 && !isDup;

  const onCreate = async () => {
    if (!valid) return;
    setSaving(true);
    await addField({ code: trimmed, createdAt: Date.now() });
    setSaving(false);
    toast.show(`Field ${trimmed} created`);
    router.replace(`/field/timeline/${trimmed}`);
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
          Give this plot a unique ID so you can track it across all stages.
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          Field ID
        </Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="AP-KNL-001"
          placeholderTextColor={colors.mutedForeground}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              borderColor: isDup ? "#c0392b" : colors.border,
              color: colors.foreground,
              borderRadius: colors.radius,
            },
          ]}
        />
        {isDup ? (
          <Text style={[styles.helper, { color: "#c0392b" }]}>
            This Field ID already exists.
          </Text>
        ) : (
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>
            Format: STATE-DISTRICT-NUMBER (e.g. AP-KNL-001)
          </Text>
        )}
      </View>

      {suggestion && suggestion !== trimmed ? (
        <Pressable
          onPress={() => setCode(suggestion)}
          style={({ pressed }) => [
            styles.suggestion,
            {
              backgroundColor: colors.muted,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Feather name="zap" size={16} color={colors.primary} />
          <Text
            style={[styles.suggestionText, { color: colors.foreground }]}
          >
            Use suggested: {suggestion}
          </Text>
        </Pressable>
      ) : null}

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
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    height: 52,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.4,
    borderWidth: 1,
  },
  helper: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
