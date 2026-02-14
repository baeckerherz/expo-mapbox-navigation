import type { ViewProps } from "react-native";

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteProgressEvent {
  distanceRemaining: number;
  durationRemaining: number;
  distanceTraveled: number;
  fractionTraveled: number;
}

export interface WaypointArrivalEvent {
  waypointIndex: number;
}

export interface NavigationErrorEvent {
  message: string;
}

export interface MapboxNavigationProps extends ViewProps {
  // -- Route --

  /**
   * Array of coordinates defining the route.
   * Minimum 2 points (origin + destination). Intermediate points become waypoints.
   */
  coordinates: Coordinate[];

  /**
   * Indices into `coordinates` that should be treated as full waypoints
   * (with arrival notification). All others are silent via-points.
   * Must include the first and last index.
   */
  waypointIndices?: number[];

  /**
   * Mapbox routing profile.
   * iOS: "mapbox/driving-traffic" (default), "mapbox/driving", "mapbox/walking", "mapbox/cycling"
   * Android: omit the "mapbox/" prefix.
   */
  routeProfile?: string;

  // -- Localization --

  /**
   * Language for voice guidance, maneuver instructions, and UI labels.
   * BCP 47 language tag (e.g. "de", "en-US"). Defaults to device locale.
   */
  locale?: string;

  /** Mute voice guidance. Default: false. */
  mute?: boolean;

  // -- Appearance --

  /**
   * Custom Mapbox map style URL. Overrides the default navigation style.
   * Example: "mapbox://styles/mapbox/navigation-night-v1"
   */
  mapStyle?: string;

  /**
   * Controls day/night map appearance.
   * - "day": Light map (default)
   * - "night": Dark 3D map (like Google/Apple Maps night mode)
   * - "auto": Automatic switching based on time of day
   */
  themeMode?: "day" | "night" | "auto";

  /**
   * Primary accent color (hex). Applied to route line, floating buttons,
   * and interactive elements. Example: "#007AFF"
   */
  accentColor?: string;

  /**
   * Route line color (hex). Overrides accentColor for the route line only.
   * Example: "#4264fb"
   */
  routeColor?: string;

  /**
   * Instruction banner background color (hex).
   * Example: "#FFFFFF" for white, "#1A1A2E" for dark.
   */
  bannerBackgroundColor?: string;

  /**
   * Instruction banner text color (hex). Example: "#000000"
   */
  bannerTextColor?: string;

  // -- Events --

  /** Fires continuously as the user progresses along the route. */
  onRouteProgressChanged?: (event: {
    nativeEvent: RouteProgressEvent;
  }) => void;

  /** User tapped the cancel / close button. The library does NOT auto-dismiss. */
  onCancelNavigation?: () => void;

  /** Arrived at an intermediate waypoint. */
  onWaypointArrival?: (event: {
    nativeEvent: WaypointArrivalEvent;
  }) => void;

  /** Arrived at the final destination. */
  onFinalDestinationArrival?: () => void;

  /** Route was recalculated (e.g. reroute after going off-route). */
  onRouteChanged?: () => void;

  /** User deviated from the planned route. */
  onUserOffRoute?: () => void;

  /** A navigation error occurred. */
  onError?: (event: { nativeEvent: NavigationErrorEvent }) => void;
}
