import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MapboxNavigation } from "@baeckerherz/expo-mapbox-navigation";

// Hardcoded: Innsbruck Hauptbahnhof to Innsbruck Altstadt
const ORIGIN = { latitude: 47.2632, longitude: 11.401 };
const DESTINATION = { latitude: 47.2685, longitude: 11.3933 };

export default function App() {
  const [navigating, setNavigating] = useState(false);

  if (navigating) {
    return (
      <View style={styles.container}>
        <MapboxNavigation
          coordinates={[ORIGIN, DESTINATION]}
          locale="de"
          onCancelNavigation={() => setNavigating(false)}
          onFinalDestinationArrival={() => {
            console.log("Arrived!");
            setNavigating(false);
          }}
          onRouteProgressChanged={(e) => {
            const d = e.nativeEvent;
            console.log(
              `${(d.distanceRemaining / 1000).toFixed(1)} km remaining`
            );
          }}
          onError={(e) => console.error("Nav error:", e.nativeEvent.message)}
          style={styles.container}
        />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Mapbox Nav Prototype</Text>
      <Text style={styles.sub}>
        Innsbruck Hbf → Altstadt{"\n"}
        Tap below to start navigation
      </Text>
      <Pressable style={styles.btn} onPress={() => setNavigating(true)}>
        <Text style={styles.btnText}>Start Navigation</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
    backgroundColor: "#F5F5F5",
  },
  title: { fontSize: 28, fontWeight: "800", color: "#1A1A1A" },
  sub: { fontSize: 15, color: "#666", textAlign: "center", lineHeight: 22 },
  btn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  btnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },
});
