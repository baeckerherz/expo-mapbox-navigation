"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withMapboxNavGradleProperties = void 0;
const config_plugins_1 = require("@expo/config-plugins");
/**
 * Injects MAPBOX_DOWNLOADS_TOKEN into android/gradle.properties so the
 * Mapbox Maven repository can authenticate when resolving Navigation SDK.
 */
const withMapboxNavGradleProperties = (config, { mapboxSecretToken }) => {
    if (!mapboxSecretToken)
        return config;
    return (0, config_plugins_1.withGradleProperties)(config, (config) => {
        const key = "MAPBOX_DOWNLOADS_TOKEN";
        const existing = config.modResults.find((item) => item.type === "property" && item.key === key);
        if (existing && existing.type === "property") {
            existing.value = mapboxSecretToken;
        }
        else {
            config.modResults.push({
                type: "property",
                key,
                value: mapboxSecretToken,
            });
        }
        return config;
    });
};
exports.withMapboxNavGradleProperties = withMapboxNavGradleProperties;
