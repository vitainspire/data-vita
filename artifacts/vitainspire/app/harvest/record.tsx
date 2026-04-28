import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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
import { PrimaryButton } from "@/components/PrimaryButton";
import { useToast } from "@/components/Toast";
import { useColors } from "@/hooks/useColors";
import {
  getHarvestFields,
  HarvestField,
  HarvestRecord,
  makeId,
  saveHarvestRecord,
} from "@/lib/storage";
import { scheduleSync } from "@/lib/sync";

export default function RecordHarvestScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const [fields, setFields] = useState<HarvestField[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getHarvestFields().then((f) => {
        if (alive) setFields(f);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const isWeb = Platform.OS === "web";
  const canSave = !!selectedId && weight.trim().length > 0 && !!output;

  const onSubmit = async () => {
    if (!selectedId || !output) return;
    setSaving(true);
    try {
      const record: HarvestRecord = {
        id: makeId(),
        createdAt: Date.now(),
        harvestFieldId: selectedId,
        weightKg: weight,
        output,
      };
      await saveHarvestRecord(record);
      scheduleSync();
      toast.show("Harvest recorded");
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
      <View style={{ gap: 6 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Record Harvest
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Log the harvest weight and output for an existing field.
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          Select Field
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
            <Feather name="map-pin" size={22} color={colors.mutedForeground} />
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              No fields yet. Start a new field visit first.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {fields.map((f) => {
              const selected = selectedId === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setSelectedId(f.id)}
                  style={({ pressed }) => [
                    styles.fieldRow,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                      borderRadius: colors.radius,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Feather
                    name={selected ? "check-circle" : "circle"}
                    size={20}
                    color={
                      selected ? colors.primaryForeground : colors.mutedForeground
                    }
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.fieldTitle,
                        {
                          color: selected
                            ? colors.primaryForeground
                            : colors.foreground,
                        },
                      ]}
                    >
                      {f.cropType || "Untitled"} · {f.fieldArea || "—"} acres
                    </Text>
                    <Text
                      style={[
                        styles.fieldSub,
                        {
                          color: selected
                            ? "rgba(255,255,255,0.85)"
                            : colors.mutedForeground,
                        },
                      ]}
                    >
                      {new Date(f.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          Harvest Weight (kg)
        </Text>
        <TextInput
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="e.g. 1240"
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

      <ChipGroup
        label="Output"
        options={["Grain", "Silage"]}
        value={output}
        onChange={setOutput}
      />

      <PrimaryButton
        title="Submit"
        icon="check"
        loading={saving}
        disabled={!canSave}
        onPress={onSubmit}
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
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    borderWidth: 1,
  },
  empty: {
    padding: 20,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
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
