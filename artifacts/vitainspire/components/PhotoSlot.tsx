import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  label: string;
  uri: string | null;
  onChange: (uri: string | null) => void;
};

export function PhotoSlot({ label, uri, onChange }: Props) {
  const colors = useColors();
  const [busy, setBusy] = useState(false);

  const pickImage = useCallback(async () => {
    setBusy(true);
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== "granted") {
          const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (lib.status !== "granted") {
            Alert.alert(
              "Permission needed",
              "Please grant camera or photo access to capture field photos.",
            );
            return;
          }
        }
      }

      const useCamera = Platform.OS !== "web";
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            quality: 0.7,
            allowsEditing: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            quality: 0.7,
            allowsEditing: false,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });

      if (!result.canceled && result.assets[0]) {
        if (Platform.OS !== "web") {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onChange(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert("Could not capture photo", "Please try again.");
    } finally {
      setBusy(false);
    }
  }, [onChange]);

  return (
    <Pressable onPress={pickImage} disabled={busy}>
      {({ pressed }) => (
        <View
          style={[
            styles.container,
            {
              borderColor: uri ? "transparent" : colors.border,
              backgroundColor: uri ? colors.card : colors.muted,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          {uri ? (
            <>
              <Image
                source={{ uri }}
                style={[styles.image, { borderRadius: colors.radius }]}
              />
              <View
                style={[
                  styles.retakeBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Feather name="refresh-cw" size={14} color={colors.primaryForeground} />
              </View>
              <View
                style={[
                  styles.checkBadge,
                  { backgroundColor: colors.success },
                ]}
              >
                <Feather name="check" size={14} color="#fff" />
              </View>
            </>
          ) : (
            <View style={styles.empty}>
              {busy ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Feather
                  name="camera"
                  size={26}
                  color={colors.mutedForeground}
                />
              )}
              <Text
                style={[styles.label, { color: colors.mutedForeground }]}
              >
                {label}
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 140,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
    position: "relative",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  retakeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
});
