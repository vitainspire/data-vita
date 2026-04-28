import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import {
  ALL_STATES,
  getDistricts,
  getDistrictCode,
  getLocationCode,
  getStateCode,
} from "@/lib/india-locations";
import {
  Field,
  GpsCoords,
  addField,
  getFieldList,
  getNextFieldCode,
} from "@/lib/storage";

// ─── Inline searchable picker ────────────────────────────────
function LocationPicker({
  placeholder,
  options,
  value,
  disabled,
  onChange,
  colors,
}: {
  placeholder: string;
  options: string[];
  value: string | null;
  disabled?: boolean;
  onChange: (v: string) => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, search]);

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
    setSearch("");
  };

  return (
    <View>
      <Pressable
        onPress={() => !disabled && setOpen((o) => !o)}
        style={[
          styles.pickerBtn,
          {
            backgroundColor: disabled ? colors.muted : colors.card,
            borderColor: open ? colors.primary : colors.border,
            borderRadius: colors.radius,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Feather
          name="map-pin"
          size={20}
          color={value ? colors.primary : colors.mutedForeground}
        />
        <Text
          style={[
            styles.pickerText,
            { color: value ? colors.foreground : colors.mutedForeground },
          ]}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.mutedForeground}
        />
      </Pressable>

      {open ? (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <View
            style={[
              styles.dropdownSearch,
              { borderBottomColor: colors.border },
            ]}
          >
            <Feather name="search" size={14} color={colors.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search…"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              style={[styles.dropdownInput, { color: colors.foreground }]}
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            style={{ maxHeight: 220 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {filtered.length === 0 ? (
              <Text
                style={[
                  styles.dropdownEmpty,
                  { color: colors.mutedForeground },
                ]}
              >
                No results
              </Text>
            ) : (
              filtered.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => select(opt)}
                  style={({ pressed }) => [
                    styles.dropdownItem,
                    { borderBottomColor: colors.border },
                    opt === value && {
                      backgroundColor: colors.primary + "18",
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  {opt === value ? (
                    <Feather name="check" size={14} color={colors.primary} />
                  ) : null}
                  <Text
                    style={[
                      styles.dropdownItemText,
                      {
                        color:
                          opt === value ? colors.primary : colors.foreground,
                        fontFamily:
                          opt === value
                            ? "Inter_600SemiBold"
                            : "Inter_400Regular",
                      },
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────
export default function NewFieldScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [code, setCode] = useState("");
  const [state, setState] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [gps, setGps] = useState<GpsCoords | null>(null);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allFields, setAllFields] = useState<Field[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const [next, fields] = await Promise.all([
        getNextFieldCode(),
        getFieldList(),
      ]);
      setCode(next);
      setAllFields(fields);
    })();
  }, []);

  const isWeb = Platform.OS === "web";
  const districts = state ? getDistricts(state) : [];

  const stateCode = state ? getStateCode(state) : "";
  const districtCode = state && district ? getDistrictCode(state, district) : "";
  const locationCode = state && district ? getLocationCode(state, district) : "";

  const onStateChange = (s: string) => {
    setState(s);
    setDistrict(null);
  };

  const captureGps = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        toast.show("Location permission denied");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setGps({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      toast.show("GPS location captured");
    } catch {
      toast.show("Could not get location — try again");
    } finally {
      setLocating(false);
    }
  };

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allFields.filter(
      (f) =>
        f.code.toLowerCase().includes(q) ||
        (f.label?.toLowerCase().includes(q) ?? false),
    );
  }, [query, allFields]);

  const valid = code.length > 0;

  const onCreate = async () => {
    if (!valid) return;
    setSaving(true);
    await addField({
      code,
      createdAt: Date.now(),
      state: state ?? undefined,
      district: district ?? undefined,
      locationCode: locationCode || undefined,
      gps: gps ?? undefined,
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
          Check if the field already exists, then fill in the details below.
        </Text>
      </View>

      {/* ── Search existing fields ── */}
      <View style={{ gap: 10 }}>
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
          Check existing fields
        </Text>
        <View
          style={[
            styles.searchRow,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by number or Field ID…"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        {query.trim().length > 0 ? (
          searchResults.length > 0 ? (
            <View style={{ gap: 8 }}>
              {searchResults.map((f) => (
                <Pressable
                  key={f.code}
                  onPress={() => router.replace(`/field/timeline/${f.code}`)}
                  style={({ pressed }) => [
                    styles.resultCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.resultBadge,
                      {
                        backgroundColor: colors.primary,
                        borderRadius: colors.radius - 4,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.resultBadgeText,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      #{f.code}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.resultName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {f.label || `Field #${f.code}`}
                    </Text>
                    <Text
                      style={[
                        styles.resultSub,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {[f.district, f.state].filter(Boolean).join(", ") ||
                        `Created ${new Date(f.createdAt).toLocaleDateString()}`}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.openPill,
                      {
                        backgroundColor: colors.primary + "18",
                        borderRadius: colors.radius - 4,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.openPillText, { color: colors.primary }]}
                    >
                      Open
                    </Text>
                    <Feather
                      name="arrow-right"
                      size={13}
                      color={colors.primary}
                    />
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View
              style={[
                styles.noResult,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Feather name="search" size={18} color={colors.mutedForeground} />
              <Text
                style={[
                  styles.noResultText,
                  { color: colors.mutedForeground },
                ]}
              >
                No fields match "{query.trim()}" — safe to create a new one.
              </Text>
            </View>
          )
        ) : null}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* ── New field form ── */}
      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
        New field details
      </Text>

      {/* Field number */}
      <View
        style={[
          styles.numberCard,
          { backgroundColor: colors.primary, borderRadius: colors.radius },
        ]}
      >
        <Text style={[styles.numberLabel, { color: "rgba(255,255,255,0.85)" }]}>
          FIELD NUMBER
        </Text>
        <Text style={[styles.numberValue, { color: colors.primaryForeground }]}>
          #{code || "…"}
        </Text>
      </View>



      {/* Location */}
      <View style={{ gap: 12 }}>
        <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
          Location
          <Text style={[styles.optional, { color: colors.mutedForeground }]}>
            {"  "}optional
          </Text>
        </Text>

        <View style={{ gap: 10 }}>
          <LocationPicker
            placeholder="Select state…"
            options={ALL_STATES}
            value={state}
            onChange={onStateChange}
            colors={colors}
          />
          <LocationPicker
            placeholder={state ? "Select district…" : "Select state first"}
            options={districts}
            value={district}
            disabled={!state}
            onChange={setDistrict}
            colors={colors}
          />
        </View>

        {/* Location code badge */}
        {(stateCode || districtCode) ? (
          <View
            style={[
              styles.locCodeCard,
              {
                backgroundColor: colors.primary + "12",
                borderColor: colors.primary + "40",
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.locCodeLabel, { color: colors.mutedForeground }]}>
                LOCATION CODE
              </Text>
              <Text style={[styles.locCodeValue, { color: colors.primary }]}>
                {locationCode || `${stateCode}${districtCode ? `-${districtCode}` : ""}`}
              </Text>
            </View>
            <View style={{ gap: 2, alignItems: "flex-end" }}>
              {stateCode ? (
                <View style={[styles.codePill, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.codePillText, { color: colors.primary }]}>
                    {stateCode} · {state}
                  </Text>
                </View>
              ) : null}
              {districtCode ? (
                <View style={[styles.codePill, { backgroundColor: colors.primary + "10" }]}>
                  <Text style={[styles.codePillText, { color: colors.primary }]}>
                    {districtCode} · {district}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* GPS */}
        <Pressable
          onPress={captureGps}
          disabled={locating}
          style={({ pressed }) => [
            styles.gpsBtn,
            {
              backgroundColor: gps ? colors.primary + "15" : colors.card,
              borderColor: gps ? colors.primary : colors.border,
              borderRadius: colors.radius,
              opacity: pressed || locating ? 0.75 : 1,
            },
          ]}
        >
          {locating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather
              name={gps ? "check-circle" : "navigation"}
              size={18}
              color={gps ? colors.primary : colors.mutedForeground}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.gpsBtnLabel,
                { color: gps ? colors.primary : colors.foreground },
              ]}
            >
              {locating
                ? "Getting location…"
                : gps
                  ? "GPS captured"
                  : "Capture GPS location"}
            </Text>
            {gps ? (
              <Text
                style={[styles.gpsCoords, { color: colors.mutedForeground }]}
              >
                {gps.latitude.toFixed(6)}, {gps.longitude.toFixed(6)}
              </Text>
            ) : null}
          </View>
          {gps ? (
            <Pressable
              onPress={() => setGps(null)}
              hitSlop={10}
              style={{ padding: 4 }}
            >
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </Pressable>
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
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.4,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    height: 64,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    height: "100%",
  },
  resultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  resultBadge: {
    minWidth: 44,
    height: 36,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resultBadgeText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  resultName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  resultSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  openPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  openPillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  noResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderWidth: 1,
  },
  noResultText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  divider: { height: 1 },
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
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
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
  inlineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#e74c3c",
    flex: 1,
    lineHeight: 18,
  },
  helperText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  // Picker
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    height: 64,
    borderWidth: 1,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  dropdown: {
    marginTop: 4,
    borderWidth: 1,
    overflow: "hidden",
  },
  dropdownSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dropdownInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownItemText: {
    fontSize: 15,
  },
  dropdownEmpty: {
    textAlign: "center",
    padding: 20,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  // Location code badge
  locCodeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  locCodeLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  locCodeValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  codePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  codePillText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  // GPS
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
  },
  gpsBtnLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  gpsCoords: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
