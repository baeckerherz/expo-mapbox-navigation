import { ConfigPlugin } from "@expo/config-plugins";
interface PodfileOptions {
    navigationSdkVersion: string;
}
/**
 * Injects a post_install hook that:
 *  1. Adds Mapbox Navigation SDK as an SPM dependency in the Pods project,
 *     linking only MapboxNavigationUIKit to ExpoMapboxNavigation. Using a
 *     single top-level product avoids duplicate xcframework signature copies
 *     during archiving (MapboxCommon appears in multiple transitive chains).
 *  2. Sets FRAMEWORK_SEARCH_PATHS / SWIFT_INCLUDE_PATHS so the pod can find
 *     all SPM-built modules (including transitive deps like MapboxDirections).
 *  3. Enables BUILD_LIBRARY_FOR_DISTRIBUTION on Mapbox/Turf targets.
 */
export declare const withMapboxNavPodfile: ConfigPlugin<PodfileOptions>;
export {};
