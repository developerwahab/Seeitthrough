// components/Sidebar.js
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Ionicons /*, Feather*/ } from "@expo/vector-icons";
import { isPaid as isPro, onProChange } from "../src/payments/store";

const Item = ({ icon, label, onPress }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.item}>
    <View style={styles.itemIcon}>{icon}</View>
    <Text style={styles.itemText}>{label}</Text>
  </TouchableOpacity>
);

export default function Sidebar({ navigation }) {
  const [pro, setPro] = React.useState(isPro());
  React.useEffect(() => onProChange(setPro), []);

  const avatarUri =
    "https://raw.githubusercontent.com/rdimascio/icons/master/avatar/3d-emoji-boy.png";

  const go = (name) => {
    navigation.closeDrawer?.();
    navigation.navigate(name);
  };

  return (
    <DrawerContentScrollView contentContainerStyle={{ flex: 1, paddingTop: 0 }}>
      <View style={{ gap: 10, marginTop: 220 }}>
        <Item
          label="About"
          icon={
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#111827"
            />
          }
          onPress={() => go("About")}
        />

        <Item
          label="Calendar"
          icon={<Ionicons name="calendar-outline" size={18} color="#111827" />}
          onPress={() => go("Calendar")}
        />

        <Item
          //  / Unlock Pro
          label={pro ? "Pro Active" : "Say Thanks"}
          icon={<Ionicons name="heart-outline" size={18} color="#111827" />}
          onPress={() => {
            navigation.closeDrawer?.();
            navigation.navigate("UnlockPro");
          }}
        />

        <Item
          label="Settings"
          icon={<Ionicons name="settings-outline" size={18} color="#111827" />}
          onPress={() => go("Settings")}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const R = 30;
const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: "transparent",
    marginLeft: 102,
    paddingHorizontal: 18,
    paddingTop: 200,
    paddingBottom: 160,
    borderTopRightRadius: R,
    borderBottomRightRadius: R,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEF1F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemText: { fontSize: 16, fontWeight: "600", color: "#111827" },
});
