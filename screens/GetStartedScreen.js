import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { markGetStartedDone } from "../src/persistence/firstRun";
import { setFirstRunDone } from "../src/persistence/firstRun";

const GetStartedScreen = () => {
  const navigation = useNavigation();

  const onFinish = async () => {
    await setFirstRunDone(true);
    navigation.reset({ index: 0, routes: [{ name: "Splash" }] });
  };

  const handleStart = async () => {
    try {
      await markGetStartedDone();
    } catch {}
    navigation.replace("Main", { screen: "Home" });
  };

  const handleTerms = () => {
    Linking.openURL("https://example.com/terms").catch(() => {});
  };

  const handlePrivacy = () => {
    navigation.navigate("PrivacyPolicy");
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require("../assets/fgets.png")}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.description}>
        Control your day in a reliable, no-hassle way.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Get Started!</Text>
      </TouchableOpacity>

      <View style={styles.linksRow}>
        <TouchableOpacity onPress={handleTerms}>
          {/* <Text style={styles.terms}>Terms & Conditions</Text> */}
        </TouchableOpacity>
        {/* <Text style={{ color: "#D1D5DB", marginHorizontal: 8 }}>•</Text> */}
        <TouchableOpacity onPress={handlePrivacy}>
          <Text style={styles.terms}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default GetStartedScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  imageContainer: { width: "100%", alignItems: "center", marginBottom: 32 },
  heroImage: { width: "100%", height: 280 },
  description: {
    fontSize: 17,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 25,
    marginTop: 15,
  },
  button: {
    backgroundColor: "#2D2B2E",
    paddingVertical: 15,
    paddingHorizontal: 80,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 18,
    textAlign: "center",
    color: "#ffffff",
    fontWeight: "600",
  },
  linksRow: { flexDirection: "row", alignItems: "center" },
  terms: { color: "#9CA3AF", fontSize: 14, textDecorationLine: "underline" },
});
