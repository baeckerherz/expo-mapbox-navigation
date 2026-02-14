# @baeckerherz/expo-mapbox-navigation

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Expo module wrapping [Mapbox Navigation SDK v3](https://docs.mapbox.com/ios/navigation/guides/) (iOS) / [Android](https://docs.mapbox.com/android/navigation/guides/) for turn-by-turn navigation on iOS and Android. A minimal, maintainable alternative to existing community wrappers.

> **Warning:** This is a prototype under active development. APIs may change. Not recommended for production yet. Contributions and feedback are welcome.

## Table of contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
- [Architecture](#architecture)
- [Why this exists](#why-this-exists)
- [Comparison](#comparison)
- [Status](#status)
- [Contributing](#contributing)
- [License](#license)
- [Sponsors](#sponsors)

## Prerequisites

- [Mapbox account](https://account.mapbox.com/) with Navigation SDK access
- **Public token** (`pk.xxx`) and **secret/download token** (`sk.xxx`)
- **iOS:** Add Mapbox credentials to `~/.netrc` for SPM:

  ```plaintext
  machine api.mapbox.com
    login mapbox
    password YOUR_SECRET_TOKEN
  ```

- **Android:** The plugin writes `mapboxSecretToken` to `android/gradle.properties` as `MAPBOX_DOWNLOADS_TOKEN` so Maven can download the SDK. Use the same plugin config as for iOS.

## Installation

```bash
npx expo install @baeckerherz/expo-mapbox-navigation
```

Add the plugin in `app.config.ts` (or `app.json`). Prefer environment variables for tokens so you don’t commit secrets:

```ts
plugins: [
  ["@baeckerherz/expo-mapbox-navigation/plugin", {
    mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
    mapboxSecretToken: process.env.MAPBOX_SECRET_TOKEN,
    navigationSdkVersion: "3.5.0",
  }],
]
```

Rebuild native projects:

```bash
npx expo prebuild --clean
npx expo run:ios
npx expo run:android
```

## Usage

```tsx
import { MapboxNavigation } from '@baeckerherz/expo-mapbox-navigation';

<MapboxNavigation
  coordinates={[
    { latitude: 47.2692, longitude: 11.4041 },
    { latitude: 48.2082, longitude: 16.3738 },
  ]}
  locale="de"
  onRouteProgressChanged={(e) => {
    console.log(e.nativeEvent.distanceRemaining);
  }}
  onCancelNavigation={() => navigation.goBack()}
  onFinalDestinationArrival={() => console.log('Arrived!')}
  style={{ flex: 1 }}
/>
```

## API

### Props

**Route**

| Prop | Type | Description |
|------|------|-------------|
| `coordinates` | `Array<{ latitude, longitude }>` | Route waypoints (min 2). First = origin, last = destination. |
| `waypointIndices` | `number[]` | Indices in `coordinates` that are full waypoints (with arrival notification). Others are via-points. Must include first and last. |
| `routeProfile` | `string` | Routing profile. iOS: `"mapbox/driving-traffic"` (default), `"mapbox/driving"`, `"mapbox/walking"`, `"mapbox/cycling"`. Android: omit `"mapbox/"` prefix. |

**Localization**

| Prop | Type | Description |
|------|------|-------------|
| `locale` | `string` | BCP 47 language for voice and UI (e.g. `"de"`, `"en-US"`). Default: device locale. |
| `mute` | `boolean` | Mute voice guidance. Default: `false`. |

**Appearance**

| Prop | Type | Description |
|------|------|-------------|
| `mapStyle` | `string` | Mapbox style URL. Example: `"mapbox://styles/mapbox/navigation-night-v1"`. |
| `themeMode` | `"day" \| "night" \| "auto"` | Day (default), night, or auto by time. |
| `accentColor` | `string` | Primary accent (hex). Example: `"#007AFF"`. |
| `routeColor` | `string` | Route line color (hex). Overrides `accentColor` for the line. |
| `bannerBackgroundColor` | `string` | Instruction banner background (hex). |
| `bannerTextColor` | `string` | Instruction banner text (hex). |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `onRouteProgressChanged` | `{ distanceRemaining, durationRemaining, distanceTraveled, fractionTraveled }` | Progress along the route. |
| `onCancelNavigation` | — | User cancelled. |
| `onWaypointArrival` | `{ waypointIndex }` | Reached an intermediate waypoint. |
| `onFinalDestinationArrival` | — | Reached final destination. |
| `onRouteChanged` | — | Route recalculated (reroute). |
| `onUserOffRoute` | — | User left the route. |
| `onError` | `{ message }` | Navigation error. |

## Architecture

**iOS — SPM via config plugin**  
Mapbox Navigation SDK v3 is SPM-only. The Expo config plugin injects SPM package references into the Xcode project at prebuild. Version bumps are a single string change; no vendored xcframeworks.

**Android — Drop-in NavigationView**  
We wrap the Nav SDK v3 `NavigationView` directly instead of rebuilding the UI.

**Both — Expo Module API**  
`expo-modules-core` for native bridging: Fabric/New Architecture, type-safe props and events, and compatibility with Expo and bare React Native.

## Why this exists

Existing wrappers have major drawbacks:

- **@badatgil/expo-mapbox-navigation:** Vendored `.xcframework` on iOS (fragile; manual rebuild per SDK update). Android uses ~30 custom Kotlin components (~1100 LOC) instead of Mapbox’s drop-in view.
- **@homee/react-native-mapbox-navigation:** Unmaintained (no activity since 2022), Nav SDK v2.1.1, no Expo, crashes on Android 13+.

## Comparison

| | This module | @badatgil/expo-mapbox-navigation | @homee/react-native-mapbox-navigation |
|---|---|---|---|
| iOS | SPM via config plugin | Vendored .xcframeworks | CocoaPods, Nav SDK v2 |
| Android | Drop-in NavigationView | Custom UI (~1100 LOC) | Custom UI (~500 LOC) |
| Nav SDK | v3 | v3 | v2 (legacy) |
| Expo Module API | Yes (Fabric-ready) | Yes | No |
| Multi-waypoint | Yes | Yes | No |
| Maintenance | Active | Semi-active | Abandoned |

## Status

**Prototype** — not production-ready. Goals:

1. Reliable SPM injection with Xcode + CocoaPods
2. Sufficient drop-in NavigationView/NavigationViewController integration
3. Event bridging for required use cases

**Known risks**

- **Android:** Drop-in `NavigationView` may need more config for full parity with iOS.
- **Licensing:** Mapbox Navigation SDK requires a commercial Mapbox license; this wrapper does not change that.

## Contributing

We welcome contributors and maintainers. If you work on Expo native modules, Mapbox SDKs, or React Native tooling, we’d love your help.

**Project layout:** `src/` (TypeScript API), `ios/` (Swift + podspec), `android/` (Kotlin + build.gradle), `plugin/` (Expo config plugins), `example/` (test app).

**Run the example:**

```bash
git clone https://github.com/baeckerherz/expo-mapbox-navigation.git
cd expo-mapbox-navigation && yarn install
cd example && yarn install
npx expo prebuild --clean
npx expo run:ios --device   # or: npx expo run:android
```

The example navigates from your location to Innsbruck Hauptbahnhof with German voice guidance.

Open an [issue](https://github.com/baeckerherz/expo-mapbox-navigation/issues) or submit a PR to get started.

## License

[MIT](./LICENSE)

## Sponsors

Sponsored and maintained by teams that use it in production.

<a href="https://github.com/baeckerherz"><img src="https://avatars.githubusercontent.com/u/261656164?s=80&v=4" width="48" alt="Bäckerherz" /></a> **[Bäckerherz](https://github.com/baeckerherz)** — Founding sponsor. They build and use this module; the project exists thanks to their investment in open-source Expo tooling.

To support the project or work with us: [partner@baeckerherz.at](mailto:partner@baeckerherz.at).
