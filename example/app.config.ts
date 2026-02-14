import { ExpoConfig } from "@expo/config-types";

const config: ExpoConfig = {
  name: "Mapbox Nav Example",
  slug: "mapbox-nav-example",
  version: "1.0.0",
  orientation: "portrait",
  ios: {
    bundleIdentifier: "com.example.mapboxnav",
  },
  android: {
    package: "com.example.mapboxnav",
  },
  plugins: [
    [
      "@baeckerherz/expo-mapbox-navigation/plugin/build",
      {
        mapboxAccessToken: process.env.MAPBOX_PUBLIC_TOKEN || "YOUR_MAPBOX_PUBLIC_TOKEN",
        navigationSdkVersion: "3.5.0",
      },
    ],
  ],
};

export default config;
