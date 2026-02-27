"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withMapboxNavPodfile_1 = require("./withMapboxNavPodfile");
const withMapboxNavGradle_1 = require("./withMapboxNavGradle");
const withMapboxNavSettingsGradle_1 = require("./withMapboxNavSettingsGradle");
const withMapboxNavGradleProperties_1 = require("./withMapboxNavGradleProperties");
const withMapboxNavigation = (config, { mapboxAccessToken, mapboxSecretToken, navigationSdkVersion = "3.5.0", }) => {
    if (!mapboxAccessToken) {
        throw new Error("[@baeckerherz/expo-mapbox-navigation] mapboxAccessToken is required.");
    }
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
    // iOS: Adds Mapbox Navigation SPM to the Pods project, sets search paths,
    // and adds a script phase to strip duplicate xcframework signatures.
    config = (0, withMapboxNavPodfile_1.withMapboxNavPodfile)(config, { navigationSdkVersion });
    // Android: Mapbox Maven repository (build.gradle and settings.gradle) and optional token
    config = (0, withMapboxNavGradle_1.withMapboxNavGradle)(config);
    config = (0, withMapboxNavSettingsGradle_1.withMapboxNavSettingsGradle)(config);
    config = (0, withMapboxNavGradleProperties_1.withMapboxNavGradleProperties)(config, { mapboxSecretToken });
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withMapboxNavigation, "@baeckerherz/expo-mapbox-navigation", "0.1.0");
