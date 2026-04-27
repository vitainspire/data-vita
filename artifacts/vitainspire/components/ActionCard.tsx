import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  onPress: () => void;
  variant?: "primary" | "default";
};

export function ActionCard({
  icon,
  title,
  description,
  onPress,
  variant = "default",
}: Props) {
  const colors = useColors();
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isPrimary ? colors.primary : colors.card,
          borderColor: isPrimary ? colors.primary : colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: isPrimary
              ? "rgba(255,255,255,0.18)"
              : colors.muted,
            borderRadius: colors.radius - 4,
          },
        ]}
      >
        <Feather
          name={icon}
          size={22}
          color={isPrimary ? colors.primaryForeground : colors.primary}
        />
      </View>
      <View style={styles.textWrap}>
        <Text
          style={[
            styles.title,
            { color: isPrimary ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {title}
        </Text>
        {description ? (
          <Text
            style={[
              styles.desc,
              {
                color: isPrimary
                  ? "rgba(255,255,255,0.85)"
                  : colors.mutedForeground,
              },
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      <Feather
        name="chevron-right"
        size={22}
        color={isPrimary ? colors.primaryForeground : colors.mutedForeground}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    borderWidth: 1,
  },
  iconWrap: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
