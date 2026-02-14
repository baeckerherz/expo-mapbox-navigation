import { ConfigPlugin } from "@expo/config-plugins";
/**
 * Patches the iOS Podfile to make SPM framework products visible
 * to the ExpoMapboxNavigation pod target, and sets BUILD_LIBRARY_FOR_DISTRIBUTION
 * for Mapbox-related pods.
 */
export declare const withMapboxNavPodfile: ConfigPlugin;
