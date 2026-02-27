import { withProjectBuildGradle, ConfigPlugin } from "@expo/config-plugins";

/**
 * Adds the authenticated Mapbox Maven repository to the Android
 * project's root build.gradle for Navigation SDK v3 downloads.
 * Must be Groovy syntax (Expo's root build.gradle is Groovy, not Kotlin DSL).
 * See: https://docs.mapbox.com/android/navigation/build-with-nav-sdk/installation/
 */
export const withMapboxNavGradle: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes("api.mapbox.com/downloads/v2/releases/maven")) {
      const mapboxMaven = `
        // @baeckerherz/expo-mapbox-navigation: Mapbox Navigation SDK Maven repository
        maven {
            url = uri("https://api.mapbox.com/downloads/v2/releases/maven")
            authentication {
                basic(BasicAuthentication)
            }
            credentials {
                username = "mapbox"
                password = project.findProperty("MAPBOX_DOWNLOADS_TOKEN") ?: System.getenv("MAPBOX_DOWNLOADS_TOKEN") ?: ""
            }
        }`;

      contents = contents.replace(
        /allprojects\s*\{\s*repositories\s*\{/,
        `allprojects {\n    repositories {${mapboxMaven}`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};
