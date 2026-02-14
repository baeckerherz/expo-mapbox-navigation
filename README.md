# @baeckerherz/expo-mapbox-navigation

> **WARNING: This is a prototype and actively under development.** APIs may change without notice. Not recommended for production use yet. Contributions and feedback are welcome.

Expo module wrapping [Mapbox Navigation SDK v3](https://docs.mapbox.com/ios/navigation/guides/) for iOS and Android. A clean, maintainable alternative to existing community wrappers.

## Why this exists

Existing React Native / Expo wrappers for Mapbox Navigation have significant issues:

- **@badatgil/expo-mapbox-navigation**: Bundles vendored `.xcframework` files for iOS (fragile, requires manual rebuild for every Mapbox SDK update). Android assembles the navigation UI from ~30 individual components in ~1100 lines of Kotlin instead of using Mapbox's drop-in view.
- **@homee/react-native-mapbox-navigation**: Abandoned (no activity since 2022), locked to Nav SDK v2.1.1, no Expo support, crashes on Android 13+.

## Architecture

### iOS: SPM via Config Plugin (not vendored xcframeworks)

Mapbox Navigation SDK v3 for iOS dropped CocoaPods and only supports Swift Package Manager. Since Expo uses CocoaPods, we use an **Expo config plugin** that injects SPM package references into the Xcode project's `.pbxproj` at prebuild time. Version bumps are a single string change -- no manual xcframework rebuilding.

### Android: Drop-in NavigationView

Android Nav SDK v3 provides a `NavigationView` drop-in component. We wrap it directly instead of rebuilding the UI from scratch.

### Both platforms: Expo Module API

Uses `expo-modules-core` for native bridging, giving us:
- Fabric / New Architecture compatibility
- Type-safe props and events in Swift/Kotlin
- Clean `EventDispatcher` pattern
- Works in Expo and bare RN projects

## API

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

### Props

#### Route

| Prop | Type | Description |
|------|------|-------------|
| `coordinates` | `Array<{ latitude, longitude }>` | Route waypoints (min 2). First = origin, last = destination. |
| `waypointIndices` | `number[]` | Indices into `coordinates` treated as full waypoints (with arrival notification). Others are silent via-points. Must include first and last index. |
| `routeProfile` | `string` | Mapbox routing profile. iOS: `"mapbox/driving-traffic"` (default), `"mapbox/driving"`, `"mapbox/walking"`, `"mapbox/cycling"`. Android: omit the `"mapbox/"` prefix. |

#### Localization

| Prop | Type | Description |
|------|------|-------------|
| `locale` | `string` | BCP 47 language tag for voice guidance, maneuver instructions, and UI labels (e.g. `"de"`, `"en-US"`). Default: device locale. |
| `mute` | `boolean` | Mute voice guidance. Default: `false`. |

#### Appearance

| Prop | Type | Description |
|------|------|-------------|
| `mapStyle` | `string` | Custom Mapbox map style URL. Overrides the default navigation style. Example: `"mapbox://styles/mapbox/navigation-night-v1"`. |
| `themeMode` | `"day" \| "night" \| "auto"` | Controls day/night map appearance. `"day"` (default): light map. `"night"`: dark 3D map. `"auto"`: switches based on time of day. |
| `accentColor` | `string` | Primary accent color (hex). Applied to route line, floating buttons, and interactive elements. Example: `"#007AFF"`. |
| `routeColor` | `string` | Route line color (hex). Overrides `accentColor` for the route line only. Example: `"#4264fb"`. |
| `bannerBackgroundColor` | `string` | Instruction banner background color (hex). Example: `"#FFFFFF"` for light, `"#1A1A2E"` for dark. |
| `bannerTextColor` | `string` | Instruction banner text color (hex). Example: `"#000000"`. |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `onRouteProgressChanged` | `{ distanceRemaining, durationRemaining, distanceTraveled, fractionTraveled }` | Fires as the user progresses along the route. |
| `onCancelNavigation` | — | User tapped cancel / back. |
| `onWaypointArrival` | `{ waypointIndex }` | Arrived at an intermediate waypoint. |
| `onFinalDestinationArrival` | — | Arrived at the final destination. |
| `onRouteChanged` | — | Route was recalculated (reroute). |
| `onUserOffRoute` | — | User went off the planned route. |
| `onError` | `{ message }` | Navigation error occurred. |

## Installation (for consumers)

```bash
npx expo install @baeckerherz/expo-mapbox-navigation
```

Add the plugin to `app.config.ts`:

```ts
plugins: [
  ["@baeckerherz/expo-mapbox-navigation/plugin", {
    mapboxAccessToken: "pk.eyJ1...",
    mapboxSecretToken: "sk.eyJ1...",  // for SPM download auth
    navigationSdkVersion: "3.5.0",
  }],
]
```

Rebuild native:

```bash
npx expo prebuild --clean
npx expo run:ios
```

## Development

```bash
cd @baeckerherz/expo-mapbox-navigation
yarn install
cd example && npx expo run:ios
```

## Project Structure

```
src/            TypeScript API (component, types, exports)
ios/            Swift native module + podspec
android/        Kotlin native module + build.gradle
plugin/         Expo config plugins (SPM injection, Gradle setup)
example/        Test app
```

## Prerequisites

1. A [Mapbox account](https://account.mapbox.com/) with Navigation SDK access
2. A public access token (`pk.xxx`) and a secret/download token (`sk.xxx`)
3. For iOS: `~/.netrc` must contain Mapbox credentials for SPM package resolution:

```
machine api.mapbox.com
  login mapbox
  password sk.eyJ1...YOUR_SECRET_TOKEN
```

## How to test the example app

```bash
cd @baeckerherz/expo-mapbox-navigation/example
yarn install
npx expo prebuild --clean
npx expo run:ios --device
```

The example app navigates from your current location to Innsbruck Hauptbahnhof with German voice guidance.

## Publishing to npm

```bash
npm login
npm publish --access public
```

Consumers install with:

```bash
npx expo install @baeckerherz/expo-mapbox-navigation
```

## Key differences from existing wrappers

| | This module | @badatgil/expo-mapbox-navigation | @homee/react-native-mapbox-navigation |
|---|---|---|---|
| iOS SDK integration | SPM via config plugin (clean version bumps) | Vendored .xcframeworks (manual rebuild per update) | CocoaPods pinned to Nav SDK v2 |
| Android approach | Drop-in NavigationView | Custom UI from ~30 components (~1100 LOC) | Custom UI (~500 LOC) |
| Nav SDK version | v3 (current) | v3 | v2 (legacy) |
| Expo Module API | Yes (Fabric-ready) | Yes | No (legacy bridge) |
| Multi-waypoint | Yes | Yes | No (origin + destination only) |
| Maintenance | Active | Semi-active | Abandoned |

## Status

**Prototype** — not production-ready. This is a proof of concept to validate:

1. SPM injection via config plugin works reliably with Xcode + CocoaPods
2. Drop-in NavigationView/NavigationViewController integration is sufficient
3. Event bridging covers the required use cases

### Known risks

- **Android NavigationView completeness**: The drop-in `NavigationView` in Android Nav SDK v3 may require additional configuration for full feature parity with iOS.
- **Mapbox licensing**: The Navigation SDK requires a commercial Mapbox license for production use. This wrapper does not change that requirement.

---

## Contributors

We're looking for **contributors and maintainers** to help shape this project. If you're interested in working on Expo native modules, Mapbox SDKs, or React Native tooling — we'd love to have you on board.

Check out the [issues](https://github.com/baeckerherz/expo-mapbox-navigation/issues) or open a PR to get started.

---

## Sponsors

This project is sponsored and maintained by the teams that use it in production.

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/baeckerherz">
        <img src="https://avatars.githubusercontent.com/u/261656164?s=200&v=4" width="100" alt="Bäckerherz" />
        <br />
        <strong>Bäckerherz</strong>
      </a>
      <br />
      <em>Founding Sponsor</em>
    </td>
  </tr>
</table>

Bäckerherz builds and uses this module in their own apps. This project exists because of their investment in open-source tooling for the Expo ecosystem.

**Become a sponsor** — help us keep this project maintained and growing. Reach out at [partner@baeckerherz.at](mailto:partner@baeckerherz.at).

---

## Need help building something?

We build mobile apps, backend systems, and custom integrations using Expo, React Native, and more. If you need a team that ships — get in touch at [partner@baeckerherz.at](mailto:partner@baeckerherz.at).
