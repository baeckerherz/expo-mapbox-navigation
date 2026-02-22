import { ConfigPlugin } from "@expo/config-plugins";
interface PodfileOptions {
    navigationSdkVersion: string;
}
/**
 * Patches the iOS Podfile to add Mapbox Navigation SPM to the Pods project
 * and link it to the ExpoMapboxNavigation pod target, so the pod compiles
 * with the modules available (works on EAS and locally). Also sets
 * BUILD_LIBRARY_FOR_DISTRIBUTION for Mapbox-related pods.
 */
export declare const withMapboxNavPodfile: ConfigPlugin<PodfileOptions>;
export {};
