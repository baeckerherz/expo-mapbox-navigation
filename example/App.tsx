import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { MapboxNavigation } from "@baeckerherz/expo-mapbox-navigation";

const ORIGIN = { latitude: 47.2632, longitude: 11.401 };
const STOP_A = { latitude: 47.2685, longitude: 11.3933 };
const STOP_B = { latitude: 47.265, longitude: 11.395 };

export default function App() {
  const [navigating, setNavigating] = useState(false);
  const [legIndex, setLegIndex] = useState(0);

  const coordinates = useMemo(() => {
    if (legIndex === 0) return [ORIGIN, STOP_A];
    return [ORIGIN, STOP_B];
  }, [legIndex]);

  if (navigating) {
    return (
      <View style={styles.container} testID="navigation-screen">
        <MapboxNavigation
          testID="mapbox-navigation"
          coordinates={coordinates}
          waypointIndices={[0, 1]}
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
        <View style={styles.overlay}>
          <Pressable
            testID="next-stop"
            style={styles.overlayBtn}
            onPress={() => setLegIndex((i) => (i === 0 ? 1 : 0))}
          >
            <Text style={styles.overlayBtnText}>
              Next stop (route refresh test)
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Mapbox Nav Prototype</Text>
      <Text style={styles.sub}>
        Innsbruck Hbf → Stop A / Stop B{"\n"}
        Tap to start, then "Next stop" to test route refresh
      </Text>
      <Pressable
        testID="start-navigation"
        style={styles.btn}
        onPress={() => setNavigating(true)}
      >
        <Text style={styles.btnText}>Start Navigation</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  overlayBtn: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  overlayBtnText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
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
