"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withMapboxNavSettingsGradle = void 0;
const config_plugins_1 = require("@expo/config-plugins");
/**
 * Adds the Mapbox Maven repository to settings.gradle when the project uses
 * dependencyResolutionManagement (e.g. FAIL_ON_PROJECT_REPOS). In that mode
 * project-level repositories are ignored, so the root build.gradle injection
 * is not enough and we must add the repo here.
 * Uses env MAPBOX_DOWNLOADS_TOKEN so EAS Build and local builds can supply the secret.
 */
const withMapboxNavSettingsGradle = (config) => {
    return (0, config_plugins_1.withSettingsGradle)(config, (config) => {
        let contents = config.modResults.contents;
        if (contents.includes("api.mapbox.com/downloads/v2/releases/maven")) {
            return config;
        }
        if (!contents.includes("dependencyResolutionManagement") ||
            !contents.includes("repositories {")) {
            return config;
        }
        const mapboxMaven = `
        // @baeckerherz/expo-mapbox-navigation: Mapbox Navigation SDK Maven repository
        maven {
            url = uri("https://api.mapbox.com/downloads/v2/releases/maven")
            authentication {
                basic(BasicAuthentication)
            }
            credentials {
                username = "mapbox"
                password = (System.getenv("MAPBOX_DOWNLOADS_TOKEN") ?: "")
            }
        }`;
        contents = contents.replace(/(repositories\s*\{)/, `$1${mapboxMaven}`);
        config.modResults.contents = contents;
        return config;
    });
};
exports.withMapboxNavSettingsGradle = withMapboxNavSettingsGradle;
