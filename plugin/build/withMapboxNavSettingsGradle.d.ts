import { ConfigPlugin } from "@expo/config-plugins";
/**
 * Adds the Mapbox Maven repository to settings.gradle when the project uses
 * dependencyResolutionManagement (e.g. FAIL_ON_PROJECT_REPOS). In that mode
 * project-level repositories are ignored, so the root build.gradle injection
 * is not enough and we must add the repo here.
 * Uses env MAPBOX_DOWNLOADS_TOKEN so EAS Build and local builds can supply the secret.
 */
export declare const withMapboxNavSettingsGradle: ConfigPlugin;
