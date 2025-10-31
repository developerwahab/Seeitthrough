// navigation/RootNavigator.js
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  createDrawerNavigator,
  useDrawerProgress,
} from "@react-navigation/drawer";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

import HomeScreen from "../screens/HomeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import Sidebar from "../components/Sidebar";
// import CalendarScreen from "../screens/CalendarScreen";
import AnalysisScreen from "../screens/AnalysisScreen";
import AboutScreen from "../screens/AboutScreen";

const About = () => <View style={{ flex: 1, backgroundColor: "#F5F6F8" }} />;
const Reminder = () => <View style={{ flex: 1, backgroundColor: "#F5F6F8" }} />;
const Feedback = () => <View style={{ flex: 1, backgroundColor: "#F5F6F8" }} />;
const Thanks = () => <View style={{ flex: 1, backgroundColor: "#F5F6F8" }} />;

function CardWrapper({ children }) {
  const progress = useDrawerProgress();

  // inside CardWrapper()
  const cardStyle = useAnimatedStyle(() => {
    const tx = interpolate(progress.value, [0, 1], [0, 165]);  
    const ty = interpolate(progress.value, [0, 1], [0, -13]);
    const scale = interpolate(progress.value, [0, 1], [1, 0.8]);
    const rotZ = interpolate(progress.value, [0, 1], [0, -13]);
    const rotY = interpolate(progress.value, [0, 1], [0, 10]);
    const radius = interpolate(progress.value, [0, 1], [0, 50]);

    return {
      transform: [
        { perspective: 1000 },
        { translateX: tx },
        { translateY: ty },
        { scale },
        { translateY: -28 },
        { rotateZ: `${rotZ}deg` },
        { translateY: 28 },
        { rotateY: `${rotY}deg` },
      ],
      borderRadius: radius,
      backgroundColor: "#FFFFFF",
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
      elevation: 32,
      zIndex: 100,
    };
  });
 
  const dimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.04]),
  }));

  return (
    <Animated.View style={[styles.cardContainer, cardStyle]}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.dim, dimStyle]} />
    </Animated.View>
  );
}

function HomeWrapped(props) {
  return (
    <CardWrapper>
      <HomeScreen {...props} />
    </CardWrapper>
  );
}

const Drawer = createDrawerNavigator();

export default function RootNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(p) => <Sidebar {...p} />}
      screenOptions={{
        headerShown: false, 
        drawerType: "front", 
        overlayColor: "transparent",
        drawerHideStatusBarOnOpen: true,
        drawerStatusBarAnimation: "fade",
        drawerStyle: {
          width: "74%",
          backgroundColor: "transparent",
          zIndex: -10000,
        },
        sceneContainerStyle: {
          backgroundColor: "transparent",
          zIndex: -200000,
        },
        swipeEnabled: false,
        swipeEdgeWidth: 0,
      }}
    >
      <Drawer.Screen name="Home" component={HomeWrapped} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="About" component={AboutScreen} />
      <Drawer.Screen name="Reminder" component={Reminder} />
      <Drawer.Screen name="Feedback" component={Feedback} />
      <Drawer.Screen name="Thanks" component={Thanks} />
      <Drawer.Screen name="Analysis" component={AnalysisScreen} />
      {/* <Drawer.Screen name="About" component={AboutScreen} /> */}
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    zIndex: 200000,
  },

  dim: {
    backgroundColor: "#000",
  },
});
