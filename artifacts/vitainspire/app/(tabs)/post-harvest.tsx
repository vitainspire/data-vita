import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
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
import { PhotoSlot } from "@/components/PhotoSlot";
import { PrimaryButton } from "@/components/PrimaryButton";
import { StepHeader } from "@/components/StepHeader";
import { useToast } from "@/components/Toast";
import { useColors } from "@/hooks/useColors";
import {
  getHarvestFields,
  getPostHarvestBatches,
  HarvestField,
  makeId,
  PostHarvestBatch,
  savePostHarvestBatch,
} from "@/lib/storage";

export default function PostHarvestTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<HarvestField[]>([]);
  const [batches, setBatches] = useState<PostHarvestBatch[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [batchName, setBatchName] = useState("");

  const [storage, setStorage] = useState<string | null>(null);
  const [crossSection, setCrossSection] = useState<string | null>(null);
  const [sample, setSample] = useState<string | null>(null);
  const [texture, setTexture] = useState<string | null>(null);

  const [ph, setPh] = useState("");
  const [smell, setSmell] = useState<string | null>(null);
  const [mold, setMold] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      Promise.all([getHarvestFields(), getPostHarvestBatches()]).then(
        ([f, b]) => {
          if (!alive) return;
          setFields(f);
          setBatches(b);
        },
      );
      return () => {
        alive = false;
      };
    }, []),
  );

  const isWeb = Platform.OS === "web";
  const topPad = isWeb ? 67 : insets.top + 8;
  const bottomPad = isWeb ? 100 : insets.bottom + 100;

  const reset = () => {
    setStep(0);
    setSelectedId(null);
    setBatchName("");
    setStorage(null);
    setCrossSection(null);
    setSample(null);
    setTexture(null);
    setPh("");
    setSmell(null);
    setMold(null);
  };

  const onSubmit = async () => {
    if (!selectedId) return;
    setSaving(true);
    const batch: PostHarvestBatch = {
      id: makeId(),
      createdAt: Date.now(),
      harvestFieldId: selectedId,
      batchName: batchName || `Batch ${new Date().toLocaleDateString()}`,
      photos: { storage, crossSection, sample, texture },
      ph,
      smell,
      mold,
    };
    await savePostHarvestBatch(batch);
    const updated = await getPostHarvestBatches();
    setBatches(updated);
    setSaving(false);
    toast.show("Silage batch submitted");
    reset();
  };

  const canStep1 = !!selectedId;
  const canStep2 = batchName.trim().length > 0;
  const canSubmit = ph.trim().length > 0 || !!smell || !!mold;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: topPad,
        paddingBottom: bottomPad,
        paddingHorizontal: 20,
        gap: 22,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ gap: 6 }}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>
          POST HARVEST
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Silage batch tracking
        </Text>
      </View>

      <StepHeader
        title={
          step === 0
            ? "Select field"
            : step === 1
              ? "Create silage batch"
              : step === 2
                ? "Capture batch photos"
                : "Quality inputs"
        }
        subtitle={
          step === 0
            ? "Pick the harvested field this batch belongs to"
            : step === 1
              ? "Give this batch a clear name or ID"
              : step === 2
                ? "Storage, cross section, sample, texture"
                : "pH, smell and mold check"
        }
        step={step + 1}
        totalSteps={4}
      />

      {step === 0 ? (
        fields.length === 0 ? (
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
            <Feather name="archive" size={26} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No fields available
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              Create a harvest field first from the Harvest tab.
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
                      selected
                        ? colors.primaryForeground
                        : colors.mutedForeground
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
                      Field ID · {f.id.slice(0, 8)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )
      ) : null}

      {step === 1 ? (
        <View style={{ gap: 8 }}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Batch Name / ID
          </Text>
          <TextInput
            value={batchName}
            onChangeText={setBatchName}
            placeholder="e.g. Silage-A-2026-04"
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
      ) : null}

      {step === 2 ? (
        <View style={{ gap: 14 }}>
          <PhotoSlot
            label="Storage Overview"
            uri={storage}
            onChange={setStorage}
          />
          <PhotoSlot
            label="Cross Section"
            uri={crossSection}
            onChange={setCrossSection}
          />
          <PhotoSlot label="Sample Bag" uri={sample} onChange={setSample} />
          <PhotoSlot label="Texture" uri={texture} onChange={setTexture} />
        </View>
      ) : null}

      {step === 3 ? (
        <View style={{ gap: 18 }}>
          <View style={{ gap: 8 }}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              pH
            </Text>
            <TextInput
              value={ph}
              onChangeText={setPh}
              keyboardType="decimal-pad"
              placeholder="e.g. 4.2"
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
            label="Smell"
            options={["Sweet", "Neutral", "Sour"]}
            value={smell}
            onChange={setSmell}
          />
          <ChipGroup
            label="Mold"
            options={["None", "Mild", "Severe"]}
            value={mold}
            onChange={setMold}
          />
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
          {step < 3 ? (
            <PrimaryButton
              title="Next"
              icon="chevron-right"
              disabled={
                step === 0 ? !canStep1 : step === 1 ? !canStep2 : false
              }
              onPress={() => setStep(step + 1)}
            />
          ) : (
            <PrimaryButton
              title="Submit"
              icon="check"
              loading={saving}
              disabled={!canSubmit}
              onPress={onSubmit}
            />
          )}
        </View>
      </View>

      {batches.length > 0 ? (
        <View style={{ gap: 12, marginTop: 8 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent batches
          </Text>
          <View style={{ gap: 10 }}>
            {batches.slice(0, 6).map((b) => (
              <View
                key={b.id}
                style={[
                  styles.fieldRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <View
                  style={[
                    styles.batchIcon,
                    {
                      backgroundColor: colors.muted,
                      borderRadius: colors.radius - 4,
                    },
                  ]}
                >
                  <Feather name="archive" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.fieldTitle, { color: colors.foreground }]}
                  >
                    {b.batchName}
                  </Text>
                  <Text
                    style={[
                      styles.fieldSub,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    pH {b.ph || "—"} · {b.smell || "—"} · {b.mold || "—"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    lineHeight: 34,
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
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
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
  footer: {
    flexDirection: "row",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  batchIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
