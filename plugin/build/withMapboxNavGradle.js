"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withMapboxNavGradle = void 0;
const config_plugins_1 = require("@expo/config-plugins");
/**
 * Adds the authenticated Mapbox Maven repository to the Android
 * project's root build.gradle for Navigation SDK v3 downloads.
 */
const withMapboxNavGradle = (config) => {
    return (0, config_plugins_1.withProjectBuildGradle)(config, (config) => {
        let contents = config.modResults.contents;
        if (!contents.includes("api.mapbox.com/downloads/v2/releases/maven")) {
            const mapboxMaven = `
        // @baeckerherz/expo-mapbox-navigation: Mapbox Navigation SDK Maven repository
        maven {
            url = uri("https://api.mapbox.com/downloads/v2/releases/maven")
            authentication {
                create<BasicAuthentication>("basic")
            }
            credentials {
                username = "mapbox"
                password = providers.gradleProperty("MAPBOX_DOWNLOADS_TOKEN").getOrElse("")
            }
        }`;
            contents = contents.replace(/allprojects\s*\{\s*repositories\s*\{/, `allprojects {\n    repositories {${mapboxMaven}`);
        }
        config.modResults.contents = contents;
        return config;
    });
};
exports.withMapboxNavGradle = withMapboxNavGradle;
