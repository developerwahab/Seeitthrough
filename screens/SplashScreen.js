import React, { useEffect } from "react";
import { View, StyleSheet, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { refreshAll } from "../src/boot/refreshAll";

export default function SplashScreen({ navigation }) {
  const progress = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => { 
    refreshAll("splash");
 
    progress.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(-1, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
 
    const t = setTimeout(() => navigation.replace("Main"), 3900);
    return () => clearTimeout(t);
  }, [navigation]);

  const logoStyle = useAnimatedStyle(() => {
    const opacity = progress.value;
    const translateY = interpolate(progress.value, [0, 1], [12, 0]);
    const baseScale = interpolate(progress.value, [0, 1], [0.9, 1.02]);
    const pulseScale = 1 + pulse.value * 0.02;
    return {
      opacity,
      transform: [{ translateY }, { scale: baseScale * pulseScale }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image
          source={require("../assets/seeitthrough-icon-splash.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logoWrap: { alignItems: "center", justifyContent: "center" },
  logo: { width: 180, height: 180 },
});
