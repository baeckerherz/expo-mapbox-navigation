import * as React from "react";
import { requireNativeViewManager } from "expo-modules-core";
import type { MapboxNavigationProps } from "./types";

const NativeView: React.ComponentType<MapboxNavigationProps> =
  requireNativeViewManager("ExpoMapboxNavigation");

/**
 * Full-screen Mapbox turn-by-turn navigation view.
 *
 * Renders the native Mapbox Navigation SDK UI (NavigationViewController on iOS,
 * NavigationView on Android) with voice guidance, maneuver banners, and rerouting.
 */
export default function MapboxNavigation(props: MapboxNavigationProps) {
  return <NativeView {...props} />;
}
