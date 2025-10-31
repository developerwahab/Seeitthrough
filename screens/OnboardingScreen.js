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
import { markOnboardingDone } from "../src/persistence/firstRun";

const { width, height } = Dimensions.get("window");

const slides = [
  {
    title: "This is not a normal to-do list",
    // subtitle: "I provide essential stuff for your UI designs every Tuesday!",
    image: require("../assets/onboarding1.png"),
  },
  {
    title: "You won’t be coddled. You’ll be challenged.",
    // subtitle: "No fluffy motivation here — just pressure.",
    image: require("../assets/onboarding2.png"),
  },
  {
    title: "You said you wanted this. Let’s begin.",
    // subtitle: "Now prove it. Get started now.",
    image: require("../assets/onboarding3.png"),
  },
];

export default function OnboardingScreen({ navigation }) {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);

  const isLast = index === slides.length - 1;

  const onNext = async () => {
    if (!isLast) {
      ref.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      await markOnboardingDone();
      navigation.navigate("GetStarted");
    }
  };

  const onSkip = async () => {
    await markOnboardingDone();
    navigation.navigate("GetStarted");
  };

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <Image source={item.image} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* {Testing app Sides left right} */}
      {/* <View
    pointerEvents="none"
    style={{
      position: "absolute",
      left: -65,
      top: height / 2,
      transform: [{ translateY: -12 }, { rotate: "-90deg" }],
      zIndex: 1,
      opacity: 0.18,
    }}
  >
    <Text style={{ fontSize: 25, fontWeight: "900", letterSpacing: 3, color: "#1e1e1fff", textTransform: "uppercase" }}>
      TESTING APP
    </Text>
  </View>

  <View
    pointerEvents="none"
    style={{
      position: "absolute",
      right: -65,
      top: height / 2,
      transform: [{ translateY: -12 }, { rotate: "90deg" }],
      zIndex: 1,
      opacity: 0.20,
    }}
  >
    <Text style={{ fontSize: 25, fontWeight: "900", letterSpacing: 3, color: "#1e1e1fff", textTransform: "uppercase" }}>
      TESTING APP
    </Text>
  </View>
 */}

      <FlatList
        ref={ref}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / width);
          setIndex(i);
        }}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({
          length: width,
          offset: width * i,
          index: i,
        })} // prevents scrollToIndex warnings
      />

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, index === i && styles.activeDot]} />
        ))}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipbuttonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNext}>
          <Text style={styles.buttonText}>{isLast ? "Start" : "Next"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  slide: { width, alignItems: "center", padding: 30, justifyContent: "center" },
  image: { width: width * 0.8, height: height * 0.3, marginBottom: 30 },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2D2B2E",
    textAlign: "center",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: "#777777ff",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  dots: { flexDirection: "row", justifyContent: "center", marginBottom: 40 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    margin: 5,
  },
  activeDot: { backgroundColor: "#2D2B2E" },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    marginBottom: 50,
  },
  buttonText: { fontSize: 17, color: "#2D2B2E" },
  skipbuttonText: { fontSize: 17, color: "#777777ff" },
});
