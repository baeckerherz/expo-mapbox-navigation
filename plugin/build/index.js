"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withMapboxNavSPM_1 = require("./withMapboxNavSPM");
const withMapboxNavPodfile_1 = require("./withMapboxNavPodfile");
const withMapboxNavGradle_1 = require("./withMapboxNavGradle");
const withMapboxNavGradleProperties_1 = require("./withMapboxNavGradleProperties");
const withMapboxNavigation = (config, { mapboxAccessToken, mapboxSecretToken, navigationSdkVersion = "3.5.0", }) => {
    if (!mapboxAccessToken) {
        throw new Error("[@baeckerherz/expo-mapbox-navigation] mapboxAccessToken is required.");
    }
    // Inject MBXAccessToken and required background modes into Info.plist
    if (!config.ios)
        config.ios = {};
    if (!config.ios.infoPlist)
        config.ios.infoPlist = {};
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
    config = (0, withMapboxNavSPM_1.withMapboxNavSPM)(config, { navigationSdkVersion });
    // iOS: Patch Podfile so ExpoMapboxNavigation pod has Mapbox SPM dependency
    config = (0, withMapboxNavPodfile_1.withMapboxNavPodfile)(config, { navigationSdkVersion });
    // Android: Mapbox Maven repository and optional token for SDK download
    config = (0, withMapboxNavGradle_1.withMapboxNavGradle)(config);
    config = (0, withMapboxNavGradleProperties_1.withMapboxNavGradleProperties)(config, { mapboxSecretToken });
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withMapboxNavigation, "@baeckerherz/expo-mapbox-navigation", "0.1.0");
