import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function SplashRoute() {
  const colors = useColors();
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(12)).current;
  const dotScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(dotScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    const t = setTimeout(() => {
      router.replace("/(tabs)");
    }, 1700);

    return () => clearTimeout(t);
  }, [opacity, translate, dotScale, router]);

  return (
    <LinearGradient
      colors={[colors.primary, "#1f4a2a"]}
      style={styles.container}
    >
      <Animated.View
        style={{
          opacity,
          transform: [{ translateY: translate }],
          alignItems: "center",
          gap: 14,
        }}
      >
        <Animated.View
          style={[
            styles.logoCircle,
            {
              backgroundColor: colors.cream,
              transform: [{ scale: dotScale }],
            },
          ]}
        >
          <View style={[styles.leaf, { backgroundColor: colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: colors.accent }]} />
        </Animated.View>
        <Text style={styles.title}>Vitainspire</Text>
        <Text style={styles.tagline}>Smart Farming. Better Yield.</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    overflow: "hidden",
    position: "relative",
  },
  leaf: {
    width: 46,
    height: 46,
    borderTopLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    transform: [{ rotate: "30deg" }],
  },
  dot: {
    position: "absolute",
    bottom: 18,
    right: 22,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  title: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: Platform.OS === "ios" ? 0.2 : 0,
  },
});
