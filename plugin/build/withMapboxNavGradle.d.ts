import { ConfigPlugin } from "@expo/config-plugins";
/**
 * Adds the authenticated Mapbox Maven repository to the Android
 * project's root build.gradle for Navigation SDK v3 downloads.
 * Must be Groovy syntax (Expo's root build.gradle is Groovy, not Kotlin DSL).
 * See: https://docs.mapbox.com/android/navigation/build-with-nav-sdk/installation/
 */
export declare const withMapboxNavGradle: ConfigPlugin;
