import { withGradleProperties, ConfigPlugin } from "@expo/config-plugins";

/**
 * Injects MAPBOX_DOWNLOADS_TOKEN into android/gradle.properties so the
 * Mapbox Maven repository can authenticate when resolving Navigation SDK.
 */
export const withMapboxNavGradleProperties: ConfigPlugin<{
  mapboxSecretToken?: string;
}> = (config, { mapboxSecretToken }) => {
  if (!mapboxSecretToken) return config;

  return withGradleProperties(config, (config) => {
    const key = "MAPBOX_DOWNLOADS_TOKEN";
    const existing = config.modResults.find(
      (item) => item.type === "property" && item.key === key
    );
    if (existing && existing.type === "property") {
      existing.value = mapboxSecretToken;
    } else {
      config.modResults.push({
        type: "property",
        key,
        value: mapboxSecretToken,
      });
    }
    return config;
  });
};
