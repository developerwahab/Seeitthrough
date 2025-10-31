import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from "react-native";

export default function TestingAppOverlap() {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={styles.sideLeft}>
        <Text style={styles.text}>TESTING APP</Text>
      </View>
      <View style={styles.sideRight}>
        <Text style={[styles.text, { transform: [{ rotate: "90deg" }] }]}>
          TESTING APP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject, 
    zIndex: 9999,
  },
  sideLeft: {
    position: "absolute",
    left: -60,
    top: 333,
    bottom: 0,
    justifyContent: "center",
    opacity: 0.2,
  },
  sideRight: {
    position: "absolute",
    right: -60,
    top: 333,
    bottom: 0,
    justifyContent: "center",
    opacity: 0.2,
  },
  text: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
    color: "#1e1e1fff",
    textTransform: "uppercase",
    transform: [{ rotate: "-90deg" }],
  },
});
