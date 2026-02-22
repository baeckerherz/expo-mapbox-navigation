import { ConfigPlugin, createRunOncePlugin } from "@expo/config-plugins";
import { withMapboxNavSPM } from "./withMapboxNavSPM";
import { withMapboxNavPodfile } from "./withMapboxNavPodfile";
import { withMapboxNavGradle } from "./withMapboxNavGradle";
import { withMapboxNavGradleProperties } from "./withMapboxNavGradleProperties";

interface PluginConfig {
  /** Mapbox public access token (pk.xxx). Required for the native SDK. */
  mapboxAccessToken: string;

  /** Mapbox secret/download token (sk.xxx). Required for SPM and Maven auth. */
  mapboxSecretToken?: string;

  /** Mapbox Navigation SDK version. Default: "3.5.0" */
  navigationSdkVersion?: string;
}

const withMapboxNavigation: ConfigPlugin<PluginConfig> = (
  config,
  {
    mapboxAccessToken,
    mapboxSecretToken,
    navigationSdkVersion = "3.5.0",
  }
) => {
  if (!mapboxAccessToken) {
    throw new Error(
      "[@baeckerherz/expo-mapbox-navigation] mapboxAccessToken is required."
    );
  }

  // Inject MBXAccessToken and required background modes into Info.plist
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.MBXAccessToken = mapboxAccessToken;
  config.ios.infoPlist.UIBackgroundModes = [
    ...(config.ios.infoPlist.UIBackgroundModes || []),
    "audio",
    "location",
  ];
  config.ios.infoPlist.NSLocationWhenInUseUsageDescription =
    config.ios.infoPlist.NSLocationWhenInUseUsageDescription ||
    "This app needs your location for turn-by-turn navigation.";
  config.ios.infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription =
    config.ios.infoPlist.NSLocationAlwaysAndWhenInUseUsageDescription ||
    "This app needs your location for turn-by-turn navigation, including in the background.";

  // iOS: Inject SPM package references
  config = withMapboxNavSPM(config, { navigationSdkVersion });

  // iOS: Patch Podfile so ExpoMapboxNavigation pod has Mapbox SPM dependency
  config = withMapboxNavPodfile(config, { navigationSdkVersion });

  // Android: Mapbox Maven repository and optional token for SDK download
  config = withMapboxNavGradle(config);
  config = withMapboxNavGradleProperties(config, { mapboxSecretToken });

  return config;
};

export default createRunOncePlugin(
  withMapboxNavigation,
  "@baeckerherz/expo-mapbox-navigation",
  "0.1.0"
);
